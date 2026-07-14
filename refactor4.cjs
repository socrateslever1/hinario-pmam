const fs = require('fs');

function refactorFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Fix studentDb.ts
  code = code.replace(/let connectionPool.*?;/g, '');
  code = code.replace(/async function getPool\(\) \{[\s\S]*?return connectionPool;\n\}/g, '');
  code = code.replace(/await connection\.query/g, 'await dbQuery');
  code = code.replace(/await connection\.execute/g, 'await dbQuery');

  // Fix syncGrades.ts specific
  code = code.replace(/import mysql from [\'\"]mysql2\/promise[\'\"];/g, 'import { query as dbQuery } from "./mysql";');
  code = code.replace(/const pool = mysql\.createPool\(\{[\s\S]*?\}\);/g, '');
  code = code.replace(/const connection = await pool\.getConnection\(\);/g, '');
  code = code.replace(/connection\.release\(\);/g, '');

  fs.writeFileSync(path, code);
}

refactorFile('server/studentDb.ts');
refactorFile('server/syncGrades.ts');
console.log('Success 4!');
