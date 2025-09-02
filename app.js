/* Main game script for Fable Tactics. */

const GE = window.gameEngine;
let S = GE.initialSetup();
let board;
let legal = [];
let origin = null;

function pieceTheme(pieceCode) {
  const c = pieceCode[0] === 'w' ? 'w' : 'b';
  const t = pieceCode[1].toUpperCase();
  return `https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/${c}${t}.png`;
}

function log(msg){
  S.log.push(msg);
  const el = document.getElementById('log');
  const div = document.createElement('div');
  div.textContent = msg;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function renderHUD(){
  const turnEl = document.getElementById('turn');
  turnEl.textContent = S.over ? '' : `Turn: ${S.turn === 'w' ? 'White' : 'Black'}`;
  if (S.over) document.getElementById('status').textContent = S.status || '';
}

function endGame(msg){
  S.over = true;
  S.status = msg;
  document.getElementById('status').textContent = msg;
}

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
    b.textContent = p.hp;
    el.appendChild(b);
  }
}

function highlightLegal(pid, from, moves){
  clearHighlights();
  const me = document.querySelector(`#board .square-${from}`);
  if (me) me.classList.add('legal');
  for (const m of moves){
    const el = document.querySelector(`#board .square-${m.to}`);
    if (!el) continue;
    if (S.pos[m.to] && S.pieces[S.pos[m.to]].color !== S.pieces[pid].color) el.classList.add('enemy');
    else el.classList.add('legal');
  }
  const p = S.pieces[pid];
  document.getElementById('selected').innerHTML =
    `<div class="stat"><b>${GE.prettyPiece(p)}</b></div>`+
    `<div class="stat">HP ${p.hp}</div>`+
    `<div class="stat">ATK ${p.atk}</div>`+
    `<div class="stat">DEF ${p.def}</div>`+
    `${p.move?`<div class="stat">MOVE ${p.move}</div>`:''}`+
    `<div>Square: <b>${from}</b></div>`;
}

function clearHighlights(){
  document.querySelectorAll('#board .square-55d63').forEach(el => el.classList.remove('legal','enemy'));
}

function onDragStart(source, piece){
  if (S.over) return false;
  const color = piece[0];
  if (color !== S.turn) return false;
  const pid = S.pos[source];
  if (!pid) return false;
  S.selected = pid;
  origin = source;
  legal = GE.legalMoves(S, pid);
  highlightLegal(pid, origin, legal);
}

function onDrop(source, target){
  clearHighlights();
  const pid = S.selected;
  S.selected = null;
  if (!pid) return 'snapback';
  const mv = legal.find(m => m.from === source && m.to === target);
  if (!mv) return 'snapback';

  const before = GE.cloneState(S);
  const defId = before.pos[target];
  const result = GE.resolveCombat(S, pid, target);
  const attacker = S.pieces[pid];

  if (result.type === 'move'){
    log(`${GE.prettyPiece(attacker)} moves from ${source} to ${target}`);
  } else if (result.type === 'defeat'){
    const defender = before.pieces[defId];
    log(`${GE.prettyPiece(attacker)} attacks ${GE.prettyPiece(defender)} at ${target} for ${result.dmg} — defeated`);
    if (defender.kind === 'K') endGame(`${attacker.color === 'w' ? 'White' : 'Black'} wins (king defeated)`);
  } else if (result.type === 'hit'){
    const defender = S.pieces[defId];
    log(`${GE.prettyPiece(attacker)} attacks ${GE.prettyPiece(defender)} at ${target} for ${result.dmg} — ${defender.hp} HP left`);
  }

  if (!S.over) S.turn = (S.turn === 'w') ? 'b' : 'w';

  board.position(GE.toBoardPosition(S));
  renderHUD();
  drawOverlays();
}

function onSnapEnd(){
  board.position(GE.toBoardPosition(S));
}

function newGame(){
  S = GE.initialSetup();
  document.getElementById('log').innerHTML = '';
  board.position(GE.toBoardPosition(S));
  renderHUD();
  drawOverlays();
}

document.getElementById('new').addEventListener('click', newGame);
document.getElementById('flip').addEventListener('click', () => {
  board.flip();
});

board = Chessboard('board', {
  draggable: true,
  position: GE.toBoardPosition(S),
  pieceTheme: pieceTheme,
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

renderHUD();
drawOverlays();
