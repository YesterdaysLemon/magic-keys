import { validate, initialState, simulate } from './engine.mjs';
export function registerProjectTools(context,read,write){
 if(!context?.registerTool)return ()=>{};
 const lifecycle=new AbortController();
 const tools=[
  {name:'read_keyboard_project',description:'Read the keyboard layout and Magic/Repeat programs currently visible in the editor.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>structuredClone(read())},
  {name:'configure_keyboard_project',description:'Replace the visible keyboard layout and Magic/Repeat cases with a validated version 1 project. This changes the browser-local project; it does not build or flash firmware.',inputSchema:{type:'object',properties:{project:{type:'object'}},required:['project'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{const project=structuredClone(validate(input?.project));write(project);return {board:project.board,keys:project.keys.length,magicCases:project.magic.length,repeatCases:project.repeat.length};}},
  {name:'simulate_magic_keys',description:'Simulate a short sequence using the current project without changing the editor or flashing hardware. Use printable characters, SPACE, MAGIC, REPEAT, or BSPC.',inputSchema:{type:'object',properties:{keys:{type:'array',items:{type:'string'},maxItems:100}},required:['keys'],additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(!Array.isArray(input?.keys)||input.keys.length>100||input.keys.some(k=>typeof k!=='string'||!(k.length===1||['SPACE','MAGIC','REPEAT','BSPC'].includes(k))))throw Error('Invalid key sequence.');return input.keys.reduce((s,k)=>simulate(read(),s,k,100),initialState());}}
 ];
 for(const tool of tools)try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
 return ()=>lifecycle.abort();
}
