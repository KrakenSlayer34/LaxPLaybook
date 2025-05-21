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
    label: team === 'red' ? 'R' : 'B',
    visible: true
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  redPlayers.filter(p => p.visible).forEach(p => drawPlayer(p, 'red'));
  bluePlayers.filter(p => p.visible).forEach(p => drawPlayer(p, 'blue'));

  arrows.forEach(a => drawArrow(a));
  picks.forEach(p => drawPick(p));
  zones.forEach(z => drawZone(z));
  slides.forEach(s => drawSlide(s));

  if (ball) drawBall(ball);
}

function drawPlayer(player, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.label, player.x, player.y + 4);
}

function drawArrow(arrow) {
  ctx.strokeStyle = arrow.type === 'shot' ? 'red' : 'black';
  ctx.lineWidth = 2;
  ctx.setLineDash(arrow.type === 'dashed' ? [10, 5] : []);
  ctx.beginPath();
  ctx.moveTo(arrow.x1, arrow.y1);
  ctx.quadraticCurveTo(arrow.cpX, arrow.cpY, arrow.x2, arrow.y2);
  ctx.stroke();
  drawArrowhead(arrow.cpX, arrow.cpY, arrow.x2, arrow.y2, 10, ctx.strokeStyle);
  ctx.setLineDash([]);
}

function drawSlide(slide) {
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(slide.x1, slide.y1);
  ctx.quadraticCurveTo(slide.cpX, slide.cpY, slide.x2, slide.y2);
  ctx.stroke();
  drawArrowhead(slide.cpX, slide.cpY, slide.x2, slide.y2);
  ctx.fillStyle = "black";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(slide.label, slide.x2 + 10, slide.y2);
}

function drawPick(pick) {
  ctx.strokeStyle = "purple";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pick.x, pick.y, pick.radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawZone(zone) {
  ctx.fillStyle = "rgba(128,0,128,0.3)";
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall(ball) {
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  ctx.fill();
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
  a.click();
  URL.revokeObjectURL(url);
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

draw();
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Zones
  for (const zone of zones) {
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "green";
    ctx.stroke();
  }

  // Draw Picks
  for (const pick of picks) {
    ctx.beginPath();
    ctx.arc(pick.x, pick.y, pick.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw Arrows
  for (const arrow of arrows) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    if (arrow.type === "dashed") {
      ctx.setLineDash([10, 5]);
    } else if (arrow.type === "shot") {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "red";
    } else {
      ctx.setLineDash([]);
    }

    ctx.moveTo(arrow.x1, arrow.y1);
    ctx.quadraticCurveTo(arrow.cpX, arrow.cpY, arrow.x2, arrow.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowhead(
      arrow.cpX,
      arrow.cpY,
      arrow.x2,
      arrow.y2,
      10,
      ctx.strokeStyle
    );

    // Draw control point for curves
    ctx.beginPath();
    ctx.arc(arrow.cpX, arrow.cpY, controlPointSize, 0, 2 * Math.PI);
    ctx.fillStyle = "purple";
    ctx.fill();
  }

  // Draw Slides
  for (const slide of slides) {
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.setLineDash([10, 5]);
    ctx.moveTo(slide.x1, slide.y1);
    ctx.quadraticCurveTo(slide.cpX, slide.cpY, slide.x2, slide.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowhead(
      slide.cpX,
      slide.cpY,
      slide.x2,
      slide.y2,
      10,
      "blue"
    );

    // Draw slide label
    const labelX = (slide.x1 + slide.x2) / 2;
    const labelY = (slide.y1 + slide.y2) / 2;
    ctx.fillStyle = "blue";
    ctx.font = "16px Arial";
    ctx.fillText(slide.label, labelX, labelY);

    // Draw control point
    ctx.beginPath();
    ctx.arc(slide.cpX, slide.cpY, controlPointSize, 0, 2 * Math.PI);
    ctx.fillStyle = "purple";
    ctx.fill();
  }

  // Draw Players
  const drawPlayers = (players, color) => {
    for (const player of players) {
      if (!player.visible) continue;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(player.label, player.x, player.y);
    }
  };

  drawPlayers(redPlayers, "red");
  drawPlayers(bluePlayers, "blue");

  // Draw Ball
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Zones
  for (const zone of zones) {
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "green";
    ctx.stroke();
  }

  // Draw Picks
  for (const pick of picks) {
    ctx.beginPath();
    ctx.arc(pick.x, pick.y, pick.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw Arrows
  for (const arrow of arrows) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    if (arrow.type === "dashed") {
      ctx.setLineDash([10, 5]);
    } else if (arrow.type === "shot") {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "red";
    } else {
      ctx.setLineDash([]);
    }

    ctx.moveTo(arrow.x1, arrow.y1);
    ctx.quadraticCurveTo(arrow.cpX, arrow.cpY, arrow.x2, arrow.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowhead(
      arrow.cpX,
      arrow.cpY,
      arrow.x2,
      arrow.y2,
      10,
      ctx.strokeStyle
    );

    // Draw control point for curves
    ctx.beginPath();
    ctx.arc(arrow.cpX, arrow.cpY, controlPointSize, 0, 2 * Math.PI);
    ctx.fillStyle = "purple";
    ctx.fill();
  }

  // Draw Slides
  for (const slide of slides) {
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.setLineDash([10, 5]);
    ctx.moveTo(slide.x1, slide.y1);
    ctx.quadraticCurveTo(slide.cpX, slide.cpY, slide.x2, slide.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowhead(
      slide.cpX,
      slide.cpY,
      slide.x2,
      slide.y2,
      10,
      "blue"
    );

    // Draw slide label
    const labelX = (slide.x1 + slide.x2) / 2;
    const labelY = (slide.y1 + slide.y2) / 2;
    ctx.fillStyle = "blue";
    ctx.font = "16px Arial";
    ctx.fillText(slide.label, labelX, labelY);

    // Draw control point
    ctx.beginPath();
    ctx.arc(slide.cpX, slide.cpY, controlPointSize, 0, 2 * Math.PI);
    ctx.fillStyle = "purple";
    ctx.fill();
  }

  // Draw Players
  const drawPlayers = (players, color) => {
    for (const player of players) {
      if (!player.visible) continue;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(player.label, player.x, player.y);
    }
  };

  drawPlayers(redPlayers, "red");
  drawPlayers(bluePlayers, "blue");

  // Draw Ball
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();
  }
}

