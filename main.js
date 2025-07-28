const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 8;
const tileSize = canvas.width / gridSize;
const units = [];
let currentTeam = "blue";
let selectedUnit = null;

class Unit {
  constructor(name, team, x, y, hp, move, range) {
    this.name = name;
    this.team = team;
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.move = move;
    this.range = range;
    this.alive = true;
  }

  draw() {
    ctx.fillStyle = this.team === "blue" ? "#4af" : "#f55";
    ctx.fillRect(this.x * tileSize + 10, this.y * tileSize + 10, tileSize - 20, tileSize - 20);
    ctx.fillStyle = "white";
    ctx.fillText(this.hp, this.x * tileSize + tileSize/2 - 5, this.y * tileSize + tileSize - 5);
  }

  canMoveTo(tx, ty) {
    const dx = Math.abs(this.x - tx);
    const dy = Math.abs(this.y - ty);
    return dx + dy <= this.move;
  }

  canAttack(tx, ty) {
    const dx = Math.abs(this.x - tx);
    const dy = Math.abs(this.y - ty);
    return dx + dy <= this.range;
  }
}

function drawGrid() {
  ctx.strokeStyle = "#666";
  for (let x = 0; x <= gridSize; x++) {
    ctx.beginPath();
    ctx.moveTo(x * tileSize, 0);
    ctx.lineTo(x * tileSize, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= gridSize; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * tileSize);
    ctx.lineTo(canvas.width, y * tileSize);
    ctx.stroke();
  }
}

function highlightTiles(unit) {
  ctx.fillStyle = "rgba(0,255,0,0.3)";
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!getUnitAt(x, y) && unit.canMoveTo(x, y)) {
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
  ctx.fillStyle = "rgba(255,0,0,0.3)";
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const target = getUnitAt(x, y);
      if (target && target.team !== unit.team && unit.canAttack(x, y)) {
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function drawUnits() {
  units.forEach(u => u.alive && u.draw());
}

function getUnitAt(x, y) {
  return units.find(u => u.x === x && u.y === y && u.alive);
}

function endTurn() {
  currentTeam = currentTeam === "blue" ? "red" : "blue";
  selectedUnit = null;
  document.getElementById("turnIndicator").innerText = currentTeam + " Team's Turn";
  checkWinCondition();
}

function checkWinCondition() {
  const blueAlive = units.some(u => u.team === "blue" && u.alive);
  const redAlive = units.some(u => u.team === "red" && u.alive);
  if (!blueAlive || !redAlive) {
    setTimeout(() => alert((blueAlive ? "Blue" : "Red") + " Team Wins!"), 50);
  }
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  const clickedUnit = getUnitAt(x, y);

  if (selectedUnit && selectedUnit.team === currentTeam) {
    if (clickedUnit && clickedUnit.team !== currentTeam && selectedUnit.canAttack(x, y)) {
      clickedUnit.hp -= 1;
      if (clickedUnit.hp <= 0) clickedUnit.alive = false;
      endTurn();
    } else if (!clickedUnit && selectedUnit.canMoveTo(x, y)) {
      selectedUnit.x = x;
      selectedUnit.y = y;
      endTurn();
    } else {
      selectedUnit = null;
    }
  } else if (clickedUnit && clickedUnit.team === currentTeam) {
    selectedUnit = clickedUnit;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") endTurn();
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  if (selectedUnit) highlightTiles(selectedUnit);
  drawUnits();
  requestAnimationFrame(gameLoop);
}

function init() {
  units.push(new Unit("Knight", "blue", 0, 0, 3, 2, 1));
  units.push(new Unit("Rogue", "blue", 1, 0, 2, 4, 1));
  units.push(new Unit("Archer", "blue", 2, 0, 2, 3, 3));
  units.push(new Unit("Cleric", "blue", 3, 0, 2, 2, 1));
  units.push(new Unit("Cartographer", "blue", 4, 0, 2, 3, 2));

  units.push(new Unit("Knight", "red", 0, 7, 3, 2, 1));
  units.push(new Unit("Rogue", "red", 1, 7, 2, 4, 1));
  units.push(new Unit("Archer", "red", 2, 7, 2, 3, 3));
  units.push(new Unit("Cleric", "red", 3, 7, 2, 2, 1));
  units.push(new Unit("Cartographer", "red", 4, 7, 2, 3, 2));

  document.getElementById("turnIndicator").innerText = currentTeam + " Team's Turn";
  gameLoop();
}

init();
