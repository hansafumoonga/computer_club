/* network.js - Network Builder (Years 3 to 6): a small network simulator.
     Join computers to a SWITCH with cables, share a printer, join the switch to a ROUTER and the router to the INTERNET, add Wi-Fi devices,
     then send messages and watch them travel hop by hop. Later levels: find a broken cable, and build a whole network alone.
   A level is plain data: the devices, the cables already in place, and a list of steps (see lab.js). */
(function () {
'use strict';
const CC = window.CC, L = CC.lab, el = L.el;
const NS = 'http://www.w3.org/2000/svg';
const ICON = { pc: '🖥️', laptop: '💻', tablet: '📱', printer: '🖨️', net: '☁️' };
const WIRELESS = { laptop: 1, tablet: 1 };
const KIND = { pc: 'computer', laptop: 'laptop', tablet: 'tablet', printer: 'printer', net: 'internet', sw: 'switch', router: 'router' };

const NETPART = '192.168.1';
const HOST = { pc: 1, laptop: 1, tablet: 1, printer: 1 };
function nodeSvg(n, showIp) {
  let art;
  if (n.type === 'sw') art = '<rect x="-34" y="-14" width="68" height="28" rx="6" fill="#4d8dff" stroke="#15163a" stroke-width="2.5"/>' + [0, 1, 2, 3, 4].map(function (i) { return '<rect x="' + (-28 + i * 12) + '" y="-2" width="8" height="8" rx="1.5" fill="#15163a"/><circle cx="' + (-24 + i * 12) + '" cy="-8" r="1.8" fill="#9be8a5"/>'; }).join('');
  else if (n.type === 'router') art = '<path d="M-22 -8 L-28 -30 M22 -8 L28 -30" stroke="#15163a" stroke-width="4" stroke-linecap="round"/><rect x="-34" y="-10" width="68" height="26" rx="8" fill="#ff9f45" stroke="#15163a" stroke-width="2.5"/><circle cx="-20" cy="3" r="3" fill="#9be8a5"/><circle cx="-8" cy="3" r="3" fill="#9be8a5"/><path d="M6 8 A8 8 0 0 1 22 8 M10 8 A4 4 0 0 1 18 8" fill="none" stroke="#15163a" stroke-width="2.2" stroke-linecap="round"/>';
  else art = '<text y="14" text-anchor="middle" font-size="40">' + ICON[n.type] + '</text>';
  return '<g class="nw-node" data-id="' + n.id + '" transform="translate(' + n.x + ' ' + n.y + ')"><rect class="bg" x="-48" y="-40" width="96" height="76" rx="16"/>' + art +
    '<text y="54" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">' + L.esc(n.name) + '</text>' + (showIp && (n.ip || HOST[n.type]) ? '<text y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="' + (!n.ip ? '#ff9aa8' : n.ip.indexOf(NETPART + '.') === 0 ? '#9be8a5' : '#ffb52e') + '" font-family="monospace">' + (n.ip || 'no IP address') + '</text>' : '') + '</g>';
}

function build(body, api, year, lv) {
  const N = { nodes: {}, links: [], tool: 'cable', sel: null, busy: false, drag: null };
  let ip = 2; const showIp = year >= 4 || !!lv.ip;
  lv.nodes.forEach(function (a) { const n = { id: a[0], type: a[1], name: a[2], x: a[3], y: a[4] }; n.ip = n.type === 'net' ? '' : n.type === 'router' ? '192.168.1.1' : n.type === 'sw' ? '' : '192.168.1.' + (ip++); if ((lv.noip || []).indexOf(n.id) >= 0) n.ip = ''; if (lv.badip && lv.badip[n.id]) n.ip = lv.badip[n.id]; N.nodes[n.id] = n; });
  (lv.links || []).forEach(function (l) { N.links.push({ a: l[0], b: l[1], wifi: !!WIRELESS[N.nodes[l[0]].type] || !!WIRELESS[N.nodes[l[1]].type], broken: l[2] === 'broken' }); });

  body.innerHTML = '<div class="nw-wrap"><div class="nw-board"><svg class="nw-svg" viewBox="0 0 800 450" xmlns="' + NS + '"><defs><pattern id="nwGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 H0 V40" fill="none" stroke="#23265a" stroke-width="1"/></pattern></defs><rect width="800" height="450" fill="url(#nwGrid)"/><g class="links"></g><line class="nw-rubber" hidden/><g class="nodes"></g><g class="fx"></g></svg></div>' +
    '<div class="nw-side"><div class="nw-tools"><button type="button" class="nw-tool on" data-tool="cable"><span>🔌</span>Cable</button><button type="button" class="nw-tool" data-tool="send"><span>✉️</span>Send</button><button type="button" class="nw-tool" data-tool="cut"><span>✂️</span>Cut</button><button type="button" class="nw-tool" data-tool="info"><span>❓</span>What is it?</button>' + (showIp ? '<button type="button" class="nw-tool wide" data-tool="ip"><span>🏷️</span>IP address</button>' : '') + '</div><div class="nw-log"><h4>What is happening</h4></div></div></div>';
  const svg = body.querySelector('svg'), linkG = svg.querySelector('.links'), nodeG = svg.querySelector('.nodes'), fx = svg.querySelector('.fx'), rubber = svg.querySelector('.nw-rubber'), logBox = body.querySelector('.nw-log');
  const pt = function (e) { const m = svg.getScreenCTM().inverse(); return { x: e.clientX * m.a + e.clientY * m.c + m.e, y: e.clientX * m.b + e.clientY * m.d + m.f }; };
  const name = function (id) { return N.nodes[id].name; };
  function log(html, cls) { const p = el('p', cls || '', html); logBox.insertBefore(p, logBox.children[1] || null); while (logBox.children.length > 14) logBox.removeChild(logBox.lastChild); }
  function linkOf(a, b) { return N.links.filter(function (l) { return (l.a === a && l.b === b) || (l.a === b && l.b === a); })[0]; }
  function path(a, b) {   // the shortest way through working cables
    const prev = {}, q = [a]; prev[a] = null;
    while (q.length) { const c = q.shift(); if (c === b) { const p = []; let x = b; while (x) { p.unshift(x); x = prev[x]; } return p; }
      N.links.forEach(function (l) { if (l.broken) return; const o = l.a === c ? l.b : l.b === c ? l.a : null; if (o && !(o in prev)) { const t = N.nodes[o].type; if (o !== b && t !== 'sw' && t !== 'router') return; prev[o] = c; q.push(o); } }); }
    return null;
  }
  function rule(a, b) {
    const A = N.nodes[a], B = N.nodes[b], ta = A.type, tb = B.type, has = function (t) { return ta === t || tb === t; };
    if (a === b) return { ok: false };
    if (linkOf(a, b)) return { ok: false, why: 'They are already connected.' };
    if (WIRELESS[ta] || WIRELESS[tb]) return has('router') ? { ok: true, wifi: true } : { ok: false, why: 'A ' + KIND[WIRELESS[ta] ? ta : tb] + ' uses Wi-Fi. Wi-Fi comes from the ROUTER.' };
    if (has('net')) return has('router') ? { ok: true } : { ok: false, why: 'The internet plugs into the ROUTER, not the ' + KIND[ta === 'net' ? tb : ta] + '.' };
    if (ta === 'router' && tb === 'router') return { ok: false, why: 'One router is enough here.' };
    if (has('sw') || has('router')) return { ok: true };
    return { ok: false, why: 'These do not plug into each other. Plug each one into the SWITCH.' };
  }
  function draw() {
    linkG.innerHTML = N.links.map(function (l, i) { const A = N.nodes[l.a], B = N.nodes[l.b]; return '<line class="nw-link' + (l.wifi ? ' wifi' : '') + (l.broken ? ' bad' : '') + '" data-i="' + i + '" x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '"/>' + (l.broken ? '<text x="' + (A.x + B.x) / 2 + '" y="' + ((A.y + B.y) / 2 - 8) + '" text-anchor="middle" font-size="20" pointer-events="none">⚡</text>' : ''); }).join('');
    nodeG.innerHTML = Object.keys(N.nodes).map(function (k) { return nodeSvg(N.nodes[k], showIp); }).join('');
    if (N.sel) { const g = nodeG.querySelector('[data-id="' + N.sel + '"]'); if (g) g.classList.add('sel'); }
    const s = api.step(); if (s && N.hint) (s.hint || []).forEach(function (id) { const g = nodeG.querySelector('[data-id="' + id + '"]'); if (g) g.classList.add('glow'); });
  }
  function setTool(t) { N.tool = t; N.sel = null; body.querySelectorAll('.nw-tool').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === t); b.classList.remove('glow'); }); svg.classList.toggle('cut', t === 'cut'); draw(); }
  function connect(a, b) {
    const r = rule(a, b); N.sel = null;
    if (!r.ok) { draw(); if (r.why) { log(r.why, 'bad'); api.miss(r.why); } return; }
    N.links.push({ a: a, b: b, wifi: !!r.wifi }); L.sfx('pickup'); draw();
    log(r.wifi ? '<b>' + name(a) + '</b> joined <b>' + name(b) + '</b> by Wi-Fi 📶' : 'Cable: <b>' + name(a) + '</b> ↔ <b>' + name(b) + '</b>', 'ok');
    api.check({ t: 'link', a: a, b: b });
  }
  function bubble(id, txt, ms) {
    const n = N.nodes[id], w = txt.length * 8.5 + 26, g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'nw-bubble');
    g.innerHTML = '<rect x="' + (n.x - w / 2) + '" y="' + (n.y - 78) + '" width="' + w + '" height="28" rx="14" fill="#fff" stroke="#15163a" stroke-width="2"/><text x="' + n.x + '" y="' + (n.y - 59) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#15163a">' + L.esc(txt) + '</text>';
    fx.appendChild(g); setTimeout(function () { g.remove(); }, ms || 1900);
  }
  function fly(p, icon, each) {   // a packet travels along the path, one hop at a time
    return new Promise(function (res) {
      const pk = document.createElementNS(NS, 'text'); pk.setAttribute('class', 'nw-packet'); pk.setAttribute('font-size', '28'); pk.setAttribute('text-anchor', 'middle'); pk.textContent = icon; fx.appendChild(pk);
      let i = 0; const hop = function () {
        if (!svg.isConnected) { res(false); return; }
        if (i >= p.length - 1) { pk.remove(); res(true); return; }
        const A = N.nodes[p[i]], B = N.nodes[p[i + 1]], t0 = performance.now(), ms = 620, ln = linkG.querySelector('[data-i="' + N.links.indexOf(linkOf(p[i], p[i + 1])) + '"]'); if (ln) ln.classList.add('hot');
        (function f(now) {
          const u = Math.min(1, (now - t0) / ms); pk.setAttribute('x', A.x + (B.x - A.x) * u); pk.setAttribute('y', A.y + (B.y - A.y) * u + 8);
          if (u < 1) { let fired = false; const tid = setTimeout(function () { if (!fired) { fired = true; f(performance.now()); } }, 60); requestAnimationFrame(function (ts) { if (fired) return; fired = true; clearTimeout(tid); f(ts); }); return; }
          if (ln) ln.classList.remove('hot'); i++; L.sfx('tick');
          const g = nodeG.querySelector('[data-id="' + p[i] + '"]'); if (g) { g.classList.add('flash'); setTimeout(function () { g.classList.remove('flash'); }, 350); }
          if (each) each(p[i], i === p.length - 1); setTimeout(hop, 260);
        })(t0);
      }; hop();
    });
  }
  function send(a, b) {
    N.sel = null; draw(); if (N.busy) return;
    const A = N.nodes[a], B = N.nodes[b];
    if (A.type === 'sw' || A.type === 'router' || A.type === 'net' || A.type === 'printer') { api.miss('Start from a computer, a laptop or a tablet.'); return; }
    if (B.type === 'sw' || B.type === 'router') { api.miss('Send it to a computer, the printer or the internet. The ' + KIND[B.type] + ' only passes messages on.'); return; }
    /* every device needs an address on this network before it can send or receive */
    if (showIp) { const bad = [A, B].filter(function (n) { return HOST[n.type] && (!n.ip || n.ip.indexOf(NETPART + '.') !== 0); })[0];
      if (bad) { const why = !bad.ip ? bad.name + ' has no IP address, so nothing can find it. Give it one with the 🏷️ IP address tool.' : bad.name + ' is on the wrong network (' + bad.ip + '). Its address must start with ' + NETPART + '.'; L.sfx('softMiss'); bubble(bad.id, !bad.ip ? '❓ No address!' : '🚫 Wrong network!'); log(why, 'bad'); if (!api.check({ t: 'noip', id: bad.id, from: a, to: b })) api.miss(why); return; } }
    const p = path(a, b), toNet = B.type === 'net', print = B.type === 'printer';
    if (!p) { L.sfx('softMiss'); bubble(a, '❌ No way through!'); log('<b>' + A.name + '</b> cannot reach <b>' + B.name + '</b>. Check the cables.', 'bad'); const ok = api.check({ t: 'fail', from: a, to: b }); if (!ok) api.miss('No way through from ' + A.name + ' to ' + B.name + '. Check the cables.'); return; }
    N.busy = true; log('<b>' + A.name + '</b> sends ' + (toNet ? 'a request for a website 🌐' : print ? 'a page to print 🖨️' : 'a message ✉️') + ' to <b>' + B.name + '</b>');
    const each = function (id, last) {
      const n = N.nodes[id]; if (last) return;
      if (n.type === 'sw') { bubble(id, 'For ' + (toNet ? 'the router' : B.name) + '!', 900); log('<b>Switch</b>: this is for ' + (toNet ? 'the router' : B.name) + '. I send it down the right cable.'); }
      if (n.type === 'router') { bubble(id, toNet ? 'Out to the internet!' : 'Passing it on!', 900); log('<b>Router</b>: ' + (toNet ? 'this is for the internet. I pass it out of your network.' : 'I pass it on to ' + B.name + '.')); }
    };
    fly(p, toNet ? '🌐' : print ? '📄' : '✉️', each).then(function (ok) {
      if (!ok) return;
      if (toNet) { bubble(b, 'Here is the page!', 1000); log('<b>Internet</b>: here is the website. Sending it back.'); return fly(p.slice().reverse(), '📰').then(function () { bubble(a, '🌐 Website opened!'); log('<b>' + A.name + '</b> shows the website.', 'ok'); L.sfx('good'); N.busy = false; api.check({ t: 'web', from: a }); }); }
      bubble(b, print ? '🖨️ Printing...' : '✉️ Got it!'); log('<b>' + B.name + '</b> ' + (print ? 'prints the page.' : 'got the message.'), 'ok'); N.busy = false; api.check({ t: 'sent', from: a, to: b });
    });
  }
  /* ---------- giving a device its address: the network part must match the router, the host part must be its own ---------- */
  function setIp(id, parts) {
    const n = N.nodes[id], v = parts.map(function (x) { return String(x).trim(); });
    if (v.some(function (x) { return !/^\d{1,3}$/.test(x) || +x > 255; })) return 'Each part is a number from 0 to 255.';
    if (v.slice(0, 3).join('.') !== NETPART) return 'The first three numbers are the NETWORK part. They must match the router: ' + NETPART;
    const h = +v[3]; if (h === 1) return 'Number 1 belongs to the router. Choose another.'; if (h < 2 || h > 254) return 'The last number is the HOST part. Choose one from 2 to 254.';
    const ipv = NETPART + '.' + h, twin = Object.keys(N.nodes).filter(function (k) { return k !== id && N.nodes[k].ip === ipv; })[0];
    if (twin) return N.nodes[twin].name + ' already has that address. Every device needs its own.';
    n.ip = ipv; L.sfx('pickup'); draw(); bubble(id, '🏷️ ' + ipv); log('<b>' + n.name + '</b> now has the address <b>' + ipv + '</b>', 'ok'); api.check({ t: 'ip', id: id, ip: ipv }); return '';
  }
  function ipDialog(id) {
    const n = N.nodes[id]; if (!HOST[n.type]) { log('<b>' + n.name + '</b>: ' + (n.type === 'router' ? 'the router is ' + NETPART + '.1. It is the first address on the network.' : n.type === 'sw' ? 'a switch needs no address here. It just passes messages on.' : 'the internet is outside your network.')); bubble(id, n.type === 'router' ? NETPART + '.1' : 'No address needed', 1500); return; }
    const old = body.querySelector('.nw-dlg'); if (old) old.remove();
    const cur = (n.ip || '').split('.'), full = !!lv.fullIp || year >= 6, box = function (i, net) { const val = net ? (full ? (cur.length === 4 ? cur[i] : '') : NETPART.split('.')[i]) : (cur.length === 4 && n.ip.indexOf(NETPART + '.') === 0 ? cur[3] : ''); return '<input type="text" inputmode="numeric" maxlength="3" class="' + (net ? 'net' : 'host') + '" value="' + val + '"' + (net && !full ? ' readonly tabindex="-1"' : '') + ' aria-label="' + (net ? 'network part' : 'host part') + '">'; };
    const d = L.el('div', 'nw-dlg', '<div class="card"><h4>🏷️ IP address for ' + L.esc(n.name) + '</h4><div class="ipr">' + box(0, 1) + '<b>.</b>' + box(1, 1) + '<b>.</b>' + box(2, 1) + '<b>.</b>' + box(3, 0) + '</div><div class="lab"><span class="net">NETWORK part: the same for every device here</span><span class="host">HOST part: this device\'s own number</span></div><p class="err"></p><div class="row"><button type="button" class="btn primary" data-a="ok">Save</button><button type="button" class="btn" data-a="x">Cancel</button></div></div>');
    body.querySelector('.nw-board').appendChild(d); const ins = d.querySelectorAll('input'), first = full ? ins[0] : ins[3]; first.focus(); first.select();
    const save = function () { const why = setIp(id, [].map.call(ins, function (x) { return x.value; })); if (why) { d.querySelector('.err').textContent = why; L.sfx('softMiss'); api.touch(); } else d.remove(); };
    d.querySelector('[data-a="ok"]').addEventListener('click', save); d.querySelector('[data-a="x"]').addEventListener('click', function () { d.remove(); });
    [].forEach.call(ins, function (x) { x.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') save(); else if (e.key === 'Escape') d.remove(); }); x.addEventListener('input', function () { x.value = x.value.replace(/\D/g, ''); }); });
  }
  const INFO = { pc: 'A computer. It plugs into the switch with a cable.', laptop: 'A laptop. It joins the network by Wi-Fi, through the air.', tablet: 'A tablet. It joins the network by Wi-Fi, through the air.', printer: 'A printer. On a network, every computer can share it.',
    sw: 'A SWITCH joins many devices together with cables. It reads who a message is for and sends it down the right cable.', router: 'A ROUTER joins your network to other networks, like the internet. It also makes Wi-Fi.', net: 'The INTERNET: millions of networks joined together all over the world.' };

  /* ---- mouse ---- */
  const nodeAt = function (e) { const g = e.target.closest ? e.target.closest('.nw-node') : null; return g ? g.dataset.id : null; };
  svg.addEventListener('pointerdown', function (e) {
    if (api.st.locked || N.busy) return; const id = nodeAt(e);
    if (id && N.tool === 'cable') N.drag = { id: id, moved: false, x: e.clientX, y: e.clientY };
  });
  svg.addEventListener('pointermove', function (e) {
    const d = N.drag; if (!d) return; if (!d.moved) { if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return; d.moved = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { } }
    const p = pt(e), A = N.nodes[d.id]; rubber.removeAttribute('hidden'); rubber.setAttribute('x1', A.x); rubber.setAttribute('y1', A.y); rubber.setAttribute('x2', p.x); rubber.setAttribute('y2', p.y);
  });
  svg.addEventListener('pointerup', function (e) {
    const d = N.drag; N.drag = null; rubber.setAttribute('hidden', ''); if (!d) return; try { svg.releasePointerCapture(e.pointerId); } catch (x) { }
    if (!d.moved) return;   // a plain click: handled below
    N.justDragged = true; setTimeout(function () { N.justDragged = false; }, 0);
    const p = pt(e); let hit = null; Object.keys(N.nodes).forEach(function (k) { const n = N.nodes[k]; if (Math.abs(n.x - p.x) < 52 && Math.abs(n.y - p.y) < 46) hit = k; });
    if (hit && hit !== d.id) connect(d.id, hit);
  });
  svg.addEventListener('click', function (e) {
    if (api.st.locked || N.busy || N.justDragged) return;
    const ln = e.target.closest ? e.target.closest('.nw-link') : null, id = nodeAt(e);
    if (N.tool === 'cut') { if (ln) { const l = N.links.splice(+ln.dataset.i, 1)[0]; L.sfx('slice'); log('Cable removed: <b>' + name(l.a) + '</b> ✂ <b>' + name(l.b) + '</b>'); draw(); api.check({ t: 'cut', a: l.a, b: l.b }); } return; }
    if (!id) { N.sel = null; draw(); return; }
    if (N.tool === 'ip') { ipDialog(id); return; }
    if (N.tool === 'info') { log('<b>' + name(id) + '</b>: ' + INFO[N.nodes[id].type]); bubble(id, KIND[N.nodes[id].type].toUpperCase(), 1400); api.check({ t: 'info', id: id }); return; }
    if (!N.sel) { N.sel = id; L.sfx('clink'); draw(); return; }
    if (N.sel === id) { N.sel = null; draw(); return; }
    const a = N.sel; if (N.tool === 'send') send(a, id); else connect(a, id);
  });
  body.querySelectorAll('.nw-tool').forEach(function (b) { b.addEventListener('click', function () { b.blur(); setTool(b.dataset.tool); }); });

  api.onStep = function () { N.hint = false; body.querySelectorAll('.nw-tool').forEach(function (b) { b.classList.remove('glow'); }); draw(); setTimeout(function () { api.check({ t: 'step' }); }, 60); };
  api.onTip = function (s) { N.hint = true; if (s.tool && N.tool !== s.tool) { const b = body.querySelector('[data-tool="' + s.tool + '"]'); if (b) b.classList.add('glow'); } draw(); };
  api.net = { linked: function (a, b) { const l = linkOf(a, b); return !!l && !l.broken; }, path: path, broken: function () { return N.links.some(function (l) { return l.broken; }); }, nodes: N.nodes, N: N, send: send, connect: connect, setTool: setTool, ip: function (id) { return N.nodes[id].ip; }, setIp: setIp, okIp: function (id) { const v = N.nodes[id].ip; return !!v && v.indexOf(NETPART + '.') === 0; } };
  draw(); log('Tools: <b>Cable</b> joins two devices. <b>Send</b> sends a message. <b>Cut</b> removes a cable.');
}

/* ---------- the levels ---------- */
const drag = function (a, b) { return ['Choose the 🔌 Cable tool.', 'Press on ' + a + ' and hold the button down.', 'Drag the yellow line to ' + b + ', then let go.']; };
const sendTip = function (a, b) { return ['Click the ✉️ Send tool.', 'Click ' + a + '. It turns yellow.', 'Then click ' + b + ' and watch the message travel.']; };
const link = function (a, b) { return function (ev, api) { return api.net.linked(a, b); }; };
const sent = function (a, b) { return function (ev) { return ev.t === 'sent' && ev.from === a && ev.to === b; }; };
const web = function (a) { return function (ev) { return ev.t === 'web' && ev.from === a; }; };
/* ---------- the lessons (shown before each level): small diagrams drawn with the same devices ---------- */
function dia(nodes, links, extra) {
  const P = {}; nodes.forEach(function (n) { P[n[0]] = n; });
  return '<svg viewBox="0 0 420 270" xmlns="' + NS + '"><rect width="420" height="270" rx="16" fill="#0f1030"/>' + (links || []).map(function (l) { const A = P[l[0]], B = P[l[1]]; return '<line class="nw-link' + (l[2] === 'wifi' ? ' wifi' : l[2] === 'hot' ? ' hot' : '') + '" x1="' + A[3] + '" y1="' + A[4] + '" x2="' + B[3] + '" y2="' + B[4] + '"/>'; }).join('') +
    nodes.map(function (n) { return nodeSvg({ id: n[0], type: n[1], name: n[2], x: n[3], y: n[4], ip: n[5] || '' }, !!n[5]).replace('class="nw-node"', 'class="nw-node" style="cursor:default"'); }).join('') + (extra || '') + '</svg>';
}
const slide = function (h, p, art) { return { h: h, p: p, art: art }; };
const TEACH = {
  two: [slide('What is a network?', ['A network is two or more computers joined together.', 'Joined computers can send messages and share things.', 'Your school computers are on a network.'], dia([['a', 'pc', 'PC 1', 80, 80], ['b', 'pc', 'PC 2', 80, 190], ['c', 'pc', 'PC 3', 340, 135], ['s', 'sw', 'Switch', 210, 135]], [['a', 's'], ['b', 's'], ['c', 's']])),
    slide('What is a switch?', ['A switch is a box with many sockets.', 'Each computer plugs into it with a cable.', 'It reads who a message is for and sends it down the right cable.'], dia([['a', 'pc', 'PC 1', 70, 135], ['s', 'sw', 'Switch', 210, 135], ['b', 'pc', 'PC 2', 350, 135]], [['a', 's', 'hot'], ['s', 'b', 'hot']], '<text x="140" y="118" font-size="24">✉️</text>')),
    slide('Your tools', ['🔌 Cable: drag from one device to another to join them.', '✉️ Send: click the sender, then the receiver.', '✂️ Cut removes a cable. ❓ tells you what a device is.'], '<div class="ls-row"><div class="ls-card"><span class="ic">🔌</span>Cable</div><div class="ls-card"><span class="ic">✉️</span>Send</div><div class="ls-card"><span class="ic">✂️</span>Cut</div><div class="ls-card"><span class="ic">❓</span>What is it?</div></div>')],
  printer: [slide('Why share a printer?', ['One printer can serve every computer on the network.', 'The computers send their pages through the switch.', 'That saves money and space.'], dia([['a', 'pc', 'PC 1', 70, 70], ['b', 'pc', 'PC 2', 70, 200], ['s', 'sw', 'Switch', 210, 135], ['p', 'printer', 'Printer', 350, 135]], [['a', 's'], ['b', 's'], ['s', 'p']]))],
  internet: [slide('What is the internet?', ['The internet is millions of networks joined together.', 'It reaches all over the world.', 'Websites live on computers far away.'], dia([['n', 'net', 'Internet', 210, 110]], [], '<text x="210" y="225" text-anchor="middle" font-size="40">🌍</text>')),
    slide('What is a router?', ['A router is the door between your network and the internet.', 'It passes messages out, and brings the answers back in.', 'A switch joins computers. A router joins networks.'], dia([['a', 'pc', 'PC 1', 60, 135], ['s', 'sw', 'Switch', 160, 135], ['r', 'router', 'Router', 260, 135], ['n', 'net', 'Internet', 360, 135]], [['a', 's'], ['s', 'r'], ['r', 'n', 'hot']])),
    slide('How a web page reaches you', ['Your computer asks for the page.', 'The request goes: switch, router, internet.', 'The page comes back the same way.'], dia([['a', 'pc', 'PC 1', 60, 135], ['s', 'sw', 'Switch', 160, 135], ['r', 'router', 'Router', 260, 135], ['n', 'net', 'Internet', 360, 135]], [['a', 's', 'hot'], ['s', 'r', 'hot'], ['r', 'n', 'hot']], '<text x="200" y="118" font-size="24">🌐</text>'))],
  ip: [slide('Every device needs an address', ['An IP address is like a house address.', 'It tells the network where to deliver a message.', 'With no address, a computer cannot send or receive.'], dia([['a', 'pc', 'PC 1', 80, 80, '192.168.1.2'], ['b', 'pc', 'PC 2', 80, 190, '192.168.1.3'], ['r', 'router', 'Router', 320, 135, '192.168.1.1'], ['s', 'sw', 'Switch', 200, 135]], [['a', 's'], ['b', 's'], ['s', 'r']])),
    slide('An IP address has two parts', ['The NETWORK part is the street. Every device here shares it.', 'The HOST part is the house number. Every device has its own.'], '<div class="ls-ip"><span class="net">192.168.1<small>NETWORK part: which network</small></span><b>.</b><span class="host">7<small>HOST part: which device</small></span></div>'),
    slide('The rules', ['Same network part as the router: 192.168.1', 'A host number from 2 to 254 that nobody else uses.', 'Number 1 is the router. It is the way out to the internet.'], dia([['a', 'pc', 'PC 3', 90, 135], ['s', 'sw', 'Switch', 210, 135], ['r', 'router', 'Router', 330, 135, '192.168.1.1']], [['a', 's'], ['s', 'r']], '<text x="90" y="205" text-anchor="middle" font-size="11" font-weight="bold" fill="#ff9aa8" font-family="monospace">no IP address</text>')),
    slide('Your job', ['One computer has no address. Give it one.', 'One computer is on the wrong network. Fix it.', 'Use the 🏷️ IP address tool, then click the computer.'], '<div class="ls-row"><div class="ls-card hot"><span class="ic">🏷️</span>IP address</div></div>')],
  wifi: [slide('What is Wi-Fi?', ['Wi-Fi joins devices through the air, with no cable.', 'It uses radio waves, like a radio.', 'Wi-Fi comes from the router.'], dia([['l', 'laptop', 'Laptop', 90, 80], ['t', 'tablet', 'Tablet', 90, 200], ['r', 'router', 'Router', 300, 135]], [['l', 'r', 'wifi'], ['t', 'r', 'wifi']])),
    slide('Cables and Wi-Fi work together', ['Desktop computers and printers usually use cables.', 'Laptops, tablets and phones usually use Wi-Fi.', 'They are all on the same network.'], dia([['a', 'pc', 'PC 1', 60, 80], ['s', 'sw', 'Switch', 170, 135], ['r', 'router', 'Router', 290, 135], ['l', 'laptop', 'Laptop', 360, 220]], [['a', 's'], ['s', 'r'], ['l', 'r', 'wifi']]))],
  fix: [slide('When a network stops working', ['1. TEST it: try to send something.', '2. FIND the fault: look for a broken or missing cable.', '3. FIX it, then TEST again.'], dia([['a', 'pc', 'PC 1', 60, 135], ['s', 'sw', 'Switch', 180, 135], ['r', 'router', 'Router', 300, 135]], [['a', 's']], '<line class="nw-link bad" x1="180" y1="135" x2="300" y2="135"/><text x="240" y="125" text-anchor="middle" font-size="22">⚡</text>'))],
  own: [slide('Plan before you build', ['Computers and the printer: cable to the switch.', 'Switch to router, router to internet.', 'Laptop and tablet: Wi-Fi from the router.'], dia([['a', 'pc', 'PC', 60, 80], ['p', 'printer', 'Printer', 60, 200], ['s', 'sw', 'Switch', 170, 135], ['r', 'router', 'Router', 270, 135], ['n', 'net', 'Internet', 365, 80], ['l', 'laptop', 'Laptop', 365, 210]], [['a', 's'], ['p', 's'], ['s', 'r'], ['r', 'n'], ['l', 'r', 'wifi']]))]
};
const ipTip = function (who) { return ['Click the 🏷️ IP address tool.', 'Click ' + who + '.', 'Type a host number from 2 to 254 that no other device has, then Save.']; };
const IPLEVEL = { id: 'ip', title: 'IP addresses', icon: '🏷️', min: 4, ip: true, learned: 'An address has a network part (shared) and a host part (its own).', noip: ['pc3'], badip: { pc2: '10.0.0.5' }, fullIp: false,
  nodes: [['pc1', 'pc', 'PC 1', 110, 90], ['pc2', 'pc', 'PC 2', 110, 225], ['pc3', 'pc', 'PC 3', 110, 360], ['sw', 'sw', 'Switch', 320, 225], ['rt', 'router', 'Router', 520, 225], ['net', 'net', 'Internet', 700, 225]],
  links: [['pc1', 'sw'], ['pc2', 'sw'], ['pc3', 'sw'], ['sw', 'rt'], ['rt', 'net']],
  steps: [
    { say: 'PC 3 wants the internet. Try it: open a website from PC 3.', sub: 'Look at the words under PC 3', win: 'It failed. PC 3 has no IP address, so nothing can find it.', hint: ['pc3', 'net'], tool: 'send', tip: sendTip('PC 3', 'the Internet cloud'), ok: function (ev) { return ev.t === 'noip' && ev.id === 'pc3'; } },
    { say: 'Give PC 3 an IP address', sub: 'Use the 🏷️ IP address tool, then click PC 3', win: 'PC 3 has an address now!', hint: ['pc3'], tool: 'ip', tip: ipTip('PC 3'), ok: function (ev, api) { return api.net.okIp('pc3'); } },
    { say: 'Now open a website from PC 3', win: 'With an address, the page can find its way back.', wait: 2200, hint: ['pc3', 'net'], tool: 'send', tip: sendTip('PC 3', 'the Internet cloud'), ok: web('pc3') },
    { say: 'PC 2 cannot print or browse. Look at its address. What is wrong?', sub: 'Try to send a message from PC 2 to PC 1', win: 'Its network part is 10.0.0. It is on the wrong network.', hint: ['pc2', 'pc1'], tool: 'send', tip: sendTip('PC 2', 'PC 1'), ok: function (ev) { return ev.t === 'noip' && ev.id === 'pc2'; } },
    { say: 'Fix PC 2: give it an address on this network', sub: 'The network part must be 192.168.1', win: 'PC 2 is on the right network now.', hint: ['pc2'], tool: 'ip', tip: ipTip('PC 2'), ok: function (ev, api) { return api.net.okIp('pc2'); } },
    { say: 'Send a message from PC 2 to PC 3', win: 'Every computer has its own address. The network works!', wait: 2200, hint: ['pc2', 'pc3'], tool: 'send', tip: sendTip('PC 2', 'PC 3'), ok: sent('pc2', 'pc3') }] };
const LEVELS = [
  { id: 'two', title: 'Join two computers', icon: '🔌', min: 3, learned: 'A switch joins computers together so they can talk.',
    nodes: [['pc1', 'pc', 'PC 1', 150, 130], ['pc2', 'pc', 'PC 2', 150, 320], ['sw', 'sw', 'Switch', 450, 225]],
    steps: [
      { say: 'Connect PC 1 to the switch with a cable', sub: 'Drag from PC 1 to the switch', win: 'PC 1 is on the network!', hint: ['pc1', 'sw'], tool: 'cable', tip: drag('PC 1', 'the Switch'), ok: link('pc1', 'sw') },
      { say: 'Now connect PC 2 to the switch', win: 'Two computers, one network!', hint: ['pc2', 'sw'], tool: 'cable', tip: drag('PC 2', 'the Switch'), ok: link('pc2', 'sw') },
      { say: 'Send a message from PC 1 to PC 2', sub: 'Click ✉️ Send, then PC 1, then PC 2', win: 'The switch passed the message on!', wait: 2000, hint: ['pc1', 'pc2'], tool: 'send', tip: sendTip('PC 1', 'PC 2'), ok: sent('pc1', 'pc2') },
      { say: 'Now send a reply from PC 2 to PC 1', win: 'Messages go both ways!', wait: 2000, hint: ['pc2', 'pc1'], tool: 'send', tip: sendTip('PC 2', 'PC 1'), ok: sent('pc2', 'pc1') }] },
  { id: 'printer', title: 'Share a printer', icon: '🖨️', min: 3, learned: 'Every computer on the network can share one printer.',
    nodes: [['pc1', 'pc', 'PC 1', 140, 110], ['pc2', 'pc', 'PC 2', 140, 230], ['pc3', 'pc', 'PC 3', 140, 350], ['sw', 'sw', 'Switch', 420, 230], ['pr', 'printer', 'Printer', 670, 230]],
    links: [['pc1', 'sw'], ['pc2', 'sw']],
    steps: [
      { say: 'Connect the printer to the switch', win: 'The printer is on the network!', hint: ['pr', 'sw'], tool: 'cable', tip: drag('the Printer', 'the Switch'), ok: link('pr', 'sw') },
      { say: 'Print a page from PC 1', sub: 'Send from PC 1 to the printer', win: 'Printed from PC 1!', wait: 2000, hint: ['pc1', 'pr'], tool: 'send', tip: sendTip('PC 1', 'the Printer'), ok: sent('pc1', 'pr') },
      { say: 'PC 3 wants to print too. Connect it.', win: 'PC 3 has joined!', hint: ['pc3', 'sw'], tool: 'cable', tip: drag('PC 3', 'the Switch'), ok: link('pc3', 'sw') },
      { say: 'Print a page from PC 3', win: 'One printer, shared by everyone!', wait: 2000, hint: ['pc3', 'pr'], tool: 'send', tip: sendTip('PC 3', 'the Printer'), ok: sent('pc3', 'pr') }] },
  { id: 'internet', title: 'Get on the internet', icon: '🌐', min: 3, learned: 'The router joins your network to the internet.',
    nodes: [['pc1', 'pc', 'PC 1', 110, 130], ['pc2', 'pc', 'PC 2', 110, 320], ['sw', 'sw', 'Switch', 310, 225], ['rt', 'router', 'Router', 510, 225], ['net', 'net', 'Internet', 700, 225]],
    links: [['pc1', 'sw'], ['pc2', 'sw']],
    steps: [
      { say: 'Connect the switch to the router', win: 'The router is connected!', hint: ['sw', 'rt'], tool: 'cable', tip: drag('the Switch', 'the Router'), ok: link('sw', 'rt') },
      { say: 'Connect the router to the internet', win: 'Your network is online!', hint: ['rt', 'net'], tool: 'cable', tip: drag('the Router', 'the Internet cloud'), ok: link('rt', 'net') },
      { say: 'Open a website from PC 1', sub: 'Send from PC 1 to the internet', win: 'The website came all the way back!', wait: 2200, hint: ['pc1', 'net'], tool: 'send', tip: sendTip('PC 1', 'the Internet cloud'), ok: web('pc1') },
      { say: 'Click ❓ and then the router to learn what it does', win: 'A router joins networks together.', hint: ['rt'], tool: 'info', tip: ['Click the ❓ What is it? tool.', 'Click the Router.', 'Read what it says on the right.'], ok: function (ev) { return ev.t === 'info' && ev.id === 'rt'; } }] },
  { id: 'wifi', title: 'Wi-Fi', icon: '📶', min: 4, learned: 'Wi-Fi joins devices to the router through the air, with no cable.',
    nodes: [['pc1', 'pc', 'PC 1', 100, 225], ['sw', 'sw', 'Switch', 280, 225], ['rt', 'router', 'Router', 470, 225], ['net', 'net', 'Internet', 690, 225], ['lap', 'laptop', 'Laptop', 380, 70], ['tab', 'tablet', 'Tablet', 560, 380]],
    links: [['pc1', 'sw'], ['sw', 'rt'], ['rt', 'net']],
    steps: [
      { say: 'Join the laptop to the Wi-Fi', sub: 'Wi-Fi comes from the router', win: 'The laptop is on Wi-Fi!', hint: ['lap', 'rt'], tool: 'cable', tip: drag('the Laptop', 'the Router'), ok: link('lap', 'rt') },
      { say: 'Join the tablet to the Wi-Fi', win: 'The tablet is on Wi-Fi!', hint: ['tab', 'rt'], tool: 'cable', tip: drag('the Tablet', 'the Router'), ok: link('tab', 'rt') },
      { say: 'Send a message from the laptop to PC 1', win: 'Wi-Fi and cables work together!', wait: 2200, hint: ['lap', 'pc1'], tool: 'send', tip: sendTip('the Laptop', 'PC 1'), ok: sent('lap', 'pc1') },
      { say: 'Open a website on the tablet', win: 'Online with no cable!', wait: 2200, hint: ['tab', 'net'], tool: 'send', tip: sendTip('the Tablet', 'the Internet cloud'), ok: web('tab') }] },
  { id: 'fix', title: 'Fix the network', icon: '🛠️', min: 5, learned: 'To fix a network: test it, find the fault, mend it, test again.',
    nodes: [['pc1', 'pc', 'PC 1', 100, 120], ['pc2', 'pc', 'PC 2', 100, 330], ['sw', 'sw', 'Switch', 290, 225], ['rt', 'router', 'Router', 480, 225], ['net', 'net', 'Internet', 690, 225], ['pr', 'printer', 'Printer', 290, 390]],
    links: [['pc1', 'sw'], ['sw', 'rt', 'broken'], ['rt', 'net'], ['pr', 'sw']],
    steps: [
      { say: 'PC 1 cannot get online. Test it: open a website from PC 1.', win: 'It failed. Now you know there is a fault.', hint: ['pc1', 'net'], tool: 'send', tip: sendTip('PC 1', 'the Internet cloud'), ok: function (ev) { return (ev.t === 'fail' || ev.t === 'web') && ev.from === 'pc1'; } },
      { say: 'Find the broken cable and cut it out', sub: 'It is red, with a ⚡', win: 'The broken cable is gone.', hint: ['sw', 'rt'], tool: 'cut', tip: ['Click the ✂️ Cut tool.', 'Find the red cable between the Switch and the Router.', 'Click the red cable.'], ok: function (ev, api) { return !api.net.broken(); } },
      { say: 'Put a new cable between the switch and the router', win: 'A new cable!', hint: ['sw', 'rt'], tool: 'cable', tip: drag('the Switch', 'the Router'), ok: link('sw', 'rt') },
      { say: 'Test again: open a website from PC 1', win: 'Fixed! PC 1 is online.', wait: 2200, hint: ['pc1', 'net'], tool: 'send', tip: sendTip('PC 1', 'the Internet cloud'), ok: web('pc1') },
      { say: 'PC 2 has no cable at all. Get it online and open a website.', win: 'The whole network works!', wait: 2200, hint: ['pc2', 'sw'], tool: 'cable', tip: ['Use the 🔌 Cable tool: drag from PC 2 to the Switch.', 'Then use ✉️ Send: click PC 2, then the Internet cloud.'], ok: web('pc2') }] },
  { id: 'own', title: 'Build your own', icon: '🏗️', min: 5, learned: 'You designed and built a whole network!',
    nodes: [['pc1', 'pc', 'PC 1', 90, 90], ['pc2', 'pc', 'PC 2', 90, 225], ['pc3', 'pc', 'PC 3', 90, 360], ['pr', 'printer', 'Printer', 300, 380], ['sw', 'sw', 'Switch', 310, 190], ['rt', 'router', 'Router', 510, 190], ['net', 'net', 'Internet', 710, 190], ['lap', 'laptop', 'Laptop', 520, 380], ['tab', 'tablet', 'Tablet', 700, 380]],
    steps: [
      { say: 'Build the network: every device must be able to reach the internet', sub: 'Computers and the printer use cables. The laptop and tablet use Wi-Fi.', win: 'Everything is connected!', hint: ['sw', 'rt', 'net'], tool: 'cable',
        tip: ['Cable each PC and the printer to the Switch.', 'Cable the Switch to the Router, and the Router to the Internet.', 'Drag from the Laptop and the Tablet to the Router for Wi-Fi.'],
        ok: function (ev, api) { return Object.keys(api.net.nodes).every(function (k) { return k === 'net' || k === 'sw' || k === 'rt' || !!api.net.path(k, 'net'); }) && !!api.net.path('rt', 'net'); } },
      { say: 'Print a page from the laptop', win: 'Printed over Wi-Fi!', wait: 2200, hint: ['lap', 'pr'], tool: 'send', tip: sendTip('the Laptop', 'the Printer'), ok: sent('lap', 'pr') },
      { say: 'Send a message from the tablet to PC 3', win: 'Delivered!', wait: 2200, hint: ['tab', 'pc3'], tool: 'send', tip: sendTip('the Tablet', 'PC 3'), ok: sent('tab', 'pc3') },
      { say: 'Open a website from PC 2', win: 'You are a network engineer!', wait: 2200, hint: ['pc2', 'net'], tool: 'send', tip: sendTip('PC 2', 'the Internet cloud'), ok: web('pc2') }] }
];
LEVELS.splice(3, 0, IPLEVEL);
LEVELS.forEach(function (lv) { lv.teach = TEACH[lv.id]; lv.build = function (body, api, year) { build(body, api, year, lv); }; });

CC.modes.network = L.game({
  id: 'network', icon: '🌐', title: 'Network Builder', color: '#22c6c6', cert: { hero: 'Network Engineer', art: 'network', hue: 186 },
  sub: 'Join computers with a switch and a router, then watch your messages travel.',
  stage: function () { return document.getElementById('stage-network'); }, root: function () { return document.getElementById('network-root'); },
  levels: function (y) { return LEVELS.filter(function (l) { return y >= l.min; }); }
});
})();
