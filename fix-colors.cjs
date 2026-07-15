const fs=require('fs');
const path=require('path');

function walkDir(dir,cb) {
  fs.readdirSync(dir).forEach(f=>{
    let p=path.join(dir,f);
    if(fs.statSync(p).isDirectory()) walkDir(p,cb);
    else cb(p);
  });
} 

let c=0;
walkDir('client/src', p => {
  if(!p.endsWith('.tsx') && !p.endsWith('.ts')) return;
  if(p.includes('Documents.tsx')) return;
  
  let txt=fs.readFileSync(p,'utf8');
  let orig=txt;
  
  txt=txt.replace(/className=(["'])(.*?)\1/g, (m,q,cls) => {
    if(cls.includes('bg-white') && !cls.includes('dark:bg-')) {
      cls=cls.replace(/\bbg-white\b/g,'bg-card');
    }
    if(cls.includes('text-black') && !cls.includes('dark:text-')) {
      cls=cls.replace(/\btext-black\b/g,'text-foreground');
    }
    if(cls.includes('text-gray-900') && !cls.includes('dark:text-')) {
      cls=cls.replace(/\btext-gray-900\b/g,'text-foreground');
    }
    if((cls.includes('bg-gray-50')||cls.includes('bg-gray-100')||cls.includes('bg-zinc-50')||cls.includes('bg-zinc-100')) && !cls.includes('dark:bg-')) {
      cls=cls.replace(/\bbg-(gray|zinc)-(50|100)\b/g,'bg-muted');
    }
    return `className=${q}${cls}${q}`;
  });
  
  if(txt!==orig) {
    fs.writeFileSync(p,txt,'utf8');
    c++;
    console.log('Updated:',p);
  }
});
console.log('Total:',c);
