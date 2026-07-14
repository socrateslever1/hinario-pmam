const fs = require('fs');

function refactorFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Replace imports
  code = code.replace(/import mysql from [\'\"]mysql2\/promise[\'\"];/, 'import { query as dbQuery } from "./mysql";');

  // Remove connectionPool
  code = code.replace(/let connectionPool.*?null;\n/g, '');
  
  // Remove getPool() completely
  code = code.replace(/async function getPool\(\) \{[\s\S]*?return connectionPool;\n\}\n/g, '');

  // Replace connection pooling logic
  code = code.replace(/const pool = await getPool\(\);\s*const connection = await pool\.getConnection\(\);/g, '');
  
  // Replace array destructuring execute -> dbQuery
  code = code.replace(/const \[(.*?)\] = await connection\.execute\(([\s\S]*?)\);/g, 'const $1 = await dbQuery($2);');
  // Replace execute -> dbQuery
  code = code.replace(/await connection\.execute\(([\s\S]*?)\);/g, 'await dbQuery($1);');
  
  // Replace query -> dbQuery (in syncGrades)
  code = code.replace(/await connection\.query\(([\s\S]*?)\);/g, 'await dbQuery($1);');
  code = code.replace(/const \[(.*?)\] = await connection\.query\(([\s\S]*?)\);/g, 'const $1 = await dbQuery($2);');

  // Remove connection.release()
  code = code.replace(/connection\.release\(\);/g, '');
  code = code.replace(/if \(connection\) connection\.release\(\);/g, '');

  // In syncGrades, there's manual pool creation, let's just replace all `mysql.createPool` usages
  // Actually, syncGrades is just a script, let's fix it separately if it's too complex.
  
  fs.writeFileSync(path, code);
}

try {
  refactorFile('server/studentDb.ts');
  refactorFile('server/syncGrades.ts');
  console.log('Success!');
} catch(e) {
  console.error(e);
}
