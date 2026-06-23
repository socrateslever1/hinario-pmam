import fs from 'node:fs';
import path from 'node:path';
import { transformJsxCode } from '../node_modules/.pnpm/@builder.io+jsx-loc-internals@0.0.1/node_modules/@builder.io/jsx-loc-internals/dist/index.js';

const srcDir = 'c:/Users/LEVER/Documents/Github/hinario-pmam/client/src';

let scannedCount = 0;
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      scannedCount++;
      try {
        const code = fs.readFileSync(fullPath, 'utf-8');
        // We override console.error to capture the error details
        const originalConsoleError = console.error;
        let caughtError = null;
        console.error = (...args) => {
          caughtError = args;
        };
        
        transformJsxCode(code, fullPath);
        
        console.error = originalConsoleError;
        if (caughtError) {
          console.log(`\n❌ Failed to parse: ${fullPath}`);
          console.log(caughtError.join(' '));
        }
      } catch (err) {
        console.log(`\n❌ Threw error on: ${fullPath}`);
        console.error(err);
      }
    }
  }
}

console.log('Testing files in client/src...');
walkDir(srcDir);
console.log(`Finished testing. Scanned ${scannedCount} files.`);
