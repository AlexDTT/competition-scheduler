import {readFile,writeFile} from 'node:fs/promises';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [html,css,core,app]=await Promise.all(['index.html','style.css','core.mjs','app.mjs'].map(read));
const script=core.replace(/^export /gm,'')+'\n'+app.replace(/^import .*\n/,'');
await writeFile(new URL('standalone.html',import.meta.url),html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="app.mjs"></script>',()=>`<script type="module">${script}</script>`));
console.log('Created standalone.html — open directly in a browser.');
