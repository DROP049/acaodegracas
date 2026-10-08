'use strict';
(() => {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const W = 960, H = 640, T = 22, $ = id => document.getElementById(id);
  const R = (x, y, w, h) => ({ x, y, w, h });
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const inflate = (r, n) => R(r.x - n, r.y - n, r.w + 2 * n, r.h + 2 * n);
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const shade = (c, a) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, v + a)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
  const lum = c => parseInt(c.slice(1, 3), 16);
  const FONT = '"Nunito","Segoe UI",sans-serif';

  /* ================= IMAGENS COM FALLBACK ================= */
  // Obrigatórias: player, peru, faca, tempero. Opcionais: travessa, utensilio.
  const IMG = {};
  for (const n of ['player', 'peru', 'faca', 'tempero', 'travessa', 'utensilio']) {
    const o = IMG[n] = { img: new Image(), ok: false };
    o.img.onload = () => { o.ok = o.img.naturalWidth > 0; refreshHud(); };
    o.img.onerror = () => { o.ok = false; console.warn(`imagens/${n}.png não encontrada: usando fallback.`); };
    o.img.src = `imagens/${n}.png`;
  }
  const rp = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const circ = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const FB = {
    player: (x, y, w, h) => {                     // quadrado azul com rostinho
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6aa5ff'); g.addColorStop(1, '#2a5fd6');
      ctx.fillStyle = g; rp(x, y, w, h, w * .28); ctx.fill(); ctx.strokeStyle = '#13306e'; ctx.lineWidth = 2; ctx.stroke();
      for (const e of [.3, .7]) { circ(x + w * e, y + h * .4, w * .12, '#fff'); circ(x + w * (e + .03), y + h * .42, w * .06, '#13306e'); }
      ctx.strokeStyle = '#13306e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w / 2, y + h * .62, w * .14, .2, Math.PI - .2); ctx.stroke();
    },
    peru: (x, y, w, h) => {                       // círculo marrom com cauda em leque
      const cx = x + w / 2, cy = y + h / 2;
      ['#b8431f', '#e8741c', '#f1c40f', '#e8741c', '#b8431f'].forEach((c, i) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx - w * .36, cy + (i - 2) * h * .15, w * .24, h * .09, (i - 2) * .35, 0, 7); ctx.fill();
      });
      circ(cx, cy, w * .4, '#8a5428'); ctx.strokeStyle = '#3d2210'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#6b3f1d'; ctx.beginPath(); ctx.ellipse(cx - w * .05, cy + h * .05, w * .22, h * .15, -.3, 0, 7); ctx.fill();
      circ(cx + w * .3, cy - h * .2, w * .17, '#8a5428'); ctx.stroke();
      ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.moveTo(cx + w * .44, cy - h * .24); ctx.lineTo(cx + w * .58, cy - h * .17); ctx.lineTo(cx + w * .44, cy - h * .12); ctx.fill();
      circ(cx + w * .44, cy - h * .05, w * .06, '#c0392b'); circ(cx + w * .34, cy - h * .25, w * .045, '#fff'); circ(cx + w * .35, cy - h * .25, w * .022, '#222');
    },
    faca: (x, y, w, h) => {
      const g = ctx.createLinearGradient(0, y + h * .3, 0, y + h * .7); g.addColorStop(0, '#f2f6f8'); g.addColorStop(1, '#9aa8b2');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + w * .08, y + h * .62); ctx.lineTo(x + w * .2, y + h * .32); ctx.lineTo(x + w * .72, y + h * .38); ctx.lineTo(x + w * .72, y + h * .62); ctx.fill();
      ctx.strokeStyle = '#5b6770'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#6b3f1d'; rp(x + w * .72, y + h * .35, w * .26, h * .3, 4); ctx.fill();
    },
    tempero: (x, y, w, h, c) => {                 // potinho de tempero colorido
      ctx.fillStyle = c || '#e67e22'; rp(x + w * .15, y + h * .28, w * .7, h * .68, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,5,.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#8a5a2b'; rp(x + w * .2, y + h * .08, w * .6, h * .22, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + w * .25, y + h * .5, w * .5, h * .2);
    },
    travessa: (x, y, w, h) => {
      ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h * .38, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#78909c'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w * .32, h * .22, 0, 0, 7); ctx.stroke();
    },
    utensilio: (x, y, w, h) => {
      ctx.fillStyle = '#b08850'; rp(x + w * .43, y + h * .3, w * .14, h * .68, 3); ctx.fill();
      ctx.fillStyle = '#d7b27a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * .26, w * .27, h * .22, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  };
  function sprite(n, x, y, w, h, flip, c) {
    ctx.save();
    if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); x = 0; y = 0; }
    IMG[n].ok ? ctx.drawImage(IMG[n].img, x, y, w, h) : FB[n](x, y, w, h, c);
    ctx.restore();
  }

  /* ================= ITENS ================= */
  const I = (sp, e, n, c) => ({ sp, e, n, c });
  const ITEMS = {
    faca: I('faca', '🔪', 'Faca'), travessa: I('travessa', '🍽️', 'Travessa'),
    sal: I('tempero', '🧂', 'Sal', '#ecf0f1'), pimenta: I('tempero', '🧂', 'Pimenta', '#3b3b3b'),
    alecrim: I('tempero', '🌿', 'Alecrim', '#4f9d4a'), tomilho: I('tempero', '🌿', 'Tomilho', '#a5d66b'), salvia: I('tempero', '🌿', 'Sálvia', '#9fb8a8'),
    concha: I('utensilio', '🥄', 'Concha'), rolo: I('utensilio', '🥖', 'Rolo de massa'),
    batedor: I('utensilio', '🥢', 'Batedor'), luva: I('utensilio', '🧤', 'Luvas de forno')
  };
  const TEMP = ['sal', 'pimenta', 'alecrim', 'tomilho', 'salvia'], UTE = ['concha', 'rolo', 'batedor', 'luva'];

  /* ================= CÔMODOS (tela cheia) ================= */
  // ex: saídas { s: lado, a..b: vão, to: destino, k: id da porta }. TODA porta nasce trancada e só abre com quiz.
  // As duas faces de uma mesma porta compartilham o mesmo id (abriu de um lado, abriu dos dois).
  // f: móveis [tipo, x, y, w, h, cor, rótulo, [idDoLocal, texto, itemQueDá]]   p: itens soltos [item, x, y]
  const ROOMS = {
    quintal: { n: 'Quintal', fl: 'grass', c: ['#6c9a45', '#86b058'], w: ['#9a6a3a', '#4a2e14', 1],
      ex: [{ s: 'E', a: 250, b: 390, to: 'cozinha', k: 'qc' }],
      f: [['tree', 90, 100, 64, 64], ['tree', 170, 450, 64, 64], ['tree', 690, 60, 64, 64], ['pond', 360, 330, 180, 100],
          ['box', 770, 470, 130, 70, '#8a6a3a', 'LENHA'],
          ['bush', 540, 110, 96, 56, '#3f8a37', '', ['arbusto', 'Procurar no arbusto', 'alecrim']]] },
    cozinha: { n: 'Cozinha', fl: 'tile', c: ['#efe0c3', '#d8c19a'], w: ['#8b5e3c', '#3b2412'],
      ex: [{ s: 'W', a: 250, b: 390, to: 'quintal', k: 'qc' }, { s: 'E', a: 250, b: 390, to: 'corredor', k: 'cc' },
           { s: 'N', a: 600, b: 700, to: 'despensa', k: 'cd' }],
      f: [['box', 90, 22, 230, 66, '#b88a5a', 'BALCÃO', ['balcao', 'Preparar o peru']],
          ['forno', 340, 22, 90, 86, '#4a4a52', 'FORNO', ['forno', 'Assar o peru']],
          ['box', 450, 22, 80, 106, '#d6dde0', 'GELADEIRA'],
          ['box', 730, 22, 170, 66, '#a0724a', 'GAVETAS', ['gaveta', 'Abrir a gaveta', 'pimenta']],
          ['box', 330, 300, 290, 76, '#8a5a2b', 'ILHA']] },
    despensa: { n: 'Despensa', fl: 'wood', c: ['#5a3d28', '#3a2515'], w: ['#6a4a34', '#2a1a0e'],
      ex: [{ s: 'S', a: 420, b: 540, to: 'cozinha', k: 'cd' }],
      f: [['box', 60, 22, 840, 64, '#7a5232', 'PRATELEIRAS'],
          ['box', 100, 300, 90, 80, '#9a7444', 'CAIXOTE', ['caixote', 'Vasculhar o caixote', 'concha']],
          ['box', 760, 250, 100, 100, '#7a5a3a', 'BARRIL'], ['box', 440, 230, 90, 70, '#a58650', 'SACOS']],
      p: [['faca', 240, 170], ['sal', 680, 160]] },
    corredor: { n: 'Corredor', fl: 'wood', c: ['#b07040', '#8c542b'], w: ['#7a4e3a', '#3b2214'],
      ex: [{ s: 'W', a: 250, b: 390, to: 'cozinha', k: 'cc' }, { s: 'E', a: 250, b: 390, to: 'jantar', k: 'cj' },
           { s: 'N', a: 420, b: 540, to: 'sotao', k: 'cs' }, { s: 'S', a: 420, b: 540, to: 'estar', k: 'ce' }],
      f: [['rug', 140, 250, 680, 140, '#8a3340'],
          ['box', 70, 60, 60, 70, '#c0805a', 'VASO', ['vaso', 'Olhar dentro do vaso', 'rolo']],
          ['box', 830, 60, 60, 110, '#6b4a2b', 'RELÓGIO'], ['box', 150, 500, 130, 50, '#7a5232', 'BANCO'], ['box', 680, 500, 130, 50, '#7a5232', 'BANCO']] },
    jantar: { n: 'Sala de Jantar', fl: 'wood', c: ['#b9794a', '#94602f'], w: ['#8a4a50', '#3f1a22'],
      ex: [{ s: 'W', a: 250, b: 390, to: 'corredor', k: 'cj' }],
      f: [['rug', 210, 150, 560, 340, '#8e2f3a'], ['mesa', 300, 200, 420, 230, '#f6ecd4', 'MESA', ['mesa', 'Servir o peru']],
          ['box', 760, 22, 170, 60, '#7a5232', 'APARADOR', ['aparador', 'Revirar o aparador', 'luva']],
          ['box', 60, 500, 70, 90, '#8a6a46', 'CRISTALEIRA']] },
    estar: { n: 'Sala de Estar', fl: 'wood', c: ['#996238', '#76492a'], w: ['#5e6f55', '#2c3827'],
      ex: [{ s: 'N', a: 420, b: 540, to: 'corredor', k: 'ce' }],
      f: [['rug', 250, 220, 460, 280, '#476a73'],
          ['box', 640, 22, 200, 70, '#6a5648', 'LAREIRA', ['lareira', 'Mexer nas cinzas']],
          ['box', 300, 440, 360, 80, '#a44e3c', 'SOFÁ', ['sofa', 'Olhar entre as almofadas', 'tomilho']],
          ['box', 60, 200, 80, 200, '#7a5232', 'ESTANTE'],
          ['box', 790, 420, 110, 120, '#8a6a46', 'BAÚ', ['bau', 'Abrir o baú de brinquedos', 'batedor']]] },
    sotao: { n: 'Sótão', fl: 'wood', c: ['#4a3426', '#2f2017'], w: ['#5a4634', '#1d130b'], dark: 1,
      ex: [{ s: 'S', a: 420, b: 540, to: 'corredor', k: 'cs' }],
      f: [['box', 100, 100, 130, 80, '#7a5232', 'BAÚ ANTIGO', ['bau_s', 'Abrir o baú antigo', 'travessa']],
          ['box', 700, 120, 100, 100, '#8a6a46', 'CAIXA', ['caixa', 'Vasculhar a caixa', 'salvia']],
          ['box', 380, 260, 170, 60, '#6a5a4a', 'MALAS'],
          ['box', 720, 430, 120, 70, '#9a8a7a', 'MANEQUIM', ['manequim', 'Só teias de aranha…']]] }
  };
  const gapRect = e => e.s === 'N' ? R(e.a, 0, e.b - e.a, T) : e.s === 'S' ? R(e.a, H - T, e.b - e.a, T)
    : e.s === 'W' ? R(0, e.a, T, e.b - e.a) : R(W - T, e.a, T, e.b - e.a);
  function borders(ex) {
    const o = [];
    for (const s of 'NSWE') {
      const gs = ex.filter(e => e.s === s).sort((p, q) => p.a - q.a), len = (s === 'N' || s === 'S') ? W : H;
      let c = 0;
      for (const g of [...gs, { a: len, b: len }]) {
        if (g.a > c) { const l = g.a - c; o.push(s === 'N' ? R(c, 0, l, T) : s === 'S' ? R(c, H - T, l, T) : s === 'W' ? R(0, c, T, l) : R(W - T, c, T, l)); }
        c = g.b;
      }
    }
    return o;
  }
  for (const id in ROOMS) {
    const r = ROOMS[id]; r.id = id; r.p = r.p || [];
    r.ex.forEach(e => e.g = gapRect(e));
    r.F = r.f.map(a => ({ k: a[0], x: a[1], y: a[2], w: a[3], h: a[4], c: a[5], l: a[6], s: a[7] }));
    r.wl = borders(r.ex);
    r.sol = [...r.wl, ...r.F.filter(f => f.k !== 'rug')];
    r.sp = r.F.filter(f => f.s).map(f => ({ id: f.s[0], txt: f.s[1], give: f.s[2], at: f, r: inflate(f, 28) }));
  }
  const QG = ROOMS.quintal;
  QG.psol = QG.sol.concat(QG.ex.map(e => e.g));   // o peru não escapa do quintal

  /* ================= ESTADO ================= */
  const player = { x: 80, y: 300, w: 26, h: 26, vx: 0, vy: 0, face: 1 };
  const peru = { x: 0, y: 0, w: 36, h: 36, vx: 0, vy: 0, t: 0, spd: 0, ang: 0, flee: false };
  let state = 'title';          // title | play | quiz | timed | win
  let st, room = QG, tm = 0, cool = 0, muted = false, parts = [], toastT, AC, trans = null, A = null, lastDoor = null;
  const down = new Set();
  const nT = () => TEMP.filter(k => st.inv[k]).length;

  function reset() {
    st = { stage: 'selvagem', inv: {}, found: new Set(), done: {}, open: {}, time: 0 }; // selvagem > cru > temperado > assado
    room = QG; trans = null; A = null; parts = [];
    Object.assign(player, { x: 80, y: 300, vx: 0, vy: 0, face: 1 });
    const sp = [[600, 480], [250, 180], [640, 250]][Math.random() * 3 | 0];
    Object.assign(peru, { x: sp[0], y: sp[1], vx: 0, vy: 0, t: 0, spd: 0, ang: 0, flee: false });
    refreshHud(); showRoom(room.n);
  }

  /* ================= ÁUDIO ================= */
  function beep(f, d = .12, type = 'square', v = .05) {
    if (muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
    } catch (e) { /* sem áudio */ }
  }
  const jingle = n => n.forEach((f, i) => setTimeout(() => beep(f, .16, 'triangle', .07), i * 110));

  /* ================= HUD (barras fora do canvas) ================= */
  const DEF = 'WASD ou setas: andar  ·  E ou Espaço: interagir  ·  M: som';
  const SLOTS = [['peru', 'peru', '🦃'], ['faca', 'faca', '🔪'], ['travessa', 'travessa', '🍽️'], ['temp', 'tempero', '🧂'], ['ute', 'utensilio', '🥄']];
  SLOTS.forEach(([id]) => {
    const d = document.createElement('div'); d.className = 'slot'; d.id = 's-' + id;
    d.innerHTML = '<div class="ico"></div><small></small>'; $('slots').appendChild(d);
  });
  $('msg').textContent = DEF;
  function objective() {
    const s = st.stage, v = st.inv, o = st.open;
    if (s === 'selvagem') return 'Capture o <em>peru</em> no Quintal. Toda porta da casa só abre com um <em>quiz</em>!';
    if (s === 'assado') return 'Sirva o peru na <em>mesa</em> da Sala de Jantar.';
    if (s === 'temperado') return v.travessa ? 'Asse o peru no <em>forno</em> da Cozinha.' : 'Ache uma <em>travessa</em> para o forno. Talvez bem no alto da casa...';
    if (!o.qc) return 'Acerte o quiz da porta do Quintal para <em>entrar na casa</em>.';
    if (!v.faca && !o.cd) return 'Abra a <em>Despensa</em> (porta no alto da Cozinha) com um quiz.';
    const miss = []; if (!v.faca) miss.push('a <em>faca</em>'); if (nT() < 3) miss.push(`mais <em>${3 - nT()} tempero(s)</em>`);
    if (miss.length) return 'Explore os cômodos e ache ' + miss.join(' e ') + '. Cada porta pede um quiz.';
    return 'Prepare o peru no <em>balcão</em> da Cozinha.';
  }
  function refreshHud() {
    if (!st) return;
    const n = nT(), u = UTE.filter(k => st.found.has(k)).length, done = st.stage === 'temperado' || st.stage === 'assado';
    const v = {
      peru: [st.stage !== 'selvagem', { selvagem: 'Peru', cru: 'Cru', temperado: 'Temperado', assado: 'Assado!' }[st.stage]],
      faca: [st.inv.faca, 'Faca'], travessa: [st.inv.travessa, 'Travessa'],
      temp: [n > 0 || done, done ? 'Usados' : n + '/3'], ute: [u > 0, u + '/' + UTE.length]
    };
    SLOTS.forEach(([id, img, em]) => {
      const el = $('s-' + id);
      el.classList.toggle('have', !!v[id][0]);
      el.querySelector('.ico').innerHTML = IMG[img].ok ? `<img src="${IMG[img].img.src}" alt="">` : em;
      el.querySelector('small').textContent = v[id][1];
    });
    $('objective').innerHTML = '<b>OBJETIVO</b>' + objective();
  }
  function toast(m) {
    const el = $('msg'); el.textContent = m; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    clearTimeout(toastT); toastT = setTimeout(() => { el.textContent = DEF; el.classList.remove('flash'); }, 4000);
  }
  function showRoom(n) {
    const el = $('room'); el.textContent = '📍 ' + n; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  /* ================= PARTÍCULAS ================= */
  function burst(x, y, n, cols, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = (o.v || 120) * (.3 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), life: 0,
        max: (o.life || .8) * (.6 + Math.random() * .6), c: cols[i % cols.length], s: o.s || 4, g: o.g ?? 300 });
    }
  }

  /* ================= FÍSICA AABB ================= */
  function move(e, dx, dy, list) {
    let blocked = false;
    e.x += dx;
    if (dx) for (const s of list) if (hit(e, s)) { e.x = dx > 0 ? s.x - e.w : s.x + s.w; blocked = true; }
    e.y += dy;
    if (dy) for (const s of list) if (hit(e, s)) { e.y = dy > 0 ? s.y - e.h : s.y + s.h; blocked = true; }
    return blocked;
  }
  const solids = () => room.sol.concat(room.ex.filter(e => !st.open[e.k]).map(e => e.g));   // portas trancadas são paredes
  function nudge(e) {
    const g = e.g;
    if (e.s === 'N') player.y = g.y + g.h + 16; else if (e.s === 'S') player.y = g.y - player.h - 16;
    else if (e.s === 'W') player.x = g.x + g.w + 16; else player.x = g.x - player.w - 16;
  }

  /* ================= TRANSIÇÃO ENTRE CÔMODOS ================= */
  function go(to) { trans = { a: 0, out: true, to, from: room.id }; player.vx = player.vy = 0; beep(330, .08, 'triangle', .04); }
  function enter(id, from) {
    room = ROOMS[id]; parts = [];
    const e = room.ex.find(x => x.to === from);
    if (e) {
      const g = e.g, m = 10;
      if (e.s === 'N') { player.x = g.x + g.w / 2 - 13; player.y = T + m; }
      else if (e.s === 'S') { player.x = g.x + g.w / 2 - 13; player.y = H - T - m - 26; }
      else if (e.s === 'W') { player.x = T + m; player.y = g.y + g.h / 2 - 13; }
      else { player.x = W - T - m - 26; player.y = g.y + g.h / 2 - 13; }
    }
    showRoom(room.n);
  }

  /* ================= QUIZ (uma pergunta por porta) ================= */
  const QUIZ = [
    { q: 'Em qual mês os Estados Unidos celebram o Dia de Ação de Graças?', a: ['Novembro', 'Outubro', 'Dezembro', 'Setembro'] },
    { q: 'Qual é o prato principal da ceia tradicional?', a: ['Peru assado', 'Pizza', 'Lasanha', 'Peixe frito'] },
    { q: 'Qual navio trouxe os peregrinos à América em 1620?', a: ['Mayflower', 'Santa Maria', 'Titanic', 'Endeavour'] },
    { q: 'Qual povo nativo dividiu o famoso banquete com os colonos?', a: ['Wampanoag', 'Astecas', 'Vikings', 'Maias'] },
    { q: 'Em que dia da semana cai o Thanksgiving nos EUA?', a: ['Quinta-feira', 'Segunda-feira', 'Sexta-feira', 'Domingo'] },
    { q: 'Qual presidente declarou o feriado nacional em 1863?', a: ['Abraham Lincoln', 'George Washington', 'Theodore Roosevelt', 'John Kennedy'] },
    { q: 'Qual torta é a sobremesa clássica da data?', a: ['Torta de abóbora', 'Torta de limão', 'Torta de frango', 'Torta holandesa'] },
    { q: 'Como se chama o dia seguinte ao Thanksgiving, famoso pelas compras?', a: ['Black Friday', 'Cyber Monday', 'Boxing Day', 'Halloween'] },
    { q: 'Qual desfile famoso acontece em Nova York no feriado?', a: ['Desfile da Macy\'s', 'Rose Parade', 'Mardi Gras', 'Carnaval do Rio'] },
    { q: 'Qual fruta vermelha vira o molho clássico servido com o peru?', a: ['Cranberry (oxicoco)', 'Morango', 'Cereja', 'Framboesa'] },
    { q: 'Qual outro país tem o seu Dia de Ação de Graças em outubro?', a: ['Canadá', 'Japão', 'Egito', 'Austrália'] },
    { q: 'O que as famílias costumam fazer à mesa, antes de comer?', a: ['Agradecer pelas coisas boas', 'Trocar presentes', 'Soltar fogos', 'Cantar parabéns'] }
  ];
  let deck = [], qLock = false, qCur = [];
  const drawQ = () => { if (!deck.length) deck = QUIZ.map((_, i) => i).sort(() => Math.random() - .5); return deck.pop(); };  // sem repetir até acabar o baralho

  function openQuiz(e) {
    state = 'quiz'; lastDoor = e; player.vx = player.vy = 0; qLock = false;
    $('q-title').textContent = '🔒 Porta para: ' + ROOMS[e.to].n;
    $('quiz').classList.remove('hidden'); nextQ(); beep(300, .2, 'sawtooth', .04);
  }
  function nextQ() {
    const Q = QUIZ[drawQ()];
    qCur = Q.a.map((t, k) => ({ t, ok: k === 0 })).sort(() => Math.random() - .5);
    $('q-text').textContent = Q.q; $('q-fb').textContent = '';
    const box = $('q-opts'); box.innerHTML = '';
    qCur.forEach((o, k) => {
      const b = document.createElement('button');
      b.className = 'opt'; b.innerHTML = `<kbd>${k + 1}</kbd>${o.t}`; b.onclick = () => answer(k); box.appendChild(b);
    });
  }
  function answer(k) {
    if (qLock || !qCur[k]) return;
    qLock = true;
    const btns = $('q-opts').children, ok = qCur[k].ok;
    btns[k].classList.add(ok ? 'ok' : 'bad');
    if (!ok) btns[qCur.findIndex(o => o.ok)].classList.add('ok');
    $('q-fb').textContent = ok ? '✔ Correto! A porta destrancou!' : '✘ Errou! Vamos tentar outra pergunta…';
    ok ? jingle([523, 659, 784]) : beep(160, .3, 'sawtooth', .06);
    setTimeout(() => { if (ok) { closeQuiz(); unlock(); } else { qLock = false; nextQ(); } }, ok ? 1000 : 1500);
  }
  function closeQuiz() {
    if (state !== 'quiz') return;
    state = 'play'; cool = 2.5; nudge(lastDoor); $('quiz').classList.add('hidden');
  }
  function unlock() {
    st.open[lastDoor.k] = true;                       // abre as duas faces da porta
    const g = lastDoor.g; burst(g.x + g.w / 2, g.y + g.h / 2, 30, ['#ffd54a', '#fff', '#ffb347'], { v: 150, life: 1 });
    toast(`Porta aberta! Agora dá para ir para: ${ROOMS[lastDoor.to].n} 🔓`); refreshHud();
  }

  /* ================= AÇÕES ================= */
  function act(label, dur, fn, id) {
    state = 'timed'; player.vx = player.vy = 0; A = { label, dur, t: 0, fn, id }; beep(220, .25, 'sawtooth', .04);
  }
  function interact() {
    const s = room.sp.find(s => !st.done[s.id] && hit(player, s.r)); if (!s) return;
    const v = st.inv;
    if (s.id === 'balcao') {
      if (st.stage === 'selvagem') return toast('Você ainda não pegou o peru! 🦃');
      if (st.stage !== 'cru') return toast('O peru já foi preparado.');
      if (!v.faca) return toast('Falta uma faca para preparar o peru 🔪');
      if (nT() < 3) return toast(`Faltam ${3 - nT()} tempero(s). Procure pela casa 🧂`);
      st.stage = 'temperado'; let k = 3; for (const t of TEMP) if (k && v[t]) { v[t] = false; k--; }
      burst(player.x, player.y, 26, ['#e67e22', '#f6c26b', '#c0392b', '#fff'], { v: 120, up: 60, life: .9 });
      jingle([440, 554, 659]); toast('Peru cortado e temperado! Agora leve-o ao forno 🔥'); refreshHud();
    } else if (s.id === 'forno') {
      if (st.stage !== 'temperado') return toast(st.stage === 'assado' ? 'O peru já está assado!' : 'Prepare o peru no balcão primeiro.');
      if (!v.travessa) return toast('Falta uma travessa para levar o peru ao forno 🍽️');
      act('🔥 Assando…', 4, () => {
        st.stage = 'assado'; jingle([659, 784, 988]);
        toast('Peru assado e douradinho! Leve-o à mesa da Sala de Jantar 🍽️'); refreshHud();
      }, 'forno');
    } else if (s.id === 'mesa') {
      if (st.stage !== 'assado') return toast('Traga o peru assado para a mesa!');
      win();
    } else {
      act('🔍 Procurando…', 1.1, () => {
        st.done[s.id] = true;
        if (s.give) {
          v[s.give] = true; st.found.add(s.give); const it = ITEMS[s.give];
          burst(s.at.x + s.at.w / 2, s.at.y + s.at.h / 2, 18, ['#ffd54a', '#fff', '#ffb347'], { v: 130, up: 60, life: .8 });
          jingle([660, 880]); toast(`Você achou: ${it.e} ${it.n}!`);
        } else toast('Só poeira e teias… nada aqui.');
        refreshHud();
      });
    }
  }
  function takeItem(k) {
    st.inv[k] = true; st.found.add(k);
    burst(player.x + 13, player.y + 13, 14, ['#ffd54a', '#fff'], { v: 100, life: .6 });
    beep(880, .12, 'triangle', .07); toast(`Você pegou: ${ITEMS[k].e} ${ITEMS[k].n}`); refreshHud();
  }
  function win() {
    state = 'win'; player.vx = player.vy = 0;
    burst(480, 310, 50, ['#ffd54a', '#e67e22', '#c0392b', '#fff'], { v: 220, up: 100, life: 1.4 });
    jingle([523, 659, 784, 1047, 784, 1047]);
    setTimeout(() => {
      $('win-time').textContent = fmt(st.time); $('win-items').textContent = st.found.size + '/' + Object.keys(ITEMS).length;
      $('screen-win').classList.remove('hidden');
    }, 1600);
  }
  function start() { $('screen-title').classList.add('hidden'); state = 'play'; beep(440, .1); toast('Capture o peru no quintal! 🦃'); }
  function restart() { $('screen-win').classList.add('hidden'); reset(); state = 'play'; toast('Nova ceia, novo peru!'); }

  /* ================= UPDATE ================= */
  function updatePlayer(dt) {
    const k = c => down.has(c);
    let ax = ((k('KeyD') || k('ArrowRight')) ? 1 : 0) - ((k('KeyA') || k('ArrowLeft')) ? 1 : 0);
    let ay = ((k('KeyS') || k('ArrowDown')) ? 1 : 0) - ((k('KeyW') || k('ArrowUp')) ? 1 : 0);
    if (ax && ay) { ax *= Math.SQRT1_2; ay *= Math.SQRT1_2; }
    const f = Math.min(1, dt * 16), SP = 185;
    player.vx += (ax * SP - player.vx) * f; player.vy += (ay * SP - player.vy) * f;
    if (!ax && Math.abs(player.vx) < 4) player.vx = 0;
    if (!ay && Math.abs(player.vy) < 4) player.vy = 0;
    if (ax) player.face = ax;
    move(player, player.vx * dt, player.vy * dt, solids());
    const cx = player.x + 13, cy = player.y + 13;           // cruzou a borda da tela por uma porta aberta
    const side = cx < 0 ? 'W' : cx > W ? 'E' : cy < 0 ? 'N' : cy > H ? 'S' : null;
    if (side) { const e = room.ex.find(e => e.s === side); if (e && st.open[e.k]) go(e.to); }
  }
  function updatePeru(dt) {
    if (st.stage !== 'selvagem') return;
    const dx = peru.x - player.x, dy = peru.y - player.y, d = Math.hypot(dx, dy);
    peru.t -= dt; peru.flee = d < 175;
    if (peru.t <= 0) {
      if (peru.flee) { peru.ang = Math.atan2(dy, dx) + (Math.random() - .5) * 1.4; peru.spd = d < 70 ? 175 : 160; peru.t = .15 + Math.random() * .2; }
      else { peru.spd = Math.random() < .4 ? 0 : 55 + Math.random() * 30; peru.ang = Math.random() * 6.283; peru.t = .5 + Math.random() * 1.1; }
    }
    peru.vx = Math.cos(peru.ang) * peru.spd; peru.vy = Math.sin(peru.ang) * peru.spd;
    if (move(peru, peru.vx * dt, peru.vy * dt, QG.psol)) {
      peru.ang = Math.random() * 6.283; peru.t = .25 + Math.random() * .25; if (peru.flee) peru.spd = 160;
    }
  }
  function checkEvents() {
    if (room === QG && st.stage === 'selvagem' && hit(inflate(player, 4), peru)) {
      st.stage = 'cru';
      burst(peru.x + 18, peru.y + 18, 28, ['#8a5a2b', '#c0392b', '#f2c27a', '#fff'], { v: 170, up: 80, life: 1 });
      jingle([392, 523, 659]); toast('Peru capturado! Agora acerte o quiz da porta para entrar na casa 🏠'); refreshHud();
    }
    for (const [k, x, y] of room.p) if (!st.found.has(k) && hit(player, R(x, y, 30, 30))) takeItem(k);
    if (cool <= 0) for (const e of room.ex) if (!st.open[e.k] && hit(player, inflate(e.g, 6))) { openQuiz(e); break; }   // encostou = quiz
  }
  function update(dt) {
    tm += dt; cool -= dt;
    if (trans) {
      trans.a += (trans.out ? 1 : -1) * dt * 5;
      if (trans.out && trans.a >= 1) { enter(trans.to, trans.from); trans.out = false; }
      else if (!trans.out && trans.a <= 0) trans = null;
    }
    if (room === QG && Math.random() < dt * 3)
      parts.push({ x: Math.random() * W, y: -4, vx: 20, vy: 35, life: 0, max: 7, g: 0, s: 5, c: ['#d9822b', '#b5451b', '#e0a030'][Math.random() * 3 | 0] });
    if (room !== QG && Math.random() < dt * 2)    // poeira dourada no ar
      parts.push({ x: Math.random() * W, y: Math.random() * H, vx: 4, vy: -6, life: 0, max: 5, g: 0, s: 2, c: '#ffe2a8' });
    if (state === 'play' || state === 'timed') { st.time += dt; $('timer').textContent = '⏱ ' + fmt(st.time); }
    if (state === 'play' && !trans) { updatePlayer(dt); if (room === QG) updatePeru(dt); checkEvents(); }
    else if (state === 'timed') {
      A.t += dt;
      const fo = room.F.find(f => f.k === 'forno');
      if (A.id === 'forno' && fo && Math.random() < dt * 16) burst(fo.x + 20 + Math.random() * 50, fo.y - 2, 1, ['#eee', '#bbb'], { v: 25, up: 30, g: -70, life: 1.1, s: 7 });
      if (A.t >= A.dur) { state = 'play'; A.fn(); }
    } else if (state === 'win' && Math.random() < .4)
      burst(Math.random() * W, -8, 1, ['#ffd54a', '#e67e22', '#c0392b', '#fff', '#2f6bff'], { v: 70, g: 160, life: 3.5, s: 6 });
    for (const p of parts) { p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter(p => p.life < p.max);
  }

  /* ================= CENÁRIOS PRÉ-RENDERIZADOS ================= */
  const bgs = {};
  function drawF(g, f) {
    const { k, x, y, w, h, c, l } = f;
    if (k === 'tree') {
      const cx = x + w / 2;
      g.fillStyle = 'rgba(20,40,10,.3)'; g.beginPath(); g.ellipse(cx, y + h, w * .7, 10, 0, 0, 7); g.fill();
      g.fillStyle = '#6b4226'; g.fillRect(cx - 7, y + h * .45, 14, h * .55);
      for (const [dx, dy, r, col] of [[0, .3, .75, '#c8661c'], [-.35, .45, .5, '#d9822b'], [.35, .45, .5, '#b5451b'], [0, .1, .45, '#e0a030']]) {
        g.fillStyle = col; g.beginPath(); g.arc(cx + dx * w, y + dy * h, r * w * .55, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(cx - 8, y + h * .15, w * .22, 0, 7); g.fill();
    } else if (k === 'pond') {
      g.fillStyle = '#7a5a3a'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 + 7, h / 2 + 7, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w / 2); gr.addColorStop(0, '#5aa0c4'); gr.addColorStop(1, '#2f6f94');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + w / 2 - 22, y + h / 2 - 8, 30, 9, 0, 0, 7); g.stroke();
      g.fillStyle = '#4a8a3a'; g.beginPath(); g.ellipse(x + w * .72, y + h * .62, 12, 7, .3, 0, 7); g.fill();
    } else if (k === 'bush') {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + w / 2, y + h, w / 2, 8, 0, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? c : '#2f6f2a'; g.beginPath(); g.arc(x + w * (.15 + .175 * i), y + h * .55, h * .55, 0, 7); g.fill(); }
      g.fillStyle = '#d93a2b'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x + 12 + i * 13, y + 18 + (i % 3) * 10, 3, 0, 7); g.fill(); }
    } else if (k === 'rug') {
      g.save(); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 3; g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill(); g.restore();
      g.strokeStyle = 'rgba(246,231,200,.7)'; g.lineWidth = 2;
      for (let i = 6; i < h - 4; i += 7) { g.beginPath(); g.moveTo(x - 7, y + i); g.lineTo(x, y + i); g.moveTo(x + w, y + i); g.lineTo(x + w + 7, y + i); g.stroke(); }
      g.strokeStyle = '#e0b256'; g.lineWidth = 4; g.beginPath(); g.roundRect(x + 9, y + 9, w - 18, h - 18, 9); g.stroke();
      g.strokeStyle = 'rgba(224,178,86,.5)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x + 20, y + 20, w - 40, h - 40, 6); g.stroke();
    } else if (k === 'mesa') {
      g.fillStyle = '#6b3f1d';
      for (let i = 0; i < 5; i++) { g.beginPath(); g.roundRect(x + 20 + i * 80, y, 50, 28, 6); g.fill(); g.beginPath(); g.roundRect(x + 20 + i * 80, y + h - 28, 50, 28, 6); g.fill(); }
      g.save(); g.shadowColor = 'rgba(20,10,4,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 7; g.fillStyle = c; g.beginPath(); g.roundRect(x, y + 24, w, h - 48, 10); g.fill(); g.restore();
      g.fillStyle = '#a8412c'; g.fillRect(x + 8, y + h / 2 - 14, w - 16, 28);           // caminho de mesa
      g.strokeStyle = '#c9a46a'; g.lineWidth = 3; g.beginPath(); g.roundRect(x, y + 24, w, h - 48, 10); g.stroke();
      for (let i = 0; i < 5; i++) for (const yy of [y + 46, y + h - 46]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 45 + i * 80, yy, 13, 0, 7); g.fill(); g.strokeStyle = '#cfc4a8'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#f3ead2'; g.beginPath(); g.arc(x + 45 + i * 80, yy, 7, 0, 7); g.fill(); }
      for (const xx of [x + 150, x + 270]) { g.fillStyle = '#e8741c'; g.beginPath(); g.arc(xx, y + h / 2, 13, 0, 7); g.fill(); g.fillStyle = '#4a7a2a'; g.fillRect(xx - 2, y + h / 2 - 17, 4, 6); }
      g.fillStyle = '#fff6dc'; g.fillRect(x + 205, y + h / 2 - 8, 6, 16); g.fillStyle = '#ffb347'; g.beginPath(); g.arc(x + 208, y + h / 2 - 11, 3.5, 0, 7); g.fill();
    } else {
      g.save(); g.shadowColor = 'rgba(20,10,4,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 7;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(c, 22)); gr.addColorStop(1, shade(c, -24));
      g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); g.restore();
      g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = 1;
      for (let i = 18; i < h - 4; i += 9) { g.beginPath(); g.moveTo(x + 5, y + i); g.lineTo(x + w - 5, y + i); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, Math.min(11, h - 4), 4); g.fill();
      if (k === 'forno') {
        g.fillStyle = '#101014'; g.beginPath(); g.roundRect(x + 12, y + 36, w - 24, 34, 5); g.fill();
        g.strokeStyle = '#9a9aa6'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#d8d8e0'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + 20 + i * 25, y + 24, 3.5, 0, 7); g.fill(); }
      }
      g.strokeStyle = shade(c, -65); g.lineWidth = 2; g.beginPath(); g.roundRect(x + 1, y + 1, w - 2, h - 2, 6); g.stroke();
    }
    if (l && k !== 'mesa') {
      g.fillStyle = lum(c) > 160 ? 'rgba(58,36,20,.85)' : 'rgba(255,248,230,.9)'; g.font = `800 10px ${FONT}`; g.textAlign = 'center';
      if ('letterSpacing' in g) g.letterSpacing = '1px';
      g.fillText(l, x + w / 2, k === 'forno' ? y + 10 : y + h / 2 + 4);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
  }
  function bgOf(r) {
    if (bgs[r.id]) return bgs[r.id];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); let s = 11; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    if (r.fl === 'grass') {
      const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 650); gr.addColorStop(0, r.c[1]); gr.addColorStop(1, r.c[0]);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i++) { g.fillStyle = i % 2 ? '#7aa84e' : '#4f8636'; g.fillRect(rnd() * W, rnd() * H, 2, 6); }
      for (let i = 0; i < 80; i++) { g.fillStyle = ['#d9822b', '#b5451b', '#e0a030'][i % 3]; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 5, 3, rnd() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = ['#ffd54a', '#ff8a65', '#fff'][i % 3]; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2.5, 0, 7); g.fill(); }
      r.ex.forEach(e => {                      // caminho de pedras até a porta
        const cy = (e.a + e.b) / 2; g.fillStyle = 'rgba(160,120,70,.45)'; g.beginPath(); g.roundRect(W - 380, e.a, 380, e.b - e.a, 30); g.fill();
        for (let i = 0; i < 9; i++) { g.fillStyle = '#d6c298'; g.strokeStyle = '#8a7350'; g.lineWidth = 2; g.beginPath(); g.ellipse(W - 370 + i * 42, cy + (i % 2 ? 12 : -12), 20, 14, 0, 0, 7); g.fill(); g.stroke(); }
      });
    } else if (r.fl === 'tile') {
      for (let iy = 0; iy < 14; iy++) for (let ix = 0; ix < 20; ix++) {
        g.fillStyle = (ix + iy) % 2 ? r.c[0] : r.c[1]; g.fillRect(ix * 48, iy * 48, 48, 48);
        g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(ix * 48 + 3, iy * 48 + 3, 42, 5);
        g.strokeStyle = 'rgba(110,75,40,.28)'; g.lineWidth = 2; g.strokeRect(ix * 48, iy * 48, 48, 48);
      }
    } else {
      let row = 0;
      for (let y = 0; y < H; y += 36, row++) for (let x = -(row % 2) * 90; x < W; x += 180) {
        g.fillStyle = shade(r.c[0], rnd() * 18 - 9); g.fillRect(x, y, 180, 36);
        g.strokeStyle = r.c[1]; g.lineWidth = 2; g.strokeRect(x, y, 180, 36);
        g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + 6, y + 8 + k * 9 + rnd() * 3); g.lineTo(x + 170, y + 8 + k * 9 + rnd() * 3); g.stroke(); }
      }
    }
    r.F.filter(f => f.k === 'rug').forEach(f => drawF(g, f));
    g.save(); g.shadowColor = 'rgba(15,8,3,.6)'; g.shadowBlur = 16; g.shadowOffsetY = 3; g.fillStyle = r.w[0];
    r.wl.forEach(w => g.fillRect(w.x, w.y, w.w, w.h)); g.restore();               // sombra suave das paredes sobre o piso
    for (const w of r.wl) {
      const hz = w.w > w.h, first = hz ? w.y < H / 2 : w.x < W / 2, L = hz ? w.w : w.h;
      const gr = hz ? g.createLinearGradient(0, w.y, 0, w.y + w.h) : g.createLinearGradient(w.x, 0, w.x + w.w, 0);
      gr.addColorStop(0, shade(r.w[0], first ? -20 : 22)); gr.addColorStop(1, shade(r.w[0], first ? 22 : -20));
      g.fillStyle = gr; g.fillRect(w.x, w.y, w.w, w.h);
      if (r.w[2]) {                                                                  // cerca de madeira
        for (let i = 8; i < L; i += 40) {
          g.fillStyle = shade(r.w[0], -28); hz ? g.fillRect(w.x + i, w.y - 3, 10, w.h + 6) : g.fillRect(w.x - 3, w.y + i, w.w + 6, 10);
          g.fillStyle = 'rgba(255,255,255,.28)'; hz ? g.fillRect(w.x + i, w.y - 3, 10, 3) : g.fillRect(w.x - 3, w.y + i, w.w + 6, 3);
        }
      } else {                                                                       // painel de madeira
        g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1;
        for (let i = 14; i < L; i += 28) { g.beginPath(); hz ? (g.moveTo(w.x + i, w.y + 2), g.lineTo(w.x + i, w.y + w.h - 2)) : (g.moveTo(w.x + 2, w.y + i), g.lineTo(w.x + w.w - 2, w.y + i)); g.stroke(); }
      }
      g.strokeStyle = r.w[1]; g.lineWidth = 3; g.strokeRect(w.x + 1.5, w.y + 1.5, w.w - 3, w.h - 3);
    }
    r.F.filter(f => f.k !== 'rug').forEach(f => drawF(g, f));
    return bgs[r.id] = c;
  }

  /* ================= RENDER ================= */
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * .5, W / 2, H / 2, H * .98);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(40,15,5,.38)');
  const dk = document.createElement('canvas'); dk.width = W; dk.height = H; const dg = dk.getContext('2d');

  function rr(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function drawExits() {
    ctx.font = `800 11px ${FONT}`;
    for (const e of room.ex) {
      const g = e.g, cx = g.x + g.w / 2, cy = g.y + g.h / 2, hz = g.w > g.h, open = st.open[e.k];
      if (!open) {                                                    // porta trancada de madeira com cadeado
        const gr = hz ? ctx.createLinearGradient(0, g.y, 0, g.y + g.h) : ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
        gr.addColorStop(0, '#a06a35'); gr.addColorStop(1, '#6e4520');
        ctx.fillStyle = gr; ctx.fillRect(g.x, g.y, g.w, g.h);
        ctx.strokeStyle = 'rgba(40,20,5,.5)'; ctx.lineWidth = 2;
        for (let i = 10; i < (hz ? g.w : g.h); i += 14) { ctx.beginPath(); hz ? (ctx.moveTo(g.x + i, g.y), ctx.lineTo(g.x + i, g.y + g.h)) : (ctx.moveTo(g.x, g.y + i), ctx.lineTo(g.x + g.w, g.y + i)); ctx.stroke(); }
        ctx.strokeStyle = '#2f1a08'; ctx.lineWidth = 3; ctx.strokeRect(g.x + 1.5, g.y + 1.5, g.w - 3, g.h - 3);
        const lk = 7 + Math.sin(tm * 4) * .8;
        ctx.fillStyle = '#ffd54a'; rp(cx - lk, cy - lk * .6, lk * 2, lk * 1.5, 3); ctx.fill();
        ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy - lk * .6, lk * .6, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = '#3b2a10'; ctx.fillRect(cx - 1.5, cy - 1, 3, 5);
      } else { ctx.fillStyle = `rgba(255,200,100,${.15 + .07 * Math.sin(tm * 3)})`; ctx.fillRect(g.x, g.y, g.w, g.h); }
      const t = ROOMS[e.to].n.toUpperCase(), tw = ctx.measureText(t).width + 16;    // plaquinha com o destino
      let px, py;
      if (e.s === 'N') { px = cx - tw / 2; py = T + 6; } else if (e.s === 'S') { px = cx - tw / 2; py = H - T - 26; }
      else if (e.s === 'W') { px = T + 6; py = cy - 10; } else { px = W - T - 6 - tw; py = cy - 10; }
      rr(px, py, tw, 20, 10, 'rgba(36,21,12,.82)', open ? '#ffb347' : 'rgba(255,220,170,.35)');
      ctx.fillStyle = open ? '#ffcf7a' : '#f6e7c8'; ctx.textAlign = 'center'; ctx.fillText(t, px + tw / 2, py + 14);
    }
    ctx.textAlign = 'left';
  }
  function drawPlayer() {
    const p = player, mv = Math.abs(p.vx) + Math.abs(p.vy) > 20, b = mv ? Math.sin(tm * 18) * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x + 13, p.y + p.h, 15, 5, 0, 0, 7); ctx.fill();
    sprite('player', p.x - 3, p.y - 8 + b, 32, 34, p.face < 0);
  }
  function drawPeru() {
    const b = peru.spd > 0 ? Math.sin(tm * 20) * 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(peru.x + 18, peru.y + peru.h, 18, 6, 0, 0, 7); ctx.fill();
    sprite('peru', peru.x - 3, peru.y - 3 + b, peru.w + 6, peru.h + 6, peru.vx < 0);
    if (peru.flee) { ctx.fillStyle = '#ffeb3b'; ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 3; ctx.font = `800 20px ${FONT}`; ctx.textAlign = 'center'; ctx.strokeText('!', peru.x + 18, peru.y - 8); ctx.fillText('!', peru.x + 18, peru.y - 8); ctx.textAlign = 'left'; }
  }
  function drawDark() {
    dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H);
    dg.fillStyle = 'rgba(8,4,14,.94)'; dg.fillRect(0, 0, W, H);
    dg.globalCompositeOperation = 'destination-out';
    const x = player.x + 13, y = player.y + 13, g = dg.createRadialGradient(x, y, 20, x, y, 175);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dg.fillStyle = g; dg.fillRect(0, 0, W, H); ctx.drawImage(dk, 0, 0);
  }
  function drawPrompt() {
    if (state !== 'play' || trans) return;
    const s = room.sp.find(s => !st.done[s.id] && hit(player, s.r)); if (!s) return;
    const t = s.txt; ctx.font = `800 13px ${FONT}`;
    const w = ctx.measureText(t).width + 50, x = Math.min(W - w - 8, Math.max(8, player.x + 13 - w / 2)), y = Math.max(8, player.y - 44) + Math.sin(tm * 5) * 2;
    rr(x, y, w, 28, 14, 'rgba(36,21,12,.94)', '#ffb347');
    rr(x + 6, y + 5, 20, 18, 5, '#f6e7c8'); ctx.fillStyle = '#2a1a0e'; ctx.textAlign = 'center'; ctx.fillText('E', x + 16, y + 18);
    ctx.fillStyle = '#f6e7c8'; ctx.fillText(t, x + 38 + (w - 50) / 2, y + 18); ctx.textAlign = 'left';
  }
  function drawAct() {      // barrinha pequena sobre o jogador (não cobre o cenário)
    if (state !== 'timed') return;
    const w = 112, x = Math.min(W - w - 14, Math.max(14, player.x + 13 - w / 2)), y = Math.max(34, player.y - 30), pr = A.t / A.dur;
    rr(x - 8, y - 26, w + 16, 46, 12, 'rgba(36,21,12,.94)', '#ffb347');
    ctx.fillStyle = '#f6e7c8'; ctx.font = `800 12px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(`${A.label} ${Math.ceil(A.dur - A.t)}s`, x + w / 2, y - 8); ctx.textAlign = 'left';
    rr(x, y, w, 10, 5, '#5a3a22'); rr(x, y, Math.max(10, w * pr), 10, 5, '#ffb347');
  }
  function render() {
    ctx.drawImage(bgOf(room), 0, 0); drawExits();
    const fo = room.F.find(f => f.k === 'forno');
    if (fo && state === 'timed' && A.id === 'forno') { ctx.fillStyle = `rgba(255,${120 + Math.random() * 60 | 0},30,.92)`; ctx.beginPath(); ctx.roundRect(fo.x + 13, fo.y + 37, fo.w - 26, 32, 4); ctx.fill(); }
    for (const sp of room.sp) if (!st.done[sp.id] && !['balcao', 'forno', 'mesa'].includes(sp.id)) {   // brilho nos locais de busca
      ctx.fillStyle = `rgba(255,213,74,${.5 + .4 * Math.sin(tm * 4 + sp.at.x)})`; ctx.font = '700 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✦', sp.at.x + sp.at.w / 2, sp.at.y - 4 + Math.sin(tm * 3) * 2); ctx.textAlign = 'left';
    }
    for (const [k, x, y] of room.p) if (!st.found.has(k)) {
      const b = Math.sin(tm * 4) * 3, it = ITEMS[k];
      const gr = ctx.createRadialGradient(x + 15, y + 15, 3, x + 15, y + 15, 26 + b); gr.addColorStop(0, 'rgba(255,230,120,.65)'); gr.addColorStop(1, 'rgba(255,230,120,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + 15, y + 15, 26 + b, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 15, y + 32, 12, 4, 0, 0, 7); ctx.fill();
      sprite(it.sp, x, y + b, 30, 30, false, it.c);
    }
    if (state === 'win') { const m = room.F.find(f => f.k === 'mesa'); if (m) sprite('peru', m.x + m.w / 2 - 32, m.y + m.h / 2 - 32, 64, 64); }
    const ents = [{ y: player.y, f: drawPlayer }];
    if (room === QG && st.stage === 'selvagem') ents.push({ y: peru.y, f: drawPeru });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    if (room.dark) drawDark();
    for (const p of parts) { ctx.globalAlpha = Math.max(0, 1 - p.life / p.max); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,165,70,.05)'; ctx.fillRect(0, 0, W, H);       // luz quente de outono
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    drawPrompt(); drawAct();
    if (trans) { ctx.fillStyle = `rgba(28,15,7,${Math.min(1, trans.a)})`; ctx.fillRect(0, 0, W, H); }
  }

  /* ================= ENTRADA ================= */
  addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    down.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyM') muted = !muted;
    if (state === 'title' && e.code === 'Enter') start();
    else if (state === 'play' && !trans && ['KeyE', 'Space', 'Enter'].includes(e.code)) interact();
    else if (state === 'quiz') { if (e.code === 'Escape') closeQuiz(); else answer(+e.key - 1); }
    else if (state === 'win' && e.code === 'Enter' && !$('screen-win').classList.contains('hidden')) restart();
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  $('btn-start').onclick = start; $('btn-restart').onclick = restart; $('q-close').onclick = closeQuiz;

  /* ================= LOOP ================= */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); render(); requestAnimationFrame(frame);
  }
  reset(); requestAnimationFrame(frame);
})();
