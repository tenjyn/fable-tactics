

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


}

function renderHUD(){
  const turnEl = document.getElementById('turn');
  turnEl.textContent = S.over ? '' : `Turn: ${S.turn === 'w' ? 'White' : 'Black'}`;
  if (S.over) document.getElementById('status').textContent = S.status || '';
}


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


    const el = document.querySelector(`#board .square-${m.to}`);
    if (!el) continue;
    if (S.pos[m.to] && S.pieces[S.pos[m.to]].color !== S.pieces[selected].color) el.classList.add('enemy');
    else el.classList.add('legal');
  }

}

function clearHighlights() {
  document
    .querySelectorAll('#board .square-55d63')
    .forEach(el => el.classList.remove('legal', 'enemy'));
}


  renderHUD();
  drawOverlays();
}

