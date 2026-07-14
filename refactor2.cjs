const fs = require('fs');

function refactorFile(path) {
  let code = fs.readFileSync(path, 'utf8');

  // Replace imports
  code = code.replace(/import mysql from [\'\"]mysql2\/promise[\'\"];/, 'import { query as dbQuery } from "./mysql";');

  // Remove getPool and connectionPool
  code = code.replace(/let connectionPool.*?null;/g, '');
  code = code.replace(/async function getPool\(\) \{[\s\S]*?return connectionPool;\n\}/g, '');

  // Replace pool.getConnection() logic
  code = code.replace(/const pool = await getPool\(\);\s*const connection = await pool\.getConnection\(\);/g, '');
  code = code.replace(/const connection = await getPool\(\)\.then\(\(p\) => p\.getConnection\(\)\);/g, ''); // Just in case

  // Replace const [rows] = await connection.execute(...) with const rows = await dbQuery(...)
  code = code.replace(/const \[(.*?)\] = await connection\.execute\((.*?)\);/g, 'const $1 = await dbQuery($2);');
  
  // Replace await connection.execute(...) with await dbQuery(...)
  code = code.replace(/await connection\.execute\((.*?)\);/g, 'await dbQuery($1);');
  code = code.replace(/await connection\.query\((.*?)\);/g, 'await dbQuery($1);');
  code = code.replace(/const \[(.*?)\] = await connection\.query\((.*?)\);/g, 'const $1 = await dbQuery($2);');
  
  // Remove connection.release()
  code = code.replace(/connection\.release\(\);/g, '');
  code = code.replace(/if \(connection\) connection\.release\(\);/g, '');

  fs.writeFileSync(path, code);
}

refactorFile('server/studentDb.ts');
refactorFile('server/syncGrades.ts');
console.log('Done 2!');
