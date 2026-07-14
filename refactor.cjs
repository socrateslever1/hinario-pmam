const fs = require('fs');

function refactorFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Replace imports
  code = code.replace(/import mysql from [\'\"]mysql2\/promise[\'\"];/, 'import { query } from "./mysql";');

  // Remove getPool and connectionPool
  code = code.replace(/let connectionPool.*?null;\n/g, '');
  code = code.replace(/async function getPool\(\) \{[\s\S]*?return connectionPool;\n\}\n/g, '');

  // Replace pool.getConnection() logic
  code = code.replace(/const pool = await getPool\(\);\n\s*const connection = await pool\.getConnection\(\);/g, '');

  // Replace const [rows] = await connection.execute(...) with const rows = await query(...)
  code = code.replace(/const \[(.*?)\] = await connection\.execute\((.*?)\);/g, 'const $1 = await query($2);');
  
  // Replace await connection.execute(...) with await query(...)
  code = code.replace(/await connection\.execute\((.*?)\);/g, 'await query($1);');
  
  // Remove connection.release()
  code = code.replace(/connection\.release\(\);/g, '');

  fs.writeFileSync(path, code);
}

refactorFile('server/studentDb.ts');
refactorFile('server/syncGrades.ts');
console.log('Done!');
