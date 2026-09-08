import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('dist/client');
await stat(resolve(root,'index.html'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.rsc':'text/x-component'};
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 try{
  const path=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
  if(path==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({ok:true,service:'magic-keys'}));return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep)||path.includes('\0')){res.writeHead(400);res.end();return;}
  const info=await stat(file);if(!info.isFile())throw Error('not found');
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'});
  res.end(req.method==='HEAD'?undefined:await readFile(file));
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log(`Magic Keys listening on ${JSON.stringify(server.address())}`));
