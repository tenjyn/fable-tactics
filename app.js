const {
  initialSetup,
  legalMoves,
  resolveCombat,
  movePiece
} = require('./gameEngine');

let S; // game state
let board; // chessboard.js instance
let selected = null; // currently selected piece id
let currentLegal = []; // cached legal moves for selected piece

// --------- helpers ---------
function pieceTheme(code) {
  const c = code[0] === 'w' ? 'w' : 'b';
  const t = code[1].toUpperCase();
  return `https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/${c}${t}.png`;
}

function toBoardPosition(state) {
  const pos = {};
  for (const [sq, id] of Object.entries(state.pos)) {
    const p = state.pieces[id];
    pos[sq] = p.color + p.kind;
  }
  return pos;
}

function prettyPiece(piece) {
  if (typeof piece === 'string') piece = S.pieces[piece];
  return `${piece.color === 'w' ? 'White' : 'Black'} ${piece.kind}`;
}

function log(msg) {
  const el = document.getElementById('log');
  if (!el) return;
  const div = document.createElement('div');
  div.textContent = msg;
  el.prepend(div);
}

function renderHUD() {
  const turnEl = document.getElementById('turn');
  if (turnEl) turnEl.textContent = `${S.turn === 'w' ? 'White' : 'Black'} to move`;
}

function endGame(msg) {
  S.over = true;
  const status = document.getElementById('status');
  if (status) status.textContent = msg;
}

// ---------- drag helpers ----------
function onDragStart(source, piece) {
  if (S.over) return false;
  const color = piece[0];
  if (color !== S.turn) return false;
  const pid = S.pos[source];
  if (!pid) return false;
  selected = pid;
  currentLegal = legalMoves(S, pid);
  highlightLegal(source, currentLegal);
}

function onDrop(source, target) {
  clearHighlights();
  if (!selected) return 'snapback';
  const mv = currentLegal.find(m => m.to === target);
  if (!mv) {
    selected = null;
    return 'snapback';
  }

  const attackerId = selected;
  const defenderId = S.pos[target];
  const defenderPiece = defenderId ? S.pieces[defenderId] : null;
  const res = resolveCombat(S, attackerId, target);

  if (res.type === 'move') {
    log(`${prettyPiece(attackerId)} moves to ${target}`);
  } else if (res.type === 'hit') {
    log(
      `${prettyPiece(attackerId)} attacks ${prettyPiece(defenderPiece)} at ${target} for ${res.dmg} — ${res.hp} HP left`
    );
  } else if (res.type === 'defeat') {
    log(
      `${prettyPiece(attackerId)} attacks ${prettyPiece(defenderPiece)} at ${target} for ${res.dmg} — defeated`
    );
    if (defenderPiece && defenderPiece.kind === 'K') {
      endGame(`${S.turn === 'w' ? 'White' : 'Black'} wins (king defeated)`);
    }
  }

  if (!S.over) S.turn = S.turn === 'w' ? 'b' : 'w';
  board.position(toBoardPosition(S));
  renderHUD();
  drawOverlays();
  selected = null;
}

function onSnapEnd() {
  board.position(toBoardPosition(S));
}

// ---------- visuals ----------
function drawOverlays() {
  const squares = document.querySelectorAll('#board .square-55d63');
  squares.forEach(el => {
    const badge = el.querySelector('.hp-badge');
    if (badge) badge.remove();
  });
  for (const [sq, id] of Object.entries(S.pos)) {
    const p = S.pieces[id];
    const el = document.querySelector(`#board .square-${sq}`);
    if (!el) continue;
    const b = document.createElement('div');
    b.className = 'hp-badge';
    b.textContent = p.hp;
    el.appendChild(b);
  }
}

function highlightLegal(from, moves) {
  clearHighlights();
  const me = document.querySelector(`#board .square-${from}`);
  if (me) me.classList.add('legal');
  for (const m of moves) {
    const el = document.querySelector(`#board .square-${m.to}`);
    if (!el) continue;
    if (S.pos[m.to] && S.pieces[S.pos[m.to]].color !== S.pieces[selected].color) el.classList.add('enemy');
    else el.classList.add('legal');
  }
  const p = S.pieces[selected];
  const sel = document.getElementById('selected');
  if (sel) {
    sel.innerHTML =
      `<div class="stat"><b>${prettyPiece(p)}</b></div>` +
      `<div class="stat">HP ${p.hp}</div>` +
      `<div class="stat">ATK ${p.atk}</div>` +
      `<div class="stat">DEF ${p.def}</div>` +
      `${p.move ? `<div class="stat">MOVE ${p.move}</div>` : ''}` +
      `<div>Square: <b>${S.loc[selected]}</b></div>`;
  }
}

function clearHighlights() {
  document
    .querySelectorAll('#board .square-55d63')
    .forEach(el => el.classList.remove('legal', 'enemy'));
}

// ---------- boot ----------
function init() {
  S = initialSetup();
  board = Chessboard('board', {
    position: toBoardPosition(S),
    draggable: true,
    pieceTheme,
    onDragStart,
    onDrop,
    onSnapEnd
  });
  renderHUD();
  drawOverlays();
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}

module.exports = {
  init,
  pieceTheme,
  onDragStart,
  onDrop,
  onSnapEnd
};

