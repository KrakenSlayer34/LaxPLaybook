// === Constants and Initialization ===
const canvas = document.getElementById("field-canvas");
const ctx = canvas.getContext("2d");

let redPlayers = [];
let bluePlayers = [];
let arrows = [];
let picks = [];
let zones = [];
let ball = null;
let dragging = false;
let dragTarget = null;
let selectedElement = null;
let isDraggingControlPoint = false;
let currentMouse = { x: 0, y: 0 };

let undoStack = [];
let redoStack = [];

// === Utility Functions ===
function saveState() {
  undoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, ball }));
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, ball }));
  const prev = JSON.parse(undoStack.pop());
  redPlayers = prev.redPlayers;
  bluePlayers = prev.bluePlayers;
  arrows = prev.arrows;
  picks = prev.picks;
  zones = prev.zones;
  ball = prev.ball;
  draw();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, ball }));
  const next = JSON.parse(redoStack.pop());
  redPlayers = next.redPlayers;
  bluePlayers = next.bluePlayers;
  arrows = next.arrows;
  picks = next.picks;
  zones = next.zones;
  ball = next.ball;
  draw();
}

// === Drawing ===
function drawPlayer(player, color) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(player.label || "", player.x, player.y - 20);
}

function drawArrow(arrow, dashed = false) {
  ctx.beginPath();
  ctx.moveTo(arrow.x1, arrow.y1);
  ctx.setLineDash(dashed ? [10, 5] : []);
  ctx.lineTo(arrow.x2, arrow.y2);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawZone(zone) {
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(128, 0, 128, 0.3)";
  ctx.fill();
  ctx.strokeStyle = "purple";
  ctx.stroke();
}

function drawPick(pick) {
  ctx.beginPath();
  ctx.arc(pick.x, pick.y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = "orange";
  ctx.stroke();
}

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  zones.forEach(drawZone);
  arrows.forEach(a => drawArrow(a, a.dashed));
  picks.forEach(drawPick);
  redPlayers.forEach(p => drawPlayer(p, "red"));
  bluePlayers.forEach(p => drawPlayer(p, "blue"));
  if (ball) drawBall(ball);
}

// === Interactions ===
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  dragging = true;

  const allPlayers = redPlayers.concat(bluePlayers);
  for (let p of allPlayers) {
    if (Math.hypot(p.x - mouseX, p.y - mouseY) < 15) {
      dragTarget = p;
      return;
    }
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragging || !dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  dragTarget.x = e.clientX - rect.left;
  dragTarget.y = e.clientY - rect.top;
  draw();
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
  dragTarget = null;
});

canvas.addEventListener("dblclick", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  [redPlayers, bluePlayers].forEach(group => {
    group.forEach(p => {
      if (Math.hypot(mouseX - p.x, mouseY - p.y) < 15) {
        const newLabel = prompt("Enter player label:", p.label || "");
        if (newLabel !== null) {
          p.label = newLabel;
          draw();
        }
      }
    });
  });
});

// === Button Handlers ===
document.getElementById("add-red-player").addEventListener("click", () => {
  saveState();
  redPlayers.push({ x: 100, y: 100, label: "R" + (redPlayers.length + 1) });
  draw();
});

document.getElementById("add-blue-player").addEventListener("click", () => {
  saveState();
  bluePlayers.push({ x: 200, y: 100, label: "B" + (bluePlayers.length + 1) });
  draw();
});

document.getElementById("add-ball").addEventListener("click", () => {
  saveState();
  ball = { x: 300, y: 100 };
  draw();
});

document.getElementById("add-solid-arrow").addEventListener("click", () => {
  saveState();
  arrows.push({ x1: 400, y1: 100, x2: 500, y2: 150, dashed: false });
  draw();
});

document.getElementById("add-dashed-arrow").addEventListener("click", () => {
  saveState();
  arrows.push({ x1: 400, y1: 200, x2: 500, y2: 250, dashed: true });
  draw();
});

document.getElementById("add-zone").addEventListener("click", () => {
  saveState();
  zones.push({ x: 600, y: 300, radius: 50 });
  draw();
});

document.getElementById("add-pick").addEventListener("click", () => {
  saveState();
  picks.push({ x: 700, y: 200 });
  draw();
});

document.getElementById("clear-board").addEventListener("click", () => {
  saveState();
  redPlayers = [];
  bluePlayers = [];
  arrows = [];
  picks = [];
  zones = [];
  ball = null;
  draw();
});

// === Save/Load ===
document.getElementById("save-play").addEventListener("click", () => {
  const state = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, ball });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([state], { type: "application/json" }));
  a.download = "play.json";
  a.click();
});

document.getElementById("load-play").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const state = JSON.parse(e.target.result);
      redPlayers = state.redPlayers;
      bluePlayers = state.bluePlayers;
      arrows = state.arrows;
      picks = state.picks;
      zones = state.zones;
      ball = state.ball;
      draw();
    };
    reader.readAsText(file);
  };
  input.click();
});

document.getElementById("undo-button")?.addEventListener("click", undo);
document.getElementById("redo-button")?.addEventListener("click", redo);

// Initial draw
draw();
