import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { defaultProject, validate } from '../lib/engine.mjs';
import { bundleFiles } from '../lib/export.mjs';
const mode=process.env.MK_MODE||process.argv[2]||'via';
const project=validate(process.env.MK_PROJECT?JSON.parse(process.env.MK_PROJECT):process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')):defaultProject());
const dest=resolve(process.env.MK_OUTPUT||'generated');
for(const [path,data] of Object.entries(bundleFiles(project,mode))){const file=resolve(dest,path);if(!file.startsWith(dest+'/'))throw Error('Invalid output path');await mkdir(dirname(file),{recursive:true});await writeFile(file,data);}
console.log(`Generated ${mode} project for ${project.board} in ${dest}`);
