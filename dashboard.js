const pieceStats = {
  K:{hp:10, atk:3, def:2},
  Q:{hp:7, atk:5, def:1, move:7},
  R:{hp:6, atk:4, def:2, move:7},
  B:{hp:5, atk:3, def:1, move:7},
  N:{hp:5, atk:3, def:2},
  P:{hp:3, atk:2, def:0}
};

function updateStats(){
  const type = document.getElementById('pieceSelect').value;
  const stats = pieceStats[type];
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML =
    `<div class="stat"><b>${type}</b></div>`+
    `<div class="stat">HP ${stats.hp}</div>`+
    `<div class="stat">ATK ${stats.atk}</div>`+
    `<div class="stat">DEF ${stats.def}</div>`+
    `${stats.move ? `<div class="stat">MOVE ${stats.move}</div>` : ''}`;
}

document.getElementById('pieceSelect').addEventListener('change', updateStats);
document.getElementById('startBtn').addEventListener('click', () => {
  updateStats();
  window.location.href = 'game.html';
});

updateStats();