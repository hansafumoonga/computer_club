/* rewards.js - a printable 3D reward picture for every game that has no certificate.
   Finishing the game (see CC.rewards.earn / CC.rewards.note, called from each game) unlocks it; a trophy button then opens the picture, where the
   child can type a name and print it or save it. Every picture is drawn in code (SVG), so nothing has to be downloaded.
   Earned rewards are kept on this computer for a few hours (CC.keep), like progress in the other games. To change a drawing, edit its function in EMB. */
(function () {
'use strict';
const CC = window.CC;
const W = 1123, H = 794, mid = W / 2;
const SERIF = "Georgia,'Palatino Linotype','Book Antiqua',serif", SANS = "'Trebuchet MS','Segoe UI',Arial,sans-serif", SCRIPT = "'Segoe Script','Brush Script MT','Apple Chancery','Comic Sans MS',cursive";
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function starPts(cx, cy, R, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return p.join(' '); }
function spark(x, y, r, c) { c = c || '#fff'; return '<path d="M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + ' Z" fill="' + c + '"/>'; }
function glint(x, y, r, u) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.1) + '" fill="#fff" opacity=".55" filter="url(#bl' + u + ')"/>' + spark(x, y, r) + spark(x, y, r * .5, '#fff7b0'); }

/* shared drawing tools: gold, soft shadows, light blur */
function common(u){return '<linearGradient id="gd'+u+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".3" stop-color="#f5c542"/><stop offset=".6" stop-color="#b8860b"/><stop offset=".82" stop-color="#f7d46a"/><stop offset="1" stop-color="#d9a21b"/></linearGradient>'+
 '<linearGradient id="gv'+u+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".45" stop-color="#e5a91a"/><stop offset="1" stop-color="#8a5a00"/></linearGradient>'+
 '<radialGradient id="gr'+u+'" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff7c4"/><stop offset=".45" stop-color="#f0b72e"/><stop offset="1" stop-color="#8a5a00"/></radialGradient>'+
 '<filter id="bl'+u+'" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>'+
 '<filter id="ds'+u+'" x="-25%" y="-20%" width="150%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="12" result="b"/><feComponentTransfer in="b" result="s"><feFuncA type="linear" slope=".42"/></feComponentTransfer><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'}
function floor(u,cx,cy,rx,ry){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#000" opacity=".28" filter="url(#bl'+u+')"/>'}
function lg(id,x1,y1,x2,y2,stops){return '<linearGradient id="'+id+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"/>'}).join('')+'</linearGradient>'}
function rg(id,cx,cy,r,stops){return '<radialGradient id="'+id+'" cx="'+cx+'" cy="'+cy+'" r="'+r+'">'+stops.map(function(s){return '<stop offset="'+s[0]+'" stop-color="'+s[1]+'"/>'}).join('')+'</radialGradient>'}

/* ================= the 3D emblems, each in a 400 x 400 box ================= */
var EMB={
 diamond:function(u){
  var A=[110,92],B=[290,92],C=[362,172],D=[200,352],E=[38,172],P=[132,172],Q=[268,172],N=[200,92],M=[200,172];
  var poly=function(a,fill){return '<polygon points="'+a.join(' ')+'" fill="'+fill+'" stroke="rgba(255,255,255,.95)" stroke-width="2.5" stroke-linejoin="round"/>'};
  var rays='';for(var k=0;k<14;k++){var a=k/14*Math.PI*2;rays+='<polygon points="200,210 '+(200+Math.cos(a)*230).toFixed(0)+','+(210+Math.sin(a)*230).toFixed(0)+' '+(200+Math.cos(a+.1)*230).toFixed(0)+','+(210+Math.sin(a+.1)*230).toFixed(0)+'" fill="#fff" opacity=".22"/>'}
  return '<defs>'+common(u)+rg('hz'+u,.5,.5,.5,[[0,'#bff4ff'],[1,'#bff4ff00']])+
   lg('c1'+u,0,0,1,1,[[0,'#ffffff'],[1,'#a4e6ff']])+lg('c2'+u,0,0,0,1,[[0,'#d6f6ff'],[1,'#5ec6f2']])+lg('c3'+u,1,0,0,1,[[0,'#8adcf8'],[1,'#2d97dc']])+
   lg('p1'+u,0,0,1,1,[[0,'#6ccdf5'],[1,'#1a72bf']])+lg('p2'+u,0,0,0,1,[[0,'#9be3fa'],[1,'#2a94dc']])+lg('p3'+u,1,0,0,1,[[0,'#2f9be0'],[1,'#0f4f93']])+lg('p4'+u,1,0,0,1,[[0,'#1e7fc8'],[1,'#0b3f7c']])+'</defs>'+
   '<circle cx="200" cy="215" r="200" fill="url(#hz'+u+')"/>'+rays+floor(u,200,384,128,13)+
   '<g filter="url(#ds'+u+')">'+poly([E,A,P],'url(#c3'+u+')')+poly([A,N,P],'url(#c1'+u+')')+poly([P,N,Q],'url(#c2'+u+')')+poly([N,B,Q],'url(#c1'+u+')')+poly([B,C,Q],'url(#c3'+u+')')+
   poly([E,P,D],'url(#p1'+u+')')+poly([P,M,D],'url(#p2'+u+')')+poly([M,Q,D],'url(#p3'+u+')')+poly([Q,C,D],'url(#p4'+u+')')+
   '<polygon points="'+[A,B,C,D,E].join(' ')+'" fill="none" stroke="#0e5aa0" stroke-width="6" stroke-linejoin="round"/></g>'+
   '<polygon points="122,100 164,100 144,150" fill="#fff" opacity=".8"/><polygon points="236,100 262,100 252,140" fill="#fff" opacity=".45"/>'+
   glint(72,66,30,u)+glint(342,56,22,u)+glint(362,252,16,u)+spark(40,262,16,'#fff7b0')},
 rocket:function(u){
  return '<defs>'+common(u)+rg('sp'+u,.5,.4,.75,[[0,'#3b3fc0'],[1,'#0b0c3a']])+
   lg('bd'+u,0,0,1,0,[[0,'#aab5d9'],[.28,'#ffffff'],[.6,'#e3eafa'],[1,'#7f8bb8']])+lg('rn'+u,0,0,1,0,[[0,'#a3122f'],[.3,'#ff6a86'],[.65,'#e8264a'],[1,'#8c0f27']])+
   lg('fn'+u,0,0,1,0,[[0,'#8c0f27'],[.5,'#ff4d6d'],[1,'#a3122f']])+rg('gl'+u,.35,.3,.8,[[0,'#d6f0ff'],[.4,'#3a9aee'],[1,'#0f4a9a']])+
   lg('fl'+u,0,0,0,1,[[0,'#fff6a8'],[.4,'#ffb52e'],[1,'#ff3d1e']])+rg('pn'+u,.3,.3,.9,[[0,'#d9b8ff'],[.6,'#8a5cf5'],[1,'#3a1a8a']])+rg('cl'+u,.4,.3,.8,[[0,'#ffffff'],[1,'#c4cee8']])+'</defs>'+
   '<circle cx="200" cy="215" r="176" fill="url(#sp'+u+')"/><circle cx="200" cy="215" r="176" fill="none" stroke="url(#gd'+u+')" stroke-width="12"/><circle cx="200" cy="215" r="165" fill="none" stroke="#fff3b0" stroke-width="2" opacity=".6"/>'+
   '<g fill="#fff"><circle cx="78" cy="150" r="3"/><circle cx="326" cy="132" r="4"/><circle cx="94" cy="290" r="3"/><circle cx="318" cy="300" r="3"/><circle cx="150" cy="90" r="2.5"/><circle cx="352" cy="214" r="2.5"/></g>'+
   '<circle cx="318" cy="150" r="30" fill="url(#pn'+u+')"/><ellipse cx="318" cy="152" rx="52" ry="12" fill="none" stroke="#ffd23f" stroke-width="6" transform="rotate(-24 318 152)"/><path d="M276 164 A52 12 0 0 0 360 140" fill="none" stroke="#fff3b0" stroke-width="3" opacity=".7" transform="rotate(-24 318 152)"/>'+
   '<ellipse cx="200" cy="330" rx="110" ry="30" fill="#ff9f1c" opacity=".55" filter="url(#bl'+u+')"/>'+
   '<g filter="url(#ds'+u+')">'+
   '<path d="M170 296 C150 346 186 388 200 408 C214 388 250 346 230 296 Z" fill="url(#fl'+u+')"/><path d="M184 300 C176 336 194 362 200 378 C206 362 224 336 216 300 Z" fill="#fff4b0"/>'+
   '<path d="M138 214 C92 234 74 286 64 340 L138 286 Z" fill="url(#fn'+u+')" stroke="#7a0c20" stroke-width="3" stroke-linejoin="round"/><path d="M262 214 C308 234 326 286 336 340 L262 286 Z" fill="url(#fn'+u+')" stroke="#7a0c20" stroke-width="3" stroke-linejoin="round"/>'+
   '<rect x="158" y="282" width="84" height="24" rx="8" fill="#6b6f9a" stroke="#40456f" stroke-width="3"/>'+
   '<path d="M200 28 C264 84 282 190 268 284 L132 284 C118 190 136 84 200 28 Z" fill="url(#bd'+u+')" stroke="#5d6796" stroke-width="3"/>'+
   '<path d="M200 28 C230 54 250 92 258 130 L142 130 C150 92 170 54 200 28 Z" fill="url(#rn'+u+')" stroke="#7a0c20" stroke-width="3"/>'+
   '<rect x="134" y="236" width="132" height="16" fill="url(#rn'+u+')" opacity=".95"/>'+
   '<circle cx="200" cy="184" r="44" fill="url(#gd'+u+')" stroke="#8a5a00" stroke-width="3"/><circle cx="200" cy="184" r="34" fill="url(#gl'+u+')" stroke="#2a4a8a" stroke-width="3"/><ellipse cx="188" cy="170" rx="13" ry="8" fill="#fff" opacity=".8" transform="rotate(-35 188 170)"/>'+
   '<path d="M150 80 C140 130 144 200 150 260" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/></g>'+
   '<g fill="url(#cl'+u+')" stroke="#aab5d6" stroke-width="2"><circle cx="106" cy="372" r="34"/><circle cx="152" cy="386" r="42"/><circle cx="248" cy="386" r="42"/><circle cx="294" cy="372" r="34"/><circle cx="200" cy="394" r="38"/></g>'+
   glint(92,96,22,u)+glint(338,246,16,u)},
 medal:function(u){
  var sc='';for(var k=0;k<22;k++){var a=k/22*Math.PI*2;sc+='<circle cx="'+(200+Math.cos(a)*118).toFixed(1)+'" cy="'+(252+Math.sin(a)*118).toFixed(1)+'" r="17" fill="url(#gr'+u+')" stroke="#7a4a00" stroke-width="2"/>'}
  var st='';for(var i=0;i<5;i++){var a0=-Math.PI/2+i*2*Math.PI/5,aL=a0-Math.PI/5,aR=a0+Math.PI/5,cx=200,cy=256,R=68,r=28;
    var tip=[cx+Math.cos(a0)*R,cy+Math.sin(a0)*R],l=[cx+Math.cos(aL)*r,cy+Math.sin(aL)*r],rr=[cx+Math.cos(aR)*r,cy+Math.sin(aR)*r];
    st+='<polygon points="'+cx+','+cy+' '+tip[0].toFixed(1)+','+tip[1].toFixed(1)+' '+l[0].toFixed(1)+','+l[1].toFixed(1)+'" fill="#ff6a7e"/><polygon points="'+cx+','+cy+' '+tip[0].toFixed(1)+','+tip[1].toFixed(1)+' '+rr[0].toFixed(1)+','+rr[1].toFixed(1)+'" fill="#c4122e"/>'}
  return '<defs>'+common(u)+lg('rb'+u,0,0,1,0,[[0,'#a3122f'],[.35,'#ff4d6d'],[1,'#8c0f27']])+lg('bb'+u,0,0,1,0,[[0,'#10306a'],[.35,'#3a74d6'],[1,'#0b2250']])+rg('dk'+u,.5,.5,.6,[[0,'#fff6cc'],[.7,'#f6dc82'],[1,'#d9a21b']])+'</defs>'+
   floor(u,200,392,120,11)+
   '<g filter="url(#ds'+u+')"><path d="M116 4 L196 4 L254 196 L176 196 Z" fill="url(#rb'+u+')" stroke="#6a0d1e" stroke-width="3" stroke-linejoin="round"/><path d="M284 4 L204 4 L146 196 L224 196 Z" fill="url(#bb'+u+')" stroke="#0a1c44" stroke-width="3" stroke-linejoin="round"/><path d="M196 4 L204 4 L200 36 Z" fill="rgba(0,0,0,.35)"/>'+
   sc+'<circle cx="200" cy="252" r="114" fill="url(#gr'+u+')" stroke="#7a4a00" stroke-width="4"/></g>'+
   '<circle cx="200" cy="252" r="96" fill="url(#gd'+u+')" stroke="#7a4a00" stroke-width="3"/><circle cx="200" cy="252" r="86" fill="url(#dk'+u+')" stroke="#b8860b" stroke-width="5"/><circle cx="200" cy="252" r="86" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 8" opacity=".9"/>'+
   '<g filter="url(#ds'+u+')">'+st+'<polygon points="'+starPts(200,256,68,28)+'" fill="none" stroke="#7a0c20" stroke-width="4" stroke-linejoin="round"/></g>'+
   '<path d="M118 200 A100 100 0 0 1 220 158" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".75"/>'+glint(76,206,22,u)+glint(336,168,16,u)},
 melon:function(u){
  var seeds=[[118,140,-22],[170,108,8],[232,108,-8],[282,140,22],[150,176,-30],[200,150,0],[252,176,30]].map(function(s){var y=s[1]+52;return '<ellipse cx="'+s[0]+'" cy="'+y+'" rx="8" ry="13" fill="#2a1a0a" transform="rotate('+s[2]+' '+s[0]+' '+y+')"/><ellipse cx="'+(s[0]-2)+'" cy="'+(y-4)+'" rx="2.5" ry="4" fill="#fff" opacity=".55" transform="rotate('+s[2]+' '+s[0]+' '+y+')"/>'}).join('');
  return '<defs>'+common(u)+rg('fl'+u,.5,.1,1,[[0,'#ff9aa6'],[.6,'#ff4d5e'],[1,'#d41f3e']])+lg('rd'+u,0,0,0,1,[[0,'#3fbf5f'],[1,'#15692c']])+lg('rl'+u,0,0,0,1,[[0,'#e2f6c4'],[1,'#a6dc7c']])+'</defs>'+
   floor(u,200,344,150,13)+
   '<g filter="url(#ds'+u+')"><path d="M26 158 A174 174 0 0 0 374 158 Z" fill="#0f5a23"/><path d="M26 148 A174 174 0 0 0 374 148 Z" fill="url(#rd'+u+')" stroke="#0f5a23" stroke-width="4" stroke-linejoin="round"/></g>'+
   '<path d="M46 148 A154 154 0 0 0 354 148 Z" fill="url(#rl'+u+')"/><path d="M60 148 A140 140 0 0 0 340 148 Z" fill="url(#fl'+u+')"/>'+seeds+
   '<ellipse cx="170" cy="262" rx="9" ry="12" fill="#2a1a0a"/><ellipse cx="230" cy="262" rx="9" ry="12" fill="#2a1a0a"/><ellipse cx="167" cy="258" rx="3.5" ry="4.5" fill="#fff"/><ellipse cx="227" cy="258" rx="3.5" ry="4.5" fill="#fff"/><path d="M176 288 Q200 316 224 288" fill="none" stroke="#2a1a0a" stroke-width="6" stroke-linecap="round"/><ellipse cx="138" cy="284" rx="15" ry="9" fill="#ff8a98" opacity=".75"/><ellipse cx="262" cy="284" rx="15" ry="9" fill="#ff8a98" opacity=".75"/>'+
   '<path d="M72 160 A130 130 0 0 0 116 250" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/><path d="M60 40 L52 50" stroke="#ff4d5e"/>'+
   '<g transform="translate(200 62)" filter="url(#ds'+u+')"><path d="M-72 42 L-88 -22 L-44 10 L0 -42 L44 10 L88 -22 L72 42 Z" fill="url(#gv'+u+')" stroke="#7a4a00" stroke-width="4" stroke-linejoin="round"/><path d="M-72 42 L-88 -22 L-44 10 L0 -42 Z" fill="#fff" opacity=".22"/><circle cx="-88" cy="-26" r="9" fill="url(#gr'+u+')" stroke="#7a4a00" stroke-width="2"/><circle cx="0" cy="-46" r="10" fill="#4fbf5f" stroke="#1d6d33" stroke-width="2"/><circle cx="88" cy="-26" r="9" fill="#4f9bff" stroke="#1d4e9e" stroke-width="2"/><rect x="-72" y="30" width="144" height="16" rx="6" fill="url(#gv'+u+')" stroke="#7a4a00" stroke-width="3"/></g>'+
   glint(40,96,22,u)+glint(358,86,18,u)+glint(352,302,14,u)},
 lens:function(u){
  var tiles=[['A',52,320,'#ff5c72'],['Z',340,54,'#6bcb77'],['W',50,92,'#4f9bff']].map(function(t,i){return '<g transform="rotate('+(i*7-8)+' '+t[1]+' '+t[2]+')" filter="url(#ds'+u+')"><rect x="'+(t[1]-27)+'" y="'+(t[2]-27)+'" width="54" height="54" rx="11" fill="'+t[3]+'" stroke="#fff" stroke-width="4"/><rect x="'+(t[1]-23)+'" y="'+(t[2]-23)+'" width="46" height="22" rx="9" fill="#fff" opacity=".28"/><text x="'+t[1]+'" y="'+(t[2]+14)+'" font-family="'+SANS+'" font-size="38" font-weight="bold" fill="#fff" text-anchor="middle">'+t[0]+'</text></g>'}).join('');
  return '<defs>'+common(u)+rg('gs'+u,.32,.28,.9,[[0,'#ffffff'],[.45,'#bfe9ff'],[1,'#5aaee8']])+lg('hd'+u,0,0,0,1,[[0,'#7a4a00'],[.3,'#ffd56a'],[.55,'#c98a1a'],[1,'#5e3800']])+'</defs>'+
   floor(u,200,392,126,11)+tiles+
   '<g transform="rotate(-45 262 262)" filter="url(#ds'+u+')"><rect x="236" y="246" width="52" height="136" rx="22" fill="url(#hd'+u+')" stroke="#5e3800" stroke-width="3"/><rect x="232" y="238" width="60" height="26" rx="10" fill="url(#gd'+u+')" stroke="#7a4a00" stroke-width="3"/></g>'+
   '<g filter="url(#ds'+u+')"><circle cx="175" cy="175" r="122" fill="url(#gs'+u+')" stroke="url(#gd'+u+')" stroke-width="22"/><circle cx="175" cy="175" r="133" fill="none" stroke="#7a4a00" stroke-width="3"/><circle cx="175" cy="175" r="112" fill="none" stroke="#7a4a00" stroke-width="2.5"/></g>'+
   '<text x="175" y="200" font-family="'+SANS+'" font-size="68" font-weight="bold" fill="#1a4496" text-anchor="middle" letter-spacing="2" stroke="#fff" stroke-width="2" paint-order="stroke">WORD</text>'+
   '<path d="M92 118 A102 102 0 0 1 156 74" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".9"/><ellipse cx="252" cy="244" rx="26" ry="10" fill="#fff" opacity=".35" transform="rotate(40 252 244)"/>'+glint(340,128,18,u)+glint(66,56,16,u)},
 rainbow:function(u){
  var cols=['#ff3d5e','#ff9a1c','#ffd926','#3dbf5a','#2f86e6','#7a4de0'],arcs='';
  cols.forEach(function(c,i){var r=172-i*20,x1=200-r,x2=200+r;arcs+='<path d="M'+x1+' 292 A'+r+' '+r+' 0 0 1 '+x2+' 292" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="22" transform="translate(0 7)"/><path d="M'+x1+' 292 A'+r+' '+r+' 0 0 1 '+x2+' 292" fill="none" stroke="'+c+'" stroke-width="21"/><path d="M'+(x1+3)+' 288 A'+(r-6)+' '+(r-6)+' 0 0 1 '+(x2-3)+' 288" fill="none" stroke="#fff" stroke-width="5" opacity=".35"/>'});
  var cloud=function(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+s+')" filter="url(#ds'+u+')"><ellipse cx="0" cy="8" rx="56" ry="26" fill="url(#cl'+u+')"/><circle cx="-28" cy="-8" r="26" fill="url(#cl'+u+')"/><circle cx="12" cy="-22" r="32" fill="url(#cl'+u+')"/><circle cx="40" cy="0" r="22" fill="url(#cl'+u+')"/></g>'};
  var balls=[['#ff3d5e',92],['#ffd926',152],['#3dbf5a',212],['#2f86e6',272]].map(function(d){return '<circle cx="'+(d[1]+8)+'" cy="352" r="27" fill="'+d[0]+'"/><circle cx="'+(d[1]+8)+'" cy="352" r="27" fill="url(#bs'+u+')"/><ellipse cx="'+(d[1]-1)+'" cy="341" rx="9" ry="6" fill="#fff" opacity=".8" transform="rotate(-30 '+(d[1]-1)+' 341)"/>'}).join('');
  var st='';for(var i=0;i<5;i++){var a0=-Math.PI/2+i*2*Math.PI/5,cx=200,cy=106,R=58,r=24,tip=[cx+Math.cos(a0)*R,cy+Math.sin(a0)*R],l=[cx+Math.cos(a0-Math.PI/5)*r,cy+Math.sin(a0-Math.PI/5)*r],rr=[cx+Math.cos(a0+Math.PI/5)*r,cy+Math.sin(a0+Math.PI/5)*r];
    st+='<polygon points="'+cx+','+cy+' '+tip[0].toFixed(1)+','+tip[1].toFixed(1)+' '+l[0].toFixed(1)+','+l[1].toFixed(1)+'" fill="#ffe985"/><polygon points="'+cx+','+cy+' '+tip[0].toFixed(1)+','+tip[1].toFixed(1)+' '+rr[0].toFixed(1)+','+rr[1].toFixed(1)+'" fill="#d9981a"/>'}
  return '<defs>'+common(u)+rg('cl'+u,.4,.25,.9,[[0,'#ffffff'],[1,'#c9d4ee']])+rg('bs'+u,.35,.3,.8,[[0,'#ffffff00'],[.7,'#00000010'],[1,'#00000060']])+'</defs>'+
   floor(u,200,386,150,10)+'<g filter="url(#ds'+u+')">'+arcs+'</g>'+cloud(50,298,1)+cloud(350,298,1)+balls+
   '<g filter="url(#ds'+u+')">'+st+'<polygon points="'+starPts(200,106,58,24)+'" fill="none" stroke="#7a4a00" stroke-width="4" stroke-linejoin="round"/></g>'+
   glint(92,66,20,u)+glint(312,56,22,u)+glint(350,196,14,u)},
 piano:function(u){
  var lines='',blk='';
  /* a keyboard seen from a little above: the back edge is shorter than the front edge */
  for(var i=0;i<8;i++){var xt=88+i*28,xb=26+i*43.5;lines+='<line x1="'+xt+'" y1="262" x2="'+xb+'" y2="352" stroke="#2a2a4a" stroke-width="2.5"/>'}
  [1,2,4,5,6].forEach(function(i){var xt=88+i*28,xb=26+i*43.5,w1=11,w2=16;blk+='<polygon points="'+(xt-w1)+',262 '+(xt+w1)+',262 '+(xb+w2+2)+',318 '+(xb-w2-2)+',318" fill="url(#bk'+u+')"/><polygon points="'+(xb-w2-2)+',318 '+(xb+w2+2)+',318 '+(xb+w2+2)+',328 '+(xb-w2-2)+',328" fill="#0a0a1a"/>'});
  return '<defs>'+common(u)+lg('wk'+u,0,0,0,1,[[0,'#ffffff'],[1,'#d9ddf2']])+lg('bk'+u,0,0,0,1,[[0,'#4a4a72'],[1,'#12122a']])+lg('fr'+u,0,0,0,1,[[0,'#6b2fa8'],[1,'#2a0f4a']])+rg('nh'+u,.3,.25,.85,[[0,'#fff7c4'],[.5,'#f0b72e'],[1,'#8a5a00']])+lg('st'+u,0,0,1,0,[[0,'#8a5a00'],[.4,'#ffe98a'],[1,'#b8860b']])+'</defs>'+
   floor(u,200,392,172,10)+
   '<g filter="url(#ds'+u+')"><polygon points="68,250 332,250 396,360 4,360" fill="url(#fr'+u+')" stroke="#2a0f4a" stroke-width="3" stroke-linejoin="round"/><polygon points="4,360 396,360 396,388 4,388" fill="#1c0a35"/><polygon points="80,262 320,262 372,352 28,352" fill="url(#wk'+u+')"/>'+lines+blk+'<polygon points="80,262 320,262 322,268 78,268" fill="rgba(0,0,0,.25)"/></g>'+
   '<g filter="url(#ds'+u+')"><rect x="164" y="74" width="13" height="152" fill="url(#st'+u+')" stroke="#7a4a00" stroke-width="2.5"/><rect x="298" y="46" width="13" height="152" fill="url(#st'+u+')" stroke="#7a4a00" stroke-width="2.5"/>'+
   '<polygon points="164,74 311,46 311,88 164,118" fill="url(#gv'+u+')" stroke="#7a4a00" stroke-width="3" stroke-linejoin="round"/><ellipse cx="140" cy="226" rx="40" ry="29" fill="url(#nh'+u+')" stroke="#7a4a00" stroke-width="3.5" transform="rotate(-22 140 226)"/><ellipse cx="274" cy="198" rx="40" ry="29" fill="url(#nh'+u+')" stroke="#7a4a00" stroke-width="3.5" transform="rotate(-22 274 198)"/></g>'+
   '<polygon points="170,86 304,60 304,68 170,94" fill="#fff" opacity=".6"/><ellipse cx="126" cy="216" rx="13" ry="7" fill="#fff" opacity=".7" transform="rotate(-22 126 216)"/><ellipse cx="260" cy="188" rx="13" ry="7" fill="#fff" opacity=".7" transform="rotate(-22 260 188)"/>'+
   glint(62,98,22,u)+glint(352,104,20,u)+glint(206,22,15,u)},
 bolt:function(u){
  var cap=function(x,y,w,t){return '<g font-family="'+SANS+'" font-weight="bold" text-anchor="middle"><rect x="'+x+'" y="'+(y+9)+'" width="'+w+'" height="54" rx="12" fill="#6b4a00"/><rect x="'+x+'" y="'+y+'" width="'+w+'" height="54" rx="12" fill="#fff6dc" stroke="#b8860b" stroke-width="3"/><rect x="'+(x+5)+'" y="'+(y+4)+'" width="'+(w-10)+'" height="18" rx="8" fill="#fff" opacity=".75"/><text x="'+(x+w/2)+'" y="'+(y+38)+'" font-size="28" fill="#3a1566">'+t+'</text></g>'};
  return '<defs>'+common(u)+rg('pl'+u,.35,.28,.9,[[0,'#bf8cf5'],[.45,'#7a3fc0'],[1,'#2a0d52']])+lg('bt'+u,0,0,1,1,[[0,'#fff6b0'],[.35,'#ffc928'],[.7,'#d98f0a'],[1,'#8a5a00']])+'</defs>'+
   floor(u,200,392,140,11)+
   '<g filter="url(#ds'+u+')"><circle cx="200" cy="190" r="172" fill="url(#pl'+u+')" stroke="url(#gd'+u+')" stroke-width="14"/><circle cx="200" cy="190" r="152" fill="none" stroke="#fff3b0" stroke-width="2" stroke-dasharray="2 9" opacity=".85"/></g>'+
   '<ellipse cx="150" cy="86" rx="92" ry="42" fill="#fff" opacity=".22" transform="rotate(-18 150 86)"/>'+
   '<g filter="url(#ds'+u+')"><path d="M248 44 L122 220 L194 220 L166 366 L304 172 L226 172 L272 44 Z" fill="#6a4300"/><path d="M238 30 L112 206 L184 206 L156 352 L294 160 L216 160 L262 30 Z" fill="url(#bt'+u+')" stroke="#7a4a00" stroke-width="5" stroke-linejoin="round"/><path d="M236 52 L144 190 L196 190" fill="none" stroke="#fff9d0" stroke-width="8" stroke-linecap="round" opacity=".85"/></g>'+
   cap(44,318,96,'Ctrl')+cap(262,318,66,'C')+glint(60,96,20,u)+glint(344,104,22,u)+glint(330,290,13,u)}
};

/* ---------- which game gives which reward ---------- */
const REWARDS = {
  jump:      { emb: 'diamond', game: 'Jump Over!',   title: 'Diamond Jumper', bg: ['#ffffff', '#bfe6f7'], frame: '#1d9bd8', ink: '#14649c' },
  blaster:   { emb: 'rocket',  game: 'Star Blaster', title: 'Space Ace',      bg: ['#ffffff', '#c9ccf5'], frame: '#4a4fd0', ink: '#2a2f9a' },
  commando:  { emb: 'medal',   game: 'Commando Run', title: 'Hero Medal',     bg: ['#fffaf0', '#f6c9be'], frame: '#d94a3d', ink: '#9a1c28' },
  fruit:     { emb: 'melon',   game: 'Slice & Pop',  title: 'Fruit Master',   bg: ['#ffffff', '#ffd0d8'], frame: '#e0405a', ink: '#a8203a' },
  words:     { emb: 'lens',    game: 'Word Hunt',    title: 'Word Detective', bg: ['#ffffff', '#bfe0f7'], frame: '#2a8fd8', ink: '#1d4e9e' },
  pattern:   { emb: 'rainbow', game: 'Pattern Pop!', title: 'Pattern Star',   bg: ['#ffffff', '#d9d0f7'], frame: '#8a5cf5', ink: '#5a2fb5' },
  piano:     { emb: 'piano',   game: 'Piano',        title: 'Music Maker',    bg: ['#ffffff', '#e0cdf3'], frame: '#7b3fb5', ink: '#4a1d7a' },
  shortcuts: { emb: 'bolt',    game: 'Shortcut Lab', title: 'Shortcut Hero',  bg: ['#ffffff', '#d6c7f2'], frame: '#6a35b8', ink: '#3a1566' }
};
let uidN = 0;
/* the picture is the reward: a big 3D drawing on a soft spotlight, with just a small caption plate */
function card(r, name) {
  if (r.cert === 'desktop') return desktopCert(r, name);
  const u = 'r' + (uidN++), n = (name || '').trim(); let g = '';
  g += '<defs>' + common('c' + u) + '<radialGradient id="sp' + u + '" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="' + r.bg[0] + '"/><stop offset="1" stop-color="' + r.bg[1] + '"/></radialGradient><linearGradient id="fl' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="' + r.frame + '" stop-opacity=".16"/></linearGradient></defs>';
  g += '<rect width="' + W + '" height="' + H + '" fill="url(#sp' + u + ')"/><rect y="560" width="' + W + '" height="' + (H - 560) + '" fill="url(#fl' + u + ')"/>';
  g += '<rect x="22" y="22" width="' + (W - 44) + '" height="' + (H - 44) + '" rx="26" fill="none" stroke="' + r.frame + '" stroke-width="12"/><rect x="40" y="40" width="' + (W - 80) + '" height="' + (H - 80) + '" rx="14" fill="none" stroke="url(#gdc' + u + ')" stroke-width="3"/>';
  g += CC.keycapsSvg(CC.APP_NAME, mid, 52, 24);
  g += '<g transform="translate(' + (mid - 230) + ' 86) scale(1.15)">' + EMB[r.emb]('e' + u) + '</g>';
  g += '<g filter="url(#dsc' + u + ')"><rect x="276" y="612" width="571" height="118" rx="22" fill="#fffdf4" stroke="url(#gdc' + u + ')" stroke-width="5"/></g>';
  g += '<text x="' + mid + '" y="662" font-family="' + SERIF + '" font-size="46" font-style="italic" font-weight="bold" fill="url(#gvc' + u + ')" stroke="#8a5a00" stroke-width="2" paint-order="stroke" stroke-linejoin="round" text-anchor="middle">' + esc(r.title) + '</text>';
  g += '<text x="' + mid + '" y="692" font-family="' + SERIF + '" font-size="19" fill="' + r.ink + '" text-anchor="middle">for completing <tspan font-weight="bold">' + esc(r.game) + '</tspan></text>';
  const fsz = n.length <= 16 ? 30 : n.length <= 22 ? 25 : 21;
  g += '<text x="' + mid + '" y="722" font-family="' + SCRIPT + '" font-size="' + fsz + '" font-weight="bold" fill="' + r.ink + '" text-anchor="middle">' + esc(n) + '</text>';
  if (!n) g += '<line x1="420" y1="722" x2="703" y2="722" stroke="' + r.ink + '" stroke-width="1.6" opacity=".6"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
}

/* ---------- the Desktop Skills certificate (A4 landscape): a window title bar, the TECH EXPLORERS keycaps and the 8 gems ---------- */
function desktopCert(r, name) {
  const u = 'dc' + (uidN++), n = (name || '').trim(), dt = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const FR = ['#4d8dff', '#7a63ff', '#22c6c6', '#ffd23f'], INK = '#15163a', BLUE = '#2f6bd8';
  let g = '<defs><linearGradient id="bg' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#edf3ff"/></linearGradient>' +
    '<linearGradient id="tb' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4edff"/><stop offset="1" stop-color="#c3d6fb"/></linearGradient>' +
    '<linearGradient id="wn' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fdcff"/><stop offset="1" stop-color="#2f7be8"/></linearGradient></defs>';
  g += '<rect width="' + W + '" height="' + H + '" fill="url(#bg' + u + ')"/>';
  FR.forEach(function (c, i) { const o = 12 + i * 7; g += '<rect x="' + o + '" y="' + o + '" width="' + (W - 2 * o) + '" height="' + (H - 2 * o) + '" rx="' + (16 - i * 2) + '" fill="none" stroke="' + c + '" stroke-width="7"/>'; });
  g += '<rect x="58" y="58" width="' + (W - 116) + '" height="' + (H - 116) + '" rx="6" fill="none" stroke="' + INK + '" stroke-width="2"/>';
  /* a window title bar across the top */
  g += '<rect x="58" y="58" width="' + (W - 116) + '" height="38" rx="6" fill="url(#tb' + u + ')" stroke="' + INK + '" stroke-width="2"/>';
  [['#ff5f57', 82], ['#febc2e', 104], ['#28c840', 126]].forEach(function (d) { g += '<circle cx="' + d[1] + '" cy="77" r="7" fill="' + d[0] + '" stroke="' + INK + '" stroke-width="1.5"/>'; });
  g += '<text x="' + mid + '" y="83" font-family="' + SANS + '" font-size="16" font-weight="bold" letter-spacing="2" fill="' + INK + '" opacity=".65" text-anchor="middle">DESKTOP SKILLS</text>';
  g += CC.keycapsSvg(CC.APP_NAME, mid, 116, 38);
  g += '<text x="' + mid + '" y="236" font-family="' + SERIF + '" font-size="54" font-weight="bold" fill="' + INK + '" text-anchor="middle">Certificate of Achievement</text>';
  g += '<text x="' + mid + '" y="276" font-family="' + SERIF + '" font-size="24" font-style="italic" fill="#555" text-anchor="middle">proudly presented to</text>';
  const fsz = n.length <= 14 ? 60 : n.length <= 20 ? 48 : 38;
  g += '<text x="' + mid + '" y="346" font-family="' + SCRIPT + '" font-size="' + fsz + '" fill="#d8334e" text-anchor="middle">' + esc(n) + '</text>';
  g += '<line x1="250" y1="362" x2="873" y2="362" stroke="#e0a800" stroke-width="3"/>';
  g += '<text x="' + mid + '" y="402" font-family="' + SANS + '" font-size="22" fill="#333" text-anchor="middle">for completing</text>';
  g += '<text x="' + mid + '" y="450" font-family="' + SANS + '" font-size="44" font-weight="bold" fill="' + BLUE + '" text-anchor="middle">' + esc(r.game) + '</text>';
  g += '<text x="' + mid + '" y="482" font-family="' + SANS + '" font-size="20" fill="#333" text-anchor="middle">Windows, folders and files · Year ' + (r.year || 1) + '</text>';
  const sk = r.skills || [], half = Math.ceil(sk.length / 2);
  [sk.slice(0, half), sk.slice(half)].forEach(function (row, i) { g += '<text x="' + mid + '" y="' + (516 + i * 26) + '" font-family="' + SANS + '" font-size="17" fill="#555" text-anchor="middle">' + esc(row.join('  •  ')) + '</text>'; });
  /* the 8 gems, in a row */
  const gm = r.gems || [], gs = 60, gap = 16, tw = gm.length * gs + (gm.length - 1) * gap, x0 = mid - tw / 2;
  g += '<rect x="' + (x0 - 24) + '" y="556" width="' + (tw + 48) + '" height="' + (gs + 20) + '" rx="' + ((gs + 20) / 2) + '" fill="#fff" stroke="' + FR[0] + '" stroke-width="3"/>';
  gm.forEach(function (k, i) { g += CC.SKILLS.gem(k, 0).replace('<svg ', '<svg x="' + (x0 + i * (gs + gap)).toFixed(0) + '" y="566" width="' + gs + '" height="' + gs + '" '); });
  /* decoration: a little window on the left, a folder on the right */
  g += '<rect x="86" y="296" width="150" height="102" rx="10" fill="#fff" stroke="' + INK + '" stroke-width="3"/><path d="M86 306 a10 10 0 0 1 10 -10 h130 a10 10 0 0 1 10 10 v14 h-150 z" fill="' + FR[0] + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<circle cx="100" cy="308" r="4" fill="#ff5f57"/><circle cx="114" cy="308" r="4" fill="#febc2e"/><circle cx="128" cy="308" r="4" fill="#28c840"/><rect x="98" y="332" width="126" height="48" rx="5" fill="url(#wn' + u + ')"/>' +
    '<polygon points="' + starPts(161, 356, 17, 7) + '" fill="#ffd23f" stroke="#e0a800" stroke-width="1.5"/>';
  g += '<path d="M886 318 h42 l12 14 h102 v66 h-156 z" fill="#ffd23f" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><path d="M886 346 h156 v52 h-156 z" fill="#ffe27a" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<polygon points="' + starPts(964, 372, 14, 6) + '" fill="#ff5c72"/>';
  [[250, 440, 7, '#6bcb77'], [878, 446, 6, '#ff9f45'], [1050, 296, 8, '#ffd23f'], [78, 450, 7, '#ff5c72'], [244, 300, 6, '#7a63ff'], [884, 300, 6, '#22c6c6']].forEach(function (s2) { g += '<polygon points="' + starPts(s2[0], s2[1], s2[2], s2[2] * .4) + '" fill="' + s2[3] + '"/>'; });
  /* rosette */
  g += '<polygon points="544,690 526,748 548,738 561,753 566,694" fill="#ff5c72"/><polygon points="578,690 596,748 574,738 561,753 556,694" fill="#3b82f6"/>';
  g += '<circle cx="561" cy="674" r="40" fill="#ffd23f" stroke="#e0a800" stroke-width="4"/><circle cx="561" cy="674" r="31" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><polygon points="' + starPts(561, 674, 21, 9) + '" fill="#e07a1a"/>';
  g += '<text x="240" y="702" font-family="' + SANS + '" font-size="20" fill="' + INK + '" text-anchor="middle">' + esc(dt) + '</text><line x1="120" y1="710" x2="360" y2="710" stroke="' + INK + '" stroke-width="1.5"/><text x="240" y="732" font-family="' + SANS + '" font-size="16" fill="#555" text-anchor="middle">Date</text>';
  g += '<line x1="763" y1="710" x2="1003" y2="710" stroke="' + INK + '" stroke-width="1.5"/><text x="883" y="732" font-family="' + SANS + '" font-size="16" fill="#555" text-anchor="middle">Teacher</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
}

/* ---------- a gem to look at, big: it is saved as a picture (see-through, or on a soft background), never printed on paper ---------- */
function saveGem(kind, title, withBg) {
  const I = CC.SKILLS.gemInfo(kind) || { h: 44, s: 80 }, px = 1024, svg = CC.SKILLS.gem(kind, px), img = new Image();
  img.onload = function () {
    const c = document.createElement('canvas'); c.width = px; c.height = px; const x = c.getContext('2d');
    if (withBg) { const gr = x.createRadialGradient(px / 2, px / 2, 40, px / 2, px / 2, px * 0.72); gr.addColorStop(0, 'hsl(' + I.h + ',80%,97%)'); gr.addColorStop(1, 'hsl(' + I.h + ',62%,78%)'); x.fillStyle = gr; x.fillRect(0, 0, px, px); }
    x.drawImage(img, 0, 0, px, px);
    c.toBlob(function (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gem-' + String(title || kind).toLowerCase().replace(/[^a-z0-9]+/g, '-') + (withBg ? '' : '-no-background') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function showGem(kind, o, onClose) {
  dismiss(); afterClose = onClose || null;
  const I = CC.SKILLS.gemInfo(kind) || { h: 44 }, s = document.createElement('div'); s.className = 'rw-screen rw-gemscreen'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', o.title);
  s.style.setProperty('--gh', I.h);
  function btn(label, cls, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (cls ? ' ' + cls : ''); b.textContent = label; b.addEventListener('click', function () { b.blur(); fn(); }); return b; }
  const bar = document.createElement('div'); bar.className = 'rw-bar';
  bar.appendChild(btn('⬇ Save gem (no background)', 'primary', function () { saveGem(kind, o.title, false); }));
  bar.appendChild(btn('⬇ Save with background', '', function () { saveGem(kind, o.title, true); }));
  bar.appendChild(btn('✖ Close', '', close));
  const big = document.createElement('div'); big.className = 'rw-gembig'; big.innerHTML = '<span class="rw-glow"></span>' + CC.SKILLS.gem(kind, 0);
  const cap = document.createElement('div'); cap.className = 'rw-gemcap'; cap.innerHTML = '<b>' + esc(o.title) + '</b><i>' + esc(o.game || '') + '</i>';
  s.appendChild(bar); s.appendChild(big); s.appendChild(cap);
  document.body.appendChild(s); document.body.classList.add('rw-open'); screen = s;
  onEsc = function (e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } }; document.addEventListener('keydown', onEsc, true);
  if (CC.sfx && CC.sfx.levelComplete) CC.sfx.levelComplete();
}

/* ---------- what has been earned (kept for a few hours on this computer) ---------- */
const S = { earned: {}, prog: {}, name: '' };
(function () { const k = CC.keep.load('rewards'); if (k) { S.earned = k.earned || {}; S.prog = k.prog || {}; S.name = k.name || ''; } })();
function keep() { CC.keep.save('rewards', S); }

/* ---------- the reward screen: the picture, a name box, print, download ---------- */
let screen = null, onEsc = null, afterClose = null;
function dismiss() {
  if (!screen) return; document.removeEventListener('keydown', onEsc, true); if (screen.parentNode) screen.parentNode.removeChild(screen); screen = null; document.body.classList.remove('rw-open');
}
function close() { const cb = afterClose; afterClose = null; dismiss(); if (cb) cb(); }   /* closing the picture can bring back the screen the child came from */
function show(id, onClose) {
  const r = typeof id === 'object' ? id : REWARDS[id]; if (!r) return; dismiss(); afterClose = onClose || null;
  const s = document.createElement('div'); s.className = 'rw-screen'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', r.title);
  const bar = document.createElement('div'); bar.className = 'rw-bar';
  const nm = document.createElement('input'); nm.type = 'text'; nm.className = 'rw-name'; nm.maxLength = 26; nm.placeholder = '✏️ Name on the reward'; nm.value = S.name; nm.setAttribute('aria-label', 'Name on the reward');
  nm.addEventListener('keydown', function (e) { e.stopPropagation(); }); nm.addEventListener('keyup', function (e) { e.stopPropagation(); });
  const paper = document.createElement('div'); paper.className = 'rw-paper'; paper.innerHTML = card(r, S.name);
  nm.addEventListener('input', function () { S.name = nm.value; keep(); paper.innerHTML = card(r, S.name); });
  function btn(label, cls, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (cls ? ' ' + cls : ''); b.textContent = label; b.addEventListener('click', function () { b.blur(); fn(); }); return b; }
  const dl = btn('⬇ Download picture', 'primary', function () {
    const img = new Image();
    img.onload = function () { const c = document.createElement('canvas'); c.width = 2246; c.height = 1588; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'reward-' + r.title.toLowerCase().replace(/[^a-z]+/g, '-') + (S.name ? '-' + S.name.replace(/[^\w-]+/g, '-') : '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(card(r, S.name));
  });
  bar.appendChild(nm); bar.appendChild(btn('🖨 Print', '', function () { window.print(); })); bar.appendChild(dl); bar.appendChild(btn('✖ Close', '', close));
  const note = document.createElement('p'); note.className = 'rw-note'; note.textContent = 'Tip: print on A4, landscape. Leave the name empty to write it by hand.';
  s.appendChild(bar); s.appendChild(paper); s.appendChild(note);
  document.body.appendChild(s); document.body.classList.add('rw-open'); screen = s;
  onEsc = function (e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } }; document.addEventListener('keydown', onEsc, true);
  if (CC.sfx && CC.sfx.levelComplete) CC.sfx.levelComplete();
}

CC.rewards = {
  list: REWARDS,
  has: function (id) { return !!S.earned[id]; },
  /* a game calls earn() when its last level / all of its challenges are finished; it returns true the first time */
  earn: function (id) { if (!REWARDS[id] || S.earned[id]) return false; S.earned[id] = true; keep(); return true; },
  /* for games made of separate parts (the piano songs): note(id, 'songName', howManyParts) earns the reward when every part is done */
  note: function (id, key, total) { const p = S.prog[id] = S.prog[id] || {}; p[key] = 1; keep(); if (Object.keys(p).length >= total) return CC.rewards.earn(id); return false; },
  show: show, close: close,
  /* a gem to look at big and save as a picture: CC.rewards.gem('ruby', { title: 'Ruby', game: 'Level 2 - Click & Type Quest' }, afterClose) */
  gem: showGem,
  /* test hooks (used only by the automated checks) */
  _card: card, _S: S
};
})();
