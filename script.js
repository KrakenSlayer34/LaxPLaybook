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
let currentMouse = { x: 0, y: 0 };
let controlPointSize = 6;

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);

document.getElementById("add-red-player").addEventListener("click", () => {
  redPlayers.push({ x: 100, y: 100, team: "red", label: "R" + (redPlayers.length + 1) });
  draw();
});

document.getElementById("add-blue-player").addEventListener("click", () => {
  bluePlayers.push({ x: 200, y: 100, team: "blue", label: "B" + (bluePlayers.length + 1) });
  draw();
});

document.getElementById("add-ball").addEventListener("click", () => {
  ball = { x: 150, y: 150 };
  draw();
});

document.getElementById("add-zone").addEventListener("click", () => {
  zones.push({ x: 300, y: 200, radius: 50 });
  draw();
});

document.getElementById("add-pick").addEventListener("click", () => {
  picks.push({ x: 350, y: 200 });
  draw();
});

function addArrow(type) {
  let color = "black", label = "";
  if (type === "shot") color = "red";
  if (type === "slide1") label = "1";
  if (type === "slide2") label = "2";
  if (type === "slide3") label = "3";
  const arrow = {
    x1: 100,
    y1: 300,
    x2: 200,
    y2: 300,
    cpX: 150,
    cpY: 250,
    color,
    label
  };
  (type.includes("slide") || type === "shot") ? slides.push(arrow) : arrows.push(arrow);
  draw();
}

document.getElementById("add-solid-arrow").addEventListener("click", () => addArrow("solid"));
document.getElementById("add-dashed-arrow").addEventListener("click", () => addArrow("dashed"));
document.getElementById("add-shot").addEventListener("click", () => addArrow("shot"));
document.getElementById("add-hot-slide").addEventListener("click", () => addArrow("slide1"));
document.getElementById("add-second-slide").addEventListener("click", () => addArrow("slide2"));
document.getElementById("add-third-slide").addEventListener("click", () => addArrow("slide3"));

document.getElementById("clear-board").addEventListener("click", () => {
  redPlayers = [];
  bluePlayers = [];
  arrows = [];
  picks = [];
  zones = [];
  slides = [];
  ball = null;
  draw();
});

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function onMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  currentMouse = { x: mouseX, y: mouseY };

  const allElements = [...redPlayers, ...bluePlayers, ...picks, ...zones, ball].filter(Boolean);
  for (const element of allElements) {
    const radius = element.radius || 15;
    if (distance(mouseX, mouseY, element.x, element.y) <= radius) {
      dragTarget = element;
      dragging = true;
      return;
    }
  }

  const allLines = [...arrows, ...slides];
  for (const line of allLines) {
    const cpDist = distance(mouseX, mouseY, line.cpX, line.cpY);
    const startDist = distance(mouseX, mouseY, line.x1, line.y1);
    const endDist = distance(mouseX, mouseY, line.x2, line.y2);

    if (cpDist < controlPointSize || startDist < controlPointSize || endDist < controlPointSize) {
      selectedElement = line;
      if (cpDist < controlPointSize) selectedElement.control = "cp";
      else if (startDist < controlPointSize) selectedElement.control = "start";
      else if (endDist < controlPointSize) selectedElement.control = "end";
      dragging = true;
      return;
    }
  }
}

function onMouseMove(e) {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  currentMouse = { x: mouseX, y: mouseY };

  if (dragTarget) {
    dragTarget.x = mouseX;
    dragTarget.y = mouseY;
    draw();
    return;
  }

  if (selectedElement) {
    if (selectedElement.control === "cp") {
      selectedElement.cpX = mouseX;
      selectedElement.cpY = mouseY;
    } else if (selectedElement.control === "start") {
      selectedElement.x1 = mouseX;
      selectedElement.y1 = mouseY;
    } else if (selectedElement.control === "end") {
      selectedElement.x2 = mouseX;
      selectedElement.y2 = mouseY;
    }
    draw();
  }
}

function onMouseUp() {
  dragging = false;
  dragTarget = null;
  selectedElement = null;
}

function drawArrow(ctx, x1, y1, x2, y2, cpX, cpY, color = "black", label = "") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cpX, cpY, x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - cpY, x2 - cpX);
  const size = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (label) {
    ctx.fillStyle = color;
    ctx.font = "bold 14px Arial";
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.fillText(label, midX, midY);
  }
}

function drawControlPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, controlPointSize, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  [...arrows, ...slides].forEach((arrow) => {
    drawArrow(ctx, arrow.x1, arrow.y1, arrow.x2, arrow.y2, arrow.cpX, arrow.cpY, arrow.color, arrow.label);
    drawControlPoint(arrow.cpX, arrow.cpY);
    drawControlPoint(arrow.x1, arrow.y1);
    drawControlPoint(arrow.x2, arrow.y2);
  });

  [...redPlayers, ...bluePlayers].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = p.team === "red" ? "red" : "blue";
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(p.label || "P", p.x - 5, p.y + 4);
  });

  picks.forEach((p) => {
    ctx.beginPath();
    ctx.rect(p.x - 10, p.y - 10, 20, 20);
    ctx.strokeStyle = "orange";
    ctx.stroke();
  });

  zones.forEach((z) => {
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(128,0,128,0.2)";
    ctx.fill();
  });

  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  }
}

draw();
