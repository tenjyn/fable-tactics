/* Dashboard for inspecting piece stats and starting a game. */

const { pieceStats } = window.gameEngine;

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

  window.location.href = 'game.html';
});

updateStats();