// ---------- Data Model ----------
const pieceStats = {
  K:{hp:10, atk:3, def:2},
  Q:{hp:7, atk:5, def:1, move:7},
  R:{hp:6, atk:4, def:2, move:7},
  B:{hp:5, atk:3, def:1, move:7},
  N:{hp:5, atk:3, def:2},
  P:{hp:3, atk:2, def:0}
};

const files = ['a','b','c','d','e','f','g','h'];

function makePiece(color, kind, stats){
  return {
    id: null,
    color, kind,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    move: stats.move || 0
  };
}

const initialSetup = () => {
  const pos = {};
  const pieces = {};
  const loc = {};
  const ranks = { w:{back:1,pawn:2}, b:{back:8,pawn:7} };
  for (const color of ['w','b']) {
    const order = ['R','N','B','Q','K','B','N','R'];
    const counts = {K:0,Q:0,R:0,B:0,N:0,P:0};
    const rank = ranks[color];
    // back rank
    for (let i=0;i<8;i++) {
      const kind = order[i];
      counts[kind]++;
      const sq = files[i] + rank.back;
      addPiece(color, kind, counts[kind], sq);
    }
    // pawns
    for (let i=0;i<8;i++) {
      counts.P++;
      const sq = files[i] + rank.pawn;
      addPiece(color, 'P', counts.P, sq);
    }
  }
  function addPiece(color, kind, idx, sq){
    const id = `${color}${kind}#${idx}`;
    const piece = makePiece(color, kind, pieceStats[kind]);
    piece.id = id;
    pos[sq] = id;
    pieces[id] = piece;
    loc[id] = sq;
  }
  return {pos, pieces, loc, turn:'w', selected:null, flipped:false, over:false, log:[]};
};

let board, S = initialSetup();

board = Chessboard('board', {
  position: toBoardPosition(S),
  draggable: true,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  pieceTheme: pieceTheme
});

renderHUD();
drawOverlays();

document.getElementById('new').onclick = () => {
  S = initialSetup();
  board.position(toBoardPosition(S));
  renderHUD();
  drawOverlays();
};

document.getElementById('flip').onclick = () => { S.flipped = !S.flipped; board.flip(); };

function pieceTheme(pieceCode) {
  const c = pieceCode[0] === 'w' ? 'w' : 'b';
  const t = pieceCode[1].toUpperCase();
  return `https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/${c}${t}.png`;
}

function onDragStart(source, piece, pos, orientation) {
  if (S.over) return false;
  const color = piece[0];
  if (color !== S.turn) return false;
  const pid = findPieceAt(source);
  if (!pid) return false;
  S.selected = pid;
  highlightLegal(pid);
}

function onDrop(source, target) {
  clearHighlights();
  const pid = S.selected;
  S.selected = null;
  if (!pid) return 'snapback';

  const legal = legalMoves(pid);
  const mv = legal.find(m => m.from === source && m.to === target);
  if (!mv) return 'snapback';

  const before = cloneState(S);
  const attacker = S.pieces[pid];
  const defId = S.pos[target];

  if (!defId) {
    movePiece(pid, target);
    log(`${prettyPiece(attacker)} to ${target}`);
  } else {
    const defender = S.pieces[defId];
    const dmg = Math.max(1, attacker.atk - defender.def);
    defender.hp -= dmg;
    if (defender.hp <= 0) {
      delete S.pos[target];
      delete S.loc[defId];
      movePiece(pid, target);
      log(`${prettyPiece(attacker)} attacks ${prettyPiece(defender)} at ${target} for ${dmg} — defeated`);
      if (defender.kind === 'K') endGame(`${attacker.color === 'w' ? 'White' : 'Black'} wins (king defeated)`);
    } else {
      log(`${prettyPiece(attacker)} attacks ${prettyPiece(defender)} at ${target} for ${dmg} — ${defender.hp} HP left`);
    }
  }

  if (!S.over) S.turn = (S.turn === 'w') ? 'b' : 'w';

  board.position(toBoardPosition(S));
  renderHUD();
  drawOverlays();
}

function onSnapEnd() {
  board.position(toBoardPosition(S));
}

// ---------- Movement Logic ----------
function sqToRC(sq){ return [8 - parseInt(sq[1]), files.indexOf(sq[0])]; }
function rcToSq(r,c){ return files[c] + (8 - r); }
function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

const moveGenerators = {
  P: movesPawn,
  N: movesKnight,
  B: (p, from) => movesRay(p, from, [[1,1],[1,-1],[-1,1],[-1,-1]]),
  R: (p, from) => movesRay(p, from, [[1,0],[-1,0],[0,1],[0,-1]]),
  Q: (p, from) => movesRay(p, from, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]),
  K: movesKing
};

function legalMoves(pid){
  const from = findSquare(pid); if (!from) return [];
  const p = S.pieces[pid];
  return moveGenerators[p.kind](p, from);
}

