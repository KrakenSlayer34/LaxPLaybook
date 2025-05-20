const canvas = document.getElementById("field-canvas");
const ctx = canvas.getContext("2d");
const modeSelect = document.getElementById("mode-select");

let redPlayers = [];
let bluePlayers = [];
let arrows = [];
let picks = [];
let zones = [];
let ball = null;

let dragTarget = null;
let dragType = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw zones
  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(128, 0, 128, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'purple';
    ctx.stroke();
  });

  // Draw picks
  picks.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw arrows
  arrows.forEach(drawArrow);

  // Draw ball
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'orange';
    ctx.fill();
  }

  // Draw players
  redPlayers.forEach(p => drawPlayer(p, "red"));
  bluePlayers.forEach(p => drawPlayer(p, "blue"));
}

function drawPlayer(player, color) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, 15, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.stroke();
}

function drawArrow(a) {
  ctx.strokeStyle = 'green';
  ctx.fillStyle = 'green';
  ctx.lineWidth = 3;
  if (a.dashed) ctx.setLineDash([10, 5]);
  else ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(a.fromX, a.fromY);
  if ('controlX' in a) {
    ctx.quadraticCurveTo(a.controlX, a.controlY, a.toX, a.toY);
  } else {
    ctx.lineTo(a.toX, a.toY);
  }
  ctx.stroke();

  // Draw arrowhead
  let angle;
  if ('controlX' in a) {
    const dx = 2 * (a.toX - a.controlX);
    const dy = 2 * (a.toY - a.controlY);
    angle = Math.atan2(dy, dx);
  } else {
    angle = Math.atan2(a.toY - a.fromY, a.toX - a.fromX);
  }

  const headlen = 10;
  ctx.beginPath();
  ctx.moveTo(a.toX, a.toY);
  ctx.lineTo(a.toX - headlen * Math.cos(angle - Math.PI / 6), a.toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(a.toX - headlen * Math.cos(angle + Math.PI / 6), a.toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(a.toX, a.toY);
  ctx.fill();

  ctx.setLineDash([]);
}

function degToRad(deg) {
  return deg * Math.PI / 180;
}

function addArrowWithUserInput(dashed = false) {
  if (redPlayers.length === 0 && bluePlayers.length === 0) {
    alert("Add players first to position the arrow");
    return;
  }

  const length = parseFloat(prompt("Arrow length (px):", "100"));
  const angleDeg = parseFloat(prompt("Arrow direction (0 = right, 90 = down):", "0"));
  const curvatureDeg = parseFloat(prompt("Arrow curvature (-90 to 90):", "0"));

  if (isNaN(length) || isNaN(angleDeg) || isNaN(curvatureDeg)) return;

  const players = modeSelect.value === "offense" ? redPlayers : bluePlayers;
  const start = players[Math.floor(Math.random() * players.length)];
  const angle = degToRad(angleDeg);
  const curvature = degToRad(curvatureDeg);

  const endX = start.x + length * Math.cos(angle);
  const endY = start.y + length * Math.sin(angle);

  let arrow;
  if (curvature !== 0) {
    const midX = (start.x + endX) / 2;
    const midY = (start.y + endY) / 2;
    const dx = endX - start.x;
    const dy = endY - start.y;
    const norm = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / norm;
    const perpY = dx / norm;
    const controlX = midX + perpX * curvature * length / 100;
    const controlY = midY + perpY * curvature * length / 100;
    arrow = { fromX: start.x, fromY: start.y, toX: endX, toY: endY, controlX, controlY, dashed };
  } else {
    arrow = { fromX: start.x, fromY: start.y, toX: endX, toY: endY, dashed };
  }

  arrows.push(arrow);
  draw();
}

document.getElementById("add-red-player").addEventListener("click", () => {
  redPlayers.push({ x: 100, y: 100 });
  draw();
});
document.getElementById("add-blue-player").addEventListener("click", () => {
  bluePlayers.push({ x: 200, y: 100 });
  draw();
});
document.getElementById("add-ball").addEventListener("click", () => {
  ball = { x: 150, y: 150 };
  draw();
});
document.getElementById("add-solid-arrow").addEventListener("click", () => {
  addArrowWithUserInput(false);
});
document.getElementById("add-dashed-arrow").addEventListener("click", () => {
  addArrowWithUserInput(true);
});
document.getElementById("add-pick").addEventListener("click", () => {
  const length = parseFloat(prompt("Pick line length (px):", "50"));
  const angle = degToRad(parseFloat(prompt("Direction (deg):", "0")));
  const players = modeSelect.value === "offense" ? redPlayers : bluePlayers;
  const p = players[Math.floor(Math.random() * players.length)];
  picks.push({ x1: p.x, y1: p.y, x2: p.x + length * Math.cos(angle), y2: p.y + length * Math.sin(angle) });
  draw();
});
document.getElementById("add-zone").addEventListener("click", () => {
  zones.push({ x: 300, y: 300, radius: 40 });
  draw();
});
document.getElementById("clear-board").addEventListener("click", () => {
  redPlayers = [];
  bluePlayers = [];
  arrows = [];
  picks = [];
  zones = [];
  ball = null;
  draw();
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let a of arrows) {
    if (Math.hypot(mouseX - a.toX, mouseY - a.toY) < 10) {
      dragTarget = a;
      dragType = "arrowEnd";
      return;
    } else if (Math.hypot(mouseX - a.fromX, mouseY - a.fromY) < 10) {
      dragTarget = a;
      dragType = "arrowStart";
      return;
    }
  }

  [redPlayers, bluePlayers].forEach(group => {
    group.forEach(p => {
      if (Math.hypot(mouseX - p.x, mouseY - p.y) < 15) {
        dragTarget = p;
        dragType = "player";
        dragOffsetX = mouseX - p.x;
        dragOffsetY = mouseY - p.y;
      }
    });
  });

  if (ball && Math.hypot(mouseX - ball.x, mouseY - ball.y) < 10) {
    dragTarget = ball;
    dragType = "ball";
    dragOffsetX = mouseX - ball.x;
    dragOffsetY = mouseY - ball.y;
  }

  zones.forEach(z => {
    if (Math.hypot(mouseX - z.x, mouseY - z.y) < z.radius) {
      dragTarget = z;
      dragType = "zone";
      dragOffsetX = mouseX - z.x;
      dragOffsetY = mouseY - z.y;
    }
  });
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (dragType === "player" || dragType === "ball" || dragType === "zone") {
    dragTarget.x = x - dragOffsetX;
    dragTarget.y = y - dragOffsetY;
  } else if (dragType === "arrowStart") {
    dragTarget.fromX = x;
    dragTarget.fromY = y;
    if ('controlX' in dragTarget) {
      dragTarget.controlX = (dragTarget.fromX + dragTarget.toX) / 2;
      dragTarget.controlY = (dragTarget.fromY + dragTarget.toY) / 2;
    }
  } else if (dragType === "arrowEnd") {
    dragTarget.toX = x;
    dragTarget.toY = y;
    if ('controlX' in dragTarget) {
      dragTarget.controlX = (dragTarget.fromX + dragTarget.toX) / 2;
      dragTarget.controlY = (dragTarget.fromY + dragTarget.toY) / 2;
    }
  }

  draw();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});
canvas.addEventListener("mouseleave", () => {
  dragTarget = null;
});

draw();
