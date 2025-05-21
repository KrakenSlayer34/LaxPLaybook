// === Constants and Initialization ===
const canvas = document.getElementById("field-canvas");
const ctx = canvas.getContext("2d");

let redPlayers = [];
let bluePlayers = [];
let arrows = [];
let picks = [];
let zones = [];
let slides = [];
let ball = null;
let dragging = false;
let dragTarget = null;
let selectedElement = null;
let isDraggingControlPoint = false;
let currentMouse = { x: 0, y: 0 };
let controlPointSize = 6;

let undoStack = [];
let redoStack = [];

const slideLabels = ["1", "2", "3"];
let slideCount = 0;

function addPlayer(team) {
  const player = {
    x: 100 + Math.random() * 800,
    y: 100 + Math.random() * 400,
    team: team,
    label: team === 'red' ? 'R' : 'B'
  };
  if (team === 'red') redPlayers.push(player);
  else bluePlayers.push(player);
  draw();
}

function toggleTeam(team) {
  const players = team === 'red' ? redPlayers : bluePlayers;
  players.forEach(p => p.visible = !p.visible);
  draw();
}

function addBall() {
  ball = { x: 500, y: 300 };
  draw();
}

function addArrow(type) {
  arrows.push({
    x1: 200, y1: 200,
    x2: 400, y2: 300,
    type,
    cpX: 300, cpY: 250
  });
  draw();
}

function addPick() {
  picks.push({ x: 300, y: 300, radius: 20 });
  draw();
}

function addZone() {
  zones.push({ x: 400, y: 300, radius: 80 });
  draw();
}

function addSlide(type) {
  slides.push({
    x1: 200 + slides.length * 20,
    y1: 200,
    x2: 400 + slides.length * 20,
    y2: 300,
    type,
    label: type,
    cpX: 300 + slides.length * 20,
    cpY: 250
  });
  draw();
}

function clearBoard() {
  redPlayers = [];
  bluePlayers = [];
  arrows = [];
  picks = [];
  zones = [];
  slides = [];
  ball = null;
  draw();
}

// === Save/Load Functions ===
function savePlay() {
  try {
    const data = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball });
    localStorage.setItem("savedPlay", data);
    alert("Play saved.");
  } catch (error) {
    alert("Failed to save play: " + error.message);
  }
}

function loadPlay() {
  try {
    const data = localStorage.getItem("savedPlay");
    if (data) {
      const parsed = JSON.parse(data);
      redPlayers = parsed.redPlayers || [];
      bluePlayers = parsed.bluePlayers || [];
      arrows = parsed.arrows || [];
      picks = parsed.picks || [];
      zones = parsed.zones || [];
      slides = parsed.slides || [];
      ball = parsed.ball || null;
      draw();
    }
  } catch (error) {
    alert("Failed to load play: " + error.message);
  }
}

function exportPlay() {
  draw();
  const data = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lacrosse_play.json";
  a.click();n  URL.revokeObjectURL(url);
}

// === Button Listeners ===
document.getElementById("add-red-player").addEventListener("click", () => addPlayer("red"));
document.getElementById("add-blue-player").addEventListener("click", () => addPlayer("blue"));
document.getElementById("toggle-red-team").addEventListener("click", () => toggleTeam("red"));
document.getElementById("toggle-blue-team").addEventListener("click", () => toggleTeam("blue"));
document.getElementById("add-ball").addEventListener("click", addBall);
document.getElementById("add-solid-arrow").addEventListener("click", () => addArrow("solid"));
document.getElementById("add-dashed-arrow").addEventListener("click", () => addArrow("dashed"));
document.getElementById("add-shot").addEventListener("click", () => addArrow("shot"));
document.getElementById("add-hot-slide").addEventListener("click", () => addSlide("1"));
document.getElementById("add-second-slide").addEventListener("click", () => addSlide("2"));
document.getElementById("add-third-slide").addEventListener("click", () => addSlide("3"));
document.getElementById("add-pick").addEventListener("click", addPick);
document.getElementById("add-zone").addEventListener("click", addZone);
document.getElementById("clear-board").addEventListener("click", clearBoard);
document.getElementById("save-play").addEventListener("click", savePlay);
document.getElementById("load-play").addEventListener("click", loadPlay);
document.getElementById("export-play").addEventListener("click", exportPlay);

// === Add Arrowhead Drawing Helper ===
function drawArrowhead(fromX, fromY, toX, toY, size = 10, color = "black") {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// === DRAW FUNCTION PLACEHOLDER ===
// Place full draw logic here to render players, arrows (with arrowheads), zones, ball, etc.