function movesPawn(p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  const dir = p.color==='w' ? 1 : -1;
  const fr = r - dir;
  if (inBounds(fr,c) && !S.pos[rcToSq(fr,c)]) moves.push({from, to: rcToSq(fr,c)});
  for (const dc of [-1,1]) {
    const tr = r - dir, tc = c + dc;
    if (!inBounds(tr,tc)) continue;
    const sq = rcToSq(tr,tc);
    if (S.pos[sq] && S.pieces[S.pos[sq]].color !== p.color) moves.push({from, to: sq});
  }
  return moves;
}

function movesKnight(p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr,dc] of deltas){
    const tr=r+dr, tc=c+dc;
    if (!inBounds(tr,tc)) continue;
    const sq = rcToSq(tr,tc);
    const occ = S.pos[sq];
    if (!occ || S.pieces[occ].color !== p.color) moves.push({from, to:sq});
  }
  return moves;
}

function movesRay(p, from, dirs){
  const [r,c] = sqToRC(from);
  const moves = [];
  for (const [dr,dc] of dirs){
    let steps=0, tr=r, tc=c;
    while (true){
      tr+=dr; tc+=dc; steps++;
      if (steps > (p.move||7)) break;
      if (!inBounds(tr,tc)) break;
      const toSq = rcToSq(tr,tc);
      const occ = S.pos[toSq];
      if (!occ){ moves.push({from, to:toSq}); }
      else {
        if (S.pieces[occ].color !== p.color) moves.push({from, to:toSq});
        break;
      }
    }
  }
  return moves;
}

function movesKing(p, from){
  const [r,c] = sqToRC(from);
  const moves = [];
  for (let dr=-1; dr<=1; dr++){
    for (let dc=-1; dc<=1; dc++){
      if (dr===0 && dc===0) continue;
      const tr=r+dr, tc=c+dc;
      if (!inBounds(tr,tc)) continue;
      const sq=rcToSq(tr,tc);
      const occ=S.pos[sq];
      if (!occ || S.pieces[occ].color !== p.color) moves.push({from, to:sq});
    }
  }
  return moves;
}

// ---------- Helpers ----------
function findSquare(pid){ return S.loc[pid] || null; }
function findPieceAt(sq){ return S.pos[sq] || null; }
function movePiece(pid, to){
  const from = S.loc[pid];
  if (from) delete S.pos[from];
  S.pos[to] = pid;
  S.loc[pid] = to;
}
function toBoardPosition(state){
  const map = {};
  for (const [sq,id] of Object.entries(state.pos)){
    const p = state.pieces[id];
    map[sq] = p.color + p.kind;
  }
  return map;
}
function prettyPiece(p){ const names = {K:'King',Q:'Queen',R:'Rook',B:'Bishop',N:'Knight',P:'Pawn'}; return `${p.color==='w'? 'White':'Black'} ${names[p.kind]}`; }
function endGame(msg){ S.over=true; setStatus(msg); }
function log(msg){ S.log.unshift(msg); if (S.log.length>40) S.log.pop(); document.getElementById('log').innerHTML = S.log.map(l=>`• ${l}`).join('<br>'); }
function setStatus(t){ document.getElementById('status').textContent = t; }

function renderHUD(){
  const turnEl = document.getElementById('turn');
  turnEl.textContent = S.over ? 'Game Over' : `${S.turn==='w'?'White':'Black'} to move`;
  document.getElementById('selected').innerHTML = 'None';
}

// ---------- Visual Overlays (HP badges & legal highlights) ----------
function drawOverlays(){
  const squares = document.querySelectorAll('#board .square-55d63');
  squares.forEach(el => {
    const badge = el.querySelector('.hp-badge');
    if (badge) badge.remove();
  });
  for (const [sq,id] of Object.entries(S.pos)){
    const p = S.pieces[id];
    const el = document.querySelector(`#board .square-${sq}`);
    if (!el) continue;
    const b = document.createElement('div');
    b.className = 'hp-badge';
    b.textContent = `HP ${p.hp}  A${p.atk} D${p.def}${p.move?` M${p.move}`:''}`;
    el.appendChild(b);
  }
}

function highlightLegal(pid){
  clearHighlights();
  const ls = legalMoves(pid);
  const mySq = findSquare(pid);
  const me = document.querySelector(`#board .square-${mySq}`);
  if (me) me.classList.add('legal');
  for (const m of ls){
    const el = document.querySelector(`#board .square-${m.to}`);
    if (!el) continue;
    if (S.pos[m.to] && S.pieces[S.pos[m.to]].color !== S.pieces[pid].color) el.classList.add('enemy');
    else el.classList.add('legal');
  }
  const p = S.pieces[pid];
  document.getElementById('selected').innerHTML =
    `<div class="stat"><b>${prettyPiece(p)}</b></div>`+
    `<div class="stat">HP ${p.hp}</div>`+
    `<div class="stat">ATK ${p.atk}</div>`+
    `<div class="stat">DEF ${p.def}</div>`+
    `${p.move?`<div class="stat">MOVE ${p.move}</div>`:''}`+
    `<div>Square: <b>${mySq}</b></div>`;
}

function clearHighlights(){
  document.querySelectorAll('#board .square-55d63').forEach(el => el.classList.remove('legal','enemy'));
}

function cloneState(s){
  return typeof structuredClone === 'function' ? structuredClone(s) : JSON.parse(JSON.stringify(s));
}
