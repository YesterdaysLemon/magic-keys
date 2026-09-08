export const VERSION = 1;
export const PINS = { qmk: '08c662f286ddfd12a985f57b584b02eca5af0ae6', vial: 'dd43959ae5c08d8a28d38a1acf7b04e86b14a344', zmk: '90693f4336f64ba029d1c2c3cc05720cc06331b8' };
const row = (key, output, repeat = '', cursor = 0) => ({after:key, output, repeat, cursor});
export const PRESETS = {
  lemon: {name:'Lemon’s Magic Sturdy', description:'Your antecedent-morph ZMK setup: Magic + an adaptive Repeat.', magic: Object.entries({a:'o',b:'le',c:'k',d:'g',e:'u',f:'n',g:'y',h:'h',i:'on',j:'ust',k:'s',l:'k',m:'ent',n:'n',o:'a',p:'y',q:'uen',r:'l',s:'k',t:'ment',u:'e',v:'er',w:'y',x:'es',y:'y',z:'z',',':' but',' ':'the'}).map(([a,b])=>row(a,b)), repeat:[row('a','nd'),row('i','ng'),row('w','hich'),row('y','p'),row(',',' and'),row(' ','for')], magicTimeout:3000, repeatTimeout:1500 },
  qmk: {name:'Magic Sturdy · QMK', description:'N-grams with chained Repeat endings, from your QMK map.', magic: [row('a','o','n'),row('o','a','n'),row('e','u','n'),row('u','e','n'),row('i','on','s'),row('m','ent','s'),row('q','uen','c'),row('t','ment','s'),row(' ','the','n'),...['c','d','g','p'].map(a=>row(a,'y','n')),row('y','p','n'),row('l','k'),row('s','k'),row('r','l')],repeat:[],magicTimeout:3000,repeatTimeout:1500},
  code: {name:'Programming companions',description:'Operators, quote fences, includes, and parent directories.',magic:[row('=','=='),row('!','=='),row('"','"""""','',3),row('`','`````','',3),row('#','include'),row('.','./','../')],repeat:[],magicTimeout:3000,repeatTimeout:1500}
};
export const LAYOUTS = {
  QWERTY:['qwertyuiop','asdfghjkl;','zxcvbnm,./'],
  'Colemak-DH':['qwfpbjluy;','arstgmneio','zxcdvkh,./'],
  Dvorak:["',.pyfgcrl",'aoeuidhtns',';qjkxbmwvz'],
  'Magic Sturdy':['vmlcpb✦uoq','strdy.naei','xkjgwzf,h/']
};
export function keysForLayout(name='Magic Sturdy', count=48) {
 const letters=(LAYOUTS[name]||LAYOUTS.QWERTY).flatMap(r=>[...r]);
 if(count===34) return [...letters,'REPEAT','SPACE','BSPC','MAGIC'].map(k=>k==='✦'?'MAGIC':k);
 return ['TAB',...letters.slice(0,10),'BSPC','ESC',...letters.slice(10,20),'ENTER','LSHIFT',...letters.slice(20,30),'RSHIFT','LCTRL','LGUI','LALT','LEFT','REPEAT','SPACE','SPACE','MAGIC','DOWN','UP','RIGHT','MO(1)'].map(k=>k==='✦'?'MAGIC':k);
}
export function defaultProject(){return {version:1,name:'My magic keyboard',board:'planck/rev6',layout:'Magic Sturdy',keys:keysForLayout(),...structuredClone(PRESETS.lemon),name:'My magic keyboard'};}
const named = {SPACE:'KC_SPC',BSPC:'KC_BSPC',TAB:'KC_TAB',ESC:'KC_ESC',ENTER:'KC_ENT',LSHIFT:'KC_LSFT',RSHIFT:'KC_RSFT',LCTRL:'KC_LCTL',LGUI:'KC_LGUI',LALT:'KC_LALT',LEFT:'KC_LEFT',RIGHT:'KC_RGHT',UP:'KC_UP',DOWN:'KC_DOWN',MAGIC:'MK_MAGIC',REPEAT:'MK_REPEAT','MO(1)':'MO(1)',TRNS:'KC_TRNS',NO:'KC_NO',BOOT:'QK_BOOT'};
const punct = {' ':'KC_SPC',';':'KC_SCLN',"'":'KC_QUOT',',':'KC_COMM','.':'KC_DOT','/':'KC_SLSH','-':'KC_MINS','=':'KC_EQL','[':'KC_LBRC',']':'KC_RBRC','\\':'KC_BSLS','`':'KC_GRV','!':'S(KC_1)','@':'S(KC_2)','#':'S(KC_3)','$':'S(KC_4)','%':'S(KC_5)','^':'S(KC_6)','&':'S(KC_7)','*':'S(KC_8)','(':'S(KC_9)',')':'S(KC_0)','_':'S(KC_MINS)','+':'S(KC_EQL)','{':'S(KC_LBRC)','}':'S(KC_RBRC)','|':'S(KC_BSLS)',':':'S(KC_SCLN)','"':'S(KC_QUOT)','<':'S(KC_COMM)','>':'S(KC_DOT)','?':'S(KC_SLSH)','~':'S(KC_GRV)'};
export function qcode(k){if(typeof k!=='string')throw Error('Key assignments must be strings.');if(Object.hasOwn(named,k))return named[k];if(Object.hasOwn(punct,k))return punct[k];if(/^[a-z0-9]$/i.test(k))return 'KC_'+k.toUpperCase();throw Error(`Unsupported key: ${k}`);}
export function validate(p){
 if(!p||p.version!==1)throw Error('Expected a Magic Keys version 1 project.');
 if(typeof p.name!=='string'||p.name.length>80)throw Error('Project name must be at most 80 characters.');
 if(!Object.hasOwn(LAYOUTS,p.layout))throw Error('Unknown base layout.');
 if(!['planck/rev6','urchin'].includes(p.board))throw Error('Choose a supported board. PCB revisions are not interchangeable.');
 if(!Array.isArray(p.keys)||p.keys.length!==(p.board==='urchin'?34:48))throw Error('Key count does not match the selected keyboard.');
 p.keys.forEach(qcode);
 for(const type of ['magic','repeat']){
  if(!Array.isArray(p[type])||p[type].length>64)throw Error('Use at most 64 cases per key.');
  const seen=new Set();
  for(const r of p[type]){
   if(typeof r.after!=='string'||r.after.length!==1||!/^[ -~]$/.test(r.after))throw Error('Each “after” must be one printable US key.');
   if(seen.has(r.after))throw Error(`Duplicate ${type} case after ${JSON.stringify(r.after)}.`);seen.add(r.after);
   if(typeof r.output!=='string'||!r.output.length||r.output.length>48||!/^[ -~]+$/.test(r.output))throw Error('Output must contain 1–48 printable US characters.');
   if(typeof r.repeat!=='string'||r.repeat.length>48||!/^[ -~]*$/.test(r.repeat))throw Error('Repeat continuation must be printable US text, at most 48 characters.');
   if(!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>r.output.length)throw Error('Cursor movement must be between zero and the output length.');
  }
  if(!Number.isInteger(p[type+'Timeout'])||p[type+'Timeout']<100||p[type+'Timeout']>10000)throw Error('Timing window must be 100–10000 ms.');
 }
 return p;
}
export function parseDescription(text){
 const rules=[];
 for(const line of text.split(/\n/).map(s=>s.trim()).filter(Boolean)){
  const m=line.match(/^(?:after\s+)?(?:"([ -~])"|'([ -~])'|(space)|([ -~]))\s*(?:,?\s*(?:send|type|output)\s+|->\s*|→\s*)(?:"([^"\n]*)"|'([^'\n]*)'|(.+?))(?:\s*,?\s*then repeat\s+"([^"]*)")?$/i);
  if(!m)throw Error(`Could not understand: ${line}. Try: after i type "on" or space -> the. Nothing was changed.`);
  rules.push(row(m[1]??m[2]??(m[3]?' ':m[4]),m[5]??m[6]??m[7],m[8]||''));
 }
 if(!rules.length)throw Error('Describe at least one case.');
 return rules;
}
export function initialState(){return {text:'',cursor:0,last:'',at:0,continuation:'',message:'Ready. Type a letter, then try Magic or Repeat.'};}
export function simulate(p,state,key,now=Date.now()){
 let s={...state};
 const insert=(out,cursor=0)=>{s.text=s.text.slice(0,s.cursor)+out+s.text.slice(s.cursor);s.cursor+=out.length-cursor;};
 if(key==='MAGIC'||key==='REPEAT'){
  const kind=key==='MAGIC'?'magic':'repeat';
  const active=now-s.at<=p[kind+'Timeout'];
  const continuation=key==='REPEAT'&&active?s.continuation:'';
  const rule=active?p[kind].find(r=>r.after===s.last):undefined;
  const out=continuation||rule?.output||s.last;
  if(out){insert(out,continuation?0:rule?.cursor||0);s.last=out.at(-1);s.at=now;s.continuation=continuation||rule?.repeat||'';s.message=continuation?'Repeat continuation':rule?`${key} matched a case`:'Fallback: repeat the last character';}
  return s;
 }
 if(key==='BSPC'){s.text=s.text.slice(0,Math.max(0,s.cursor-1))+s.text.slice(s.cursor);s.cursor=Math.max(0,s.cursor-1);s.last='';s.continuation='';return s;}
 const ch=key==='SPACE'?' ':key;
 if(ch.length===1){insert(ch);s.last=ch;s.at=now;s.continuation='';s.message='Context captured';}
 return s;
}
export function qmkSource(p){
 validate(p);if(p.board!=='planck/rev6')throw Error('QMK reference build requires Planck rev6.');
 const rules=type=>(p[type].length?p[type]:[{after:'\0',output:'',repeat:'',cursor:0}]).map(r=>` {${r.after.charCodeAt(0)}, ${JSON.stringify(r.output)}, ${JSON.stringify(r.repeat)}, ${r.cursor}}`).join(',\n');
 const base=p.keys.map(qcode).join(', ');
 const symbols=['BOOT',...Array.from('1234567890'),'BSPC',...Array(36).fill('TRNS')].map(qcode).join(', ');
 return `// Generated by Magic Keys. Text macros assume a US host layout.\n#include QMK_KEYBOARD_H\n#include <string.h>\nenum { MK_MAGIC = QK_KB_0, MK_REPEAT };\ntypedef struct { char after; const char *output; const char *continuation; uint8_t cursor; } mk_rule;\nstatic const mk_rule magic_rules[] = {\n${rules('magic')}\n};\nstatic const mk_rule repeat_rules[] = {\n${rules('repeat')}\n};\nconst uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {\n [0] = LAYOUT_ortho_4x12(${base}),\n [1] = LAYOUT_ortho_4x12(${symbols}),\n [2] = LAYOUT_ortho_4x12(${Array(48).fill('KC_TRNS').join(', ')}),\n [3] = LAYOUT_ortho_4x12(${Array(48).fill('KC_TRNS').join(', ')})\n};\nstatic char last_char;\nstatic uint32_t last_time;\nstatic const char *continuation = "";\nstatic char mk_character(uint16_t keycode, uint8_t mods) {\n bool shift = (mods & MOD_MASK_SHIFT) != 0;\n if (keycode >= KC_A && keycode <= KC_Z) return (shift ? 'A' : 'a') + keycode - KC_A;\n if (keycode >= KC_1 && keycode <= KC_0) return (shift ? "!@#$%^&*()" : "1234567890")[keycode-KC_1];\n switch(keycode) {\n case KC_SPC: return ' ';\n ${[['MINS','-','_'],['EQL','=','+'],['LBRC','[','{'],['RBRC',']','}'],['BSLS','\\','|'],['SCLN',';',':'],['QUOT',"'",'"'],['COMM',',','<'],['DOT','.','>'],['SLSH','/','?'],['GRV','`','~']].map(([k,a,b])=>`case KC_${k}: return shift ? ${b.charCodeAt(0)} : ${a.charCodeAt(0)};`).join('\n ')}\n }\n return 0;\n}\nstatic void mk_send(const char *text, uint8_t cursor) {\n uint8_t mods=get_mods(), weak=get_weak_mods(), oneshot=get_oneshot_mods();\n clear_mods(); clear_weak_mods(); clear_oneshot_mods(); send_keyboard_report();\n send_string(text);\n for(uint8_t i=0;i<cursor;i++) tap_code(KC_LEFT);\n set_mods(mods); set_weak_mods(weak); set_oneshot_mods(oneshot); send_keyboard_report();\n size_t n=strlen(text); if(n) last_char=text[n-1]; last_time=timer_read32();\n}\nbool process_record_user(uint16_t keycode, keyrecord_t *record) {\n if(keycode==MK_MAGIC || keycode==MK_REPEAT) {\n  if(!record->event.pressed) return false;\n  uint8_t mods=get_mods()|get_weak_mods()|get_oneshot_mods();\n  if(mods & ~MOD_MASK_SHIFT) return false;\n  bool magic=keycode==MK_MAGIC;\n  uint32_t timeout=magic?${p.magicTimeout}:${p.repeatTimeout};\n  bool active=timer_elapsed32(last_time)<=timeout;\n  if(!magic && active && continuation[0]) { mk_send(continuation,0); return false; }\n  const mk_rule *rules=magic?magic_rules:repeat_rules;\n  size_t count=magic?${p.magic.length}:${p.repeat.length};\n  for(size_t i=0;active && i<count;i++) if(rules[i].after==last_char) { continuation=rules[i].continuation; mk_send(rules[i].output,rules[i].cursor); return false; }\n  continuation=""; if(last_char) { char text[2]={last_char,0}; mk_send(text,0); }\n  return false;\n }\n if(record->event.pressed) {\n  if(keycode>=KC_LCTL && keycode<=KC_RGUI) return true;\n  uint8_t mods=get_mods()|get_weak_mods()|get_oneshot_mods();\n  if(IS_QK_MODS(keycode)) { mods |= QK_MODS_GET_MODS(keycode); keycode=QK_MODS_GET_BASIC_KEYCODE(keycode); }\n  continuation=""; last_char=(mods & ~MOD_MASK_SHIFT)?0:mk_character(keycode,mods); last_time=timer_read32();\n }\n return true;\n}\n`;
}
export function definition(board){return {name:'Magic Keys · Planck rev6',vendorId:board.vid,productId:board.pid,matrix:{rows:board.rows,cols:board.cols},customKeycodes:[{name:'Magic',title:'Context-sensitive Magic key',shortName:'Magic'},{name:'Repeat',title:'Adaptive Repeat key',shortName:'Repeat'}],layouts:{keymap:Array.from({length:4},(_,y)=>board.keys.filter(k=>k.y===y).map(k=>k.matrix.join(',')))}};}
export function qmkFiles(p,board,mode='via'){
 if(!['qmk','via','vial'].includes(mode))throw Error('Unknown firmware mode');
 const files={'keymap.c':qmkSource(p),'rules.mk':`LTO_ENABLE = yes\nAUDIO_ENABLE = no\nMUSIC_ENABLE = no\nCONSOLE_ENABLE = no\nCOMMAND_ENABLE = no\n${mode==='qmk'?'':'VIA_ENABLE = yes\n'}${mode==='vial'?'VIAL_ENABLE = yes\n':''}`,'config.h':'#pragma once\n#define DYNAMIC_KEYMAP_LAYER_COUNT 4\n'+(mode==='vial'?'#define VIAL_KEYBOARD_UID {0x2E, 0x2A, 0xC9, 0x11, 0x84, 0x6B, 0xD5, 0x71}\n#define VIAL_UNLOCK_COMBO_ROWS {0, 4}\n#define VIAL_UNLOCK_COMBO_COLS {0, 5}\n':'')};
 files[mode==='vial'?'vial.json':'via.json']=JSON.stringify(definition(board),null,2);
 return files;
}
