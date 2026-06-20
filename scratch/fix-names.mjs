import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 4000),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
    };
  } catch {
    return null;
  }
}

function dbConfig() {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL || "");
  return {
    host: process.env.TIDB_HOST || fromUrl?.host,
    port: Number(process.env.TIDB_PORT || fromUrl?.port || 4000),
    user: process.env.TIDB_USER || fromUrl?.user,
    password: process.env.TIDB_PASSWORD || fromUrl?.password,
    database: process.env.TIDB_DATABASE || fromUrl?.database,
  };
}

async function main() {
  const cfg = dbConfig();
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.database) {
    throw new Error("Configuração TiDB ausente. Verifique .env.");
  }

  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    // 1. List current names matching the pattern with uppercase accented characters like AO, OR, etc.
    const [students] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo FROM pmam_students"
    );

    console.log("Alunos com possíveis problemas de acentuação (contendo letras maiúsculas no meio do nome):");
    
    // We want to find names containing things like "ÃO" or "ÓR" or any capital letter that shouldn't be capital.
    // Specifically, let's look for "ÃO", "ÓR", "É", "Í", "Ú", "Â", "Ê", "Ô", etc. inside words.
    // Or just look for specific students requested by the user:
    // Nathalie CatÃO Ramos -> Nathalie Catão Ramos
    // Maria VitÓRia Rodrigues Bezerra -> Maria Vitória Rodrigues Bezerra
    
    const targets = [
      { wrong: "Nathalie CatÃO Ramos", right: "Nathalie Catão Ramos" },
      { wrong: "Maria VitÓRia Rodrigues Bezerra", right: "Maria Vitória Rodrigues Bezerra" }
    ];

    for (const student of students) {
      let needsFix = false;
      let fixedNomeCompleto = student.nome_completo;
      let fixedNomeGuerra = student.nome_guerra;

      // Check if it matches our specific targets or has a uppercase letter after another uppercase/lowercase transition
      for (const target of targets) {
        if (student.nome_completo && student.nome_completo.includes(target.wrong)) {
          fixedNomeCompleto = student.nome_completo.replace(target.wrong, target.right);
          needsFix = true;
        }
        if (student.nome_guerra && student.nome_guerra.includes(target.wrong)) {
          fixedNomeGuerra = student.nome_guerra.replace(target.wrong, target.right);
          needsFix = true;
        }
      }

      // Check more generally for uppercase characters like CatÃO, VitÓRia, or other accents followed by uppercase.
      // In PT-BR, a capital letter shouldn't be immediately followed by another capital letter in the middle of a word
      // unless it's an acronym or all-caps. Since these are title-cased names, let's detect words with mixed case like CatÃO or VitÓRia.
      if (student.nome_completo) {
        // e.g. "CatÃO", "VitÓRia". Let's match words that have lowercase, followed by uppercase accent or letter, followed by uppercase.
        // Wait, simpler: let's look for known corruptions like CatÃO -> Catão, VitÓRia -> Vitória, or other cases.
        // Let's print any student whose name has capital letters that aren't the start of a word.
        const words = student.nome_completo.split(" ");
        let wordFixed = false;
        const fixedWords = words.map(word => {
          // If a word starts with an uppercase and has uppercase letters in the middle/end (but not all uppercase if long)
          if (word.length > 2 && word === word.toUpperCase()) {
            // All uppercase, maybe it's fine (like "DE", "DA"? No, title case would be "De", "Da").
            // But let's check for specific suffixes like "ÃO" -> "ão", "ÓR" -> "ór", "ÓRIA" -> "ória", "ÉIA" -> "éia", "ÃO" -> "ão".
            return word;
          }
          
          // Let's replace CatÃO -> Catão, VitÓRia -> Vitória, or similar.
          let newWord = word;
          if (newWord.includes("CatÃO")) newWord = newWord.replace("CatÃO", "Catão");
          if (newWord.includes("VitÓRia")) newWord = newWord.replace("VitÓRia", "Vitória");
          if (newWord.includes("VitÓria")) newWord = newWord.replace("VitÓria", "Vitória");
          if (newWord.includes("CATÃO")) newWord = newWord.replace("CATÃO", "Catão");
          if (newWord.includes("VITÓRIA")) newWord = newWord.replace("VITÓRIA", "Vitória");
          
          // General replacements of common boundaries
          // e.g. "ÃO" at the end of word or middle -> "ão"
          if (/[a-zà-ú]ÃO/i.test(newWord)) {
            newWord = newWord.replace(/([a-zà-ú])ÃO/gi, "$1ão");
          }
          if (/[a-zà-ú]ÓR/i.test(newWord)) {
            newWord = newWord.replace(/([a-zà-ú])ÓR/gi, "$1ór");
          }
          
          if (newWord !== word) {
            wordFixed = true;
          }
          return newWord;
        });

        if (wordFixed) {
          fixedNomeCompleto = fixedWords.join(" ");
          needsFix = true;
        }
      }

      if (student.nome_guerra) {
        const words = student.nome_guerra.split(" ");
        let wordFixed = false;
        const fixedWords = words.map(word => {
          let newWord = word;
          if (newWord.includes("CatÃO")) newWord = newWord.replace("CatÃO", "Catão");
          if (newWord.includes("VitÓRia")) newWord = newWord.replace("VitÓRia", "Vitória");
          if (newWord.includes("VitÓria")) newWord = newWord.replace("VitÓria", "Vitória");
          if (newWord.includes("CATÃO")) newWord = newWord.replace("CATÃO", "Catão");
          if (newWord.includes("VITÓRIA")) newWord = newWord.replace("VITÓRIA", "Vitória");
          if (/[a-zà-ú]ÃO/i.test(newWord)) {
            newWord = newWord.replace(/([a-zà-ú])ÃO/gi, "$1ão");
          }
          if (/[a-zà-ú]ÓR/i.test(newWord)) {
            newWord = newWord.replace(/([a-zà-ú])ÓR/gi, "$1ór");
          }
          if (newWord !== word) {
            wordFixed = true;
          }
          return newWord;
        });

        if (wordFixed) {
          fixedNomeGuerra = fixedWords.join(" ");
          needsFix = true;
        }
      }

      if (needsFix) {
        console.log(`Fixing student ID ${student.id} (${student.numerica}):`);
        console.log(`  Guerra:   "${student.nome_guerra}" -> "${fixedNomeGuerra}"`);
        console.log(`  Completo: "${student.nome_completo}" -> "${fixedNomeCompleto}"`);

        await connection.execute(
          "UPDATE pmam_students SET nome_guerra = ?, nome_completo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [fixedNomeGuerra, fixedNomeCompleto, student.id]
        );
        
        // Also check if they are in pmam_users and update the user name
        const [users] = await connection.execute(
          "SELECT id FROM pmam_users WHERE student_id = ?",
          [student.id]
        );
        if (users.length > 0) {
          console.log(`  Updating mirrored user name to "${fixedNomeGuerra}"`);
          await connection.execute(
            "UPDATE pmam_users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ?",
            [fixedNomeGuerra, student.id]
          );
        }
      }
    }

    console.log("Processamento concluído.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
