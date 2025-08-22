

function pieceTheme(pieceCode) {
  const c = pieceCode[0] === 'w' ? 'w' : 'b';
  const t = pieceCode[1].toUpperCase();
  return `https://cdnjs.cloudflare.com/ajax/libs/chessboard.js/1.0.0/img/chesspieces/wikipedia/${c}${t}.png`;
}

function onDragStart(source, piece, pos, orientation) {
  if (S.over) return false;
  const color = piece[0];
  if (color !== S.turn) return false;

  if (!pid) return false;
  S.selected = pid;
  highlightLegal(pid);
}

function onDrop(source, target) {
  clearHighlights();
  const pid = S.selected;
  S.selected = null;
  if (!pid) return 'snapback';


  const mv = legal.find(m => m.from === source && m.to === target);
  if (!mv) return 'snapback';

  const before = cloneState(S);
  const attacker = S.pieces[pid];
  const defId = S.pos[target];

  if (!defId) {

  } else {
    const defender = S.pieces[defId];
    const dmg = Math.max(1, attacker.atk - defender.def);
    defender.hp -= dmg;
    if (defender.hp <= 0) {
      delete S.pos[target];
      delete S.loc[defId];

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

    el.appendChild(b);
  }
}

function highlightLegal(pid){
  clearHighlights();

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
