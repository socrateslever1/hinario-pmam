const fs = require('fs');
let lines = fs.readFileSync('server/studentRouter.ts', 'utf8').split('\n');
// lines 450 to 482 are indexes 449 to 481
lines.splice(449, 33);
lines[449] = '  updateProfile: publicProcedure\r';
fs.writeFileSync('server/studentRouter.ts', lines.join('\n'));
console.log('Fixed!');
