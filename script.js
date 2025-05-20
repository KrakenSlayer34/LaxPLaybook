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

// === Utility Functions ===
function saveState() {
  undoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball }));
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball }));
  const prev = JSON.parse(undoStack.pop());
  redPlayers = prev.redPlayers;
  bluePlayers = prev.bluePlayers;
  arrows = prev.arrows;
  picks = prev.picks;
  zones = prev.zones;
  slides = prev.slides;
  ball = prev.ball;
  draw();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball }));
  const next = JSON.parse(redoStack.pop());
  redPlayers = next.redPlayers;
  bluePlayers = next.bluePlayers;
  arrows = next.arrows;
  picks = next.picks;
  zones = next.zones;
  slides = next.slides;
  ball = next.ball;
  draw();
}

function drawControlPoint(x, y, selected = false) {
  ctx.beginPath();
  ctx.arc(x, y, controlPointSize, 0, Math.PI * 2);
  ctx.fillStyle = selected ? "#f00" : "#00f";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.stroke();
}

function isOverControlPoint(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy) < controlPointSize + 2;
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
  ctx.setLineDash(dashed ? [10, 5] : []);
  ctx.moveTo(arrow.x1, arrow.y1);
  ctx.quadraticCurveTo(arrow.cx, arrow.cy, arrow.x2, arrow.y2);
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.setLineDash([]);

  drawControlPoint(arrow.x1, arrow.y1);
  drawControlPoint(arrow.cx, arrow.cy);
  drawControlPoint(arrow.x2, arrow.y2);
}

function drawZone(zone) {
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(128, 0, 128, 0.3)";
  ctx.fill();
  ctx.strokeStyle = "purple";
  ctx.stroke();

  drawControlPoint(zone.x, zone.y);
}

function drawPick(pick) {
  ctx.beginPath();
  ctx.arc(pick.x, pick.y, 10, 0, Math.PI * 2);
  ctx.strokeStyle = "orange";
  ctx.stroke();

  drawControlPoint(pick.x, pick.y);
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
  slides.forEach(drawPick);
  redPlayers.forEach(p => drawPlayer(p, "red"));
  bluePlayers.forEach(p => drawPlayer(p, "blue"));
  if (ball) drawBall(ball);
}

// === Interactions ===
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dragging = true;

  for (let arrow of arrows) {
    if (isOverControlPoint(x, y, arrow.x1, arrow.y1)) {
      dragTarget = { element: arrow, point: "x1y1" };
      return;
    }
    if (isOverControlPoint(x, y, arrow.x2, arrow.y2)) {
      dragTarget = { element: arrow, point: "x2y2" };
      return;
    }
    if (isOverControlPoint(x, y, arrow.cx, arrow.cy)) {
      dragTarget = { element: arrow, point: "cxcy" };
      return;
    }
  }

  for (let z of zones) {
    if (isOverControlPoint(x, y, z.x, z.y)) {
      dragTarget = z;
      return;
    }
  }
  for (let p of picks) {
    if (isOverControlPoint(x, y, p.x, p.y)) {
      dragTarget = p;
      return;
    }
  }
  for (let p of slides) {
    if (isOverControlPoint(x, y, p.x, p.y)) {
      dragTarget = p;
      return;
    }
  }

  [...redPlayers, ...bluePlayers].forEach(p => {
    if (Math.hypot(p.x - x, p.y - y) < 15) {
      dragTarget = p;
    }
  });
});

canvas.addEventListener("mousemove", e => {
  if (!dragging || !dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (dragTarget.element && dragTarget.point) {
    if (dragTarget.point === "x1y1") {
      dragTarget.element.x1 = x;
      dragTarget.element.y1 = y;
    } else if (dragTarget.point === "x2y2") {
      dragTarget.element.x2 = x;
      dragTarget.element.y2 = y;
    } else if (dragTarget.point === "cxcy") {
      dragTarget.element.cx = x;
      dragTarget.element.cy = y;
    }
  } else {
    dragTarget.x = x;
    dragTarget.y = y;
  }

  draw();
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
  dragTarget = null;
  draw();
});

canvas.addEventListener("dblclick", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  [...redPlayers, ...bluePlayers].forEach(p => {
    if (Math.hypot(x - p.x, y - p.y) < 15) {
      const newLabel = prompt("Enter player label:", p.label || "");
      if (newLabel !== null) {
        p.label = newLabel;
        draw();
      }
    }
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
  arrows.push({ x1: 400, y1: 100, x2: 500, y2: 150, cx: 450, cy: 125, dashed: false });
  draw();
});

document.getElementById("add-dashed-arrow").addEventListener("click", () => {
  saveState();
  arrows.push({ x1: 400, y1: 200, x2: 500, y2: 250, cx: 450, cy: 225, dashed: true });
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

document.getElementById("add-hot-slide").addEventListener("click", () => {
  saveState();
  slides.push({ x: 600, y: 400 });
  draw();
});

document.getElementById("add-second-slide").addEventListener("click", () => {
  saveState();
  slides.push({ x: 620, y: 420 });
  draw();
});

document.getElementById("add-third-slide").addEventListener("click", () => {
  saveState();
  slides.push({ x: 640, y: 440 });
  draw();
});

document.getElementById("clear-board").addEventListener("click", () => {
  saveState();
  redPlayers = [];
  bluePlayers = [];
  arrows = [];
  picks = [];
  zones = [];
  slides = [];
  ball = null;
  draw();
});

// === Save/Load ===
document.getElementById("save-play").addEventListener("click", () => {
  const state = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball });
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
      slides = state.slides;
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

