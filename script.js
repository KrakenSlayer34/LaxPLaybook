const canvas = document.getElementById('field-canvas');
const ctx = canvas.getContext('2d');

const modeSelect = document.getElementById('mode-select');

const redPlayers = [];
const bluePlayers = [];
let ball = null;
const arrows = [];
const picks = [];

let zone = null; // {x, y, radius}

let showRed = true;
let showBlue = true;

const PLAYER_RADIUS = 15;
const BALL_RADIUS = 10;
const ZONE_MIN_RADIUS = 30;

let dragTarget = null;
let dragType = null; // 'redPlayer', 'bluePlayer', 'arrowStart', 'arrowEnd', 'zoneCenter', 'zoneEdge'
let dragOffsetX = 0;
let dragOffsetY = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw zone first if exists
  if (zone) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(128, 0, 128, 0.2)'; // light purple, semi-transparent
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 2;
    ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Draw picks
  picks.forEach(p => drawPick(p));

  // Draw arrows
  arrows.forEach(a => drawArrow(a));

  // Draw ball
  if (ball) {
    drawBall(ball.x, ball.y);
  }

  // Draw players on top
  if (showRed) {
    redPlayers.forEach(p => drawPlayer(p.x, p.y, 'red'));
  }

  if (showBlue) {
    bluePlayers.forEach(p => drawPlayer(p.x, p.y, 'blue'));
  }
}

function drawPlayer(x, y, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.arc(x, y, PLAYER_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function drawBall(x, y) {
  ctx.beginPath();
  ctx.fillStyle = 'orange';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function drawArrow({ fromX, fromY, toX, toY, dashed }) {
  ctx.beginPath();
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 3;
  if (dashed) {
    ctx.setLineDash([10, 5]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = 'green';
  ctx.fill();
  ctx.setLineDash([]);
}

function drawPick({ x1, y1, x2, y2 }) {
  ctx.beginPath();
  ctx.strokeStyle = 'purple';
  ctx.lineWidth = 4;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function randomPosition() {
  const margin = 50;
  return {
    x: Math.random() * (canvas.width - 2 * margin) + margin,
    y: Math.random() * (canvas.height - 2 * margin) + margin,
  };
}

// Hit detection helpers

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function findPlayerAt(x, y, team) {
  const players = team === 'red' ? redPlayers : bluePlayers;
  return players.find(p => distance(p.x, p.y, x, y) <= PLAYER_RADIUS);
}

function findArrowEndpointAt(x, y) {
  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    if (distance(a.fromX, a.fromY, x, y) <= 10) return { arrow: a, type: 'start' };
    if (distance(a.toX, a.toY, x, y) <= 10) return { arrow: a, type: 'end' };
  }
  return null;
}

function isInZoneCenter(x, y) {
  if (!zone) return false;
  return distance(x, y, zone.x, zone.y) <= zone.radius;
}

function isOnZoneEdge(x, y) {
  if (!zone) return false;
  const dist = distance(x, y, zone.x, zone.y);
  return Math.abs(dist - zone.radius) <= 10;
}

// Mouse handling

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Check zone edge first (resize)
  if (zone && isOnZoneEdge(mouseX, mouseY)) {
    dragTarget = zone;
    dragType = 'zoneEdge';
    return;
  }

  // Check zone center (move)
  if (zone && isInZoneCenter(mouseX, mouseY)) {
    dragTarget = zone;
    dragType = 'zoneCenter';
    dragOffsetX = mouseX - zone.x;
    dragOffsetY = mouseY - zone.y;
    return;
  }

  // Check players red
  if (showRed) {
    for (let p of redPlayers) {
      if (distance(mouseX, mouseY, p.x, p.y) <= PLAYER_RADIUS) {
        dragTarget = p;
        dragType = 'redPlayer';
        dragOffsetX = mouseX - p.x;
        dragOffsetY = mouseY - p.y;
        return;
      }
    }
  }

  // Check players blue
  if (showBlue) {
    for (let p of bluePlayers) {
      if (distance(mouseX, mouseY, p.x, p.y) <= PLAYER_RADIUS) {
        dragTarget = p;
        dragType = 'bluePlayer';
        dragOffsetX = mouseX - p.x;
        dragOffsetY = mouseY - p.y;
        return;
      }
    }
  }

  // Check ball
  if (ball && distance(mouseX, mouseY, ball.x, ball.y) <= BALL_RADIUS) {
    dragTarget = ball;
    dragType = 'ball';
    dragOffsetX = mouseX - ball.x;
    dragOffsetY = mouseY - ball.y;
    return;
  }

  // Check arrow endpoints
  const arrowHit = findArrowEndpointAt(mouseX, mouseY);
  if (arrowHit) {
    dragTarget = arrowHit.arrow;
    dragType = arrowHit.type === 'start' ? 'arrowStart' : 'arrowEnd';
    dragOffsetX = mouseX - (dragType === 'arrowStart' ? dragTarget.fromX : dragTarget.toX);
    dragOffsetY = mouseY - (dragType === 'arrowStart' ? dragTarget.fromY : dragTarget.toY);
    return;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (dragType === 'redPlayer' || dragType === 'bluePlayer') {
    dragTarget.x = mouseX - dragOffsetX;
    dragTarget.y = mouseY - dragOffsetY;
  } else if (dragType === 'ball') {
    dragTarget.x = mouseX - dragOffsetX;
    dragTarget.y = mouseY - dragOffsetY;
  } else if (dragType === 'arrowStart') {
    dragTarget.fromX = mouseX - dragOffsetX;
    dragTarget.fromY = mouseY - dragOffsetY;
  } else if (dragType === 'arrowEnd') {
    dragTarget.toX = mouseX - dragOffsetX;
    dragTarget.toY = mouseY - dragOffsetY;
  } else if (dragType === 'zoneCenter') {
    dragTarget.x = mouseX - dragOffsetX;
    dragTarget.y = mouseY - dragOffsetY;
  } else if (dragType === 'zoneEdge') {
    // Calculate new radius
    const newRadius = distance(mouseX, mouseY, zone.x, zone.y);
    zone.radius = Math.max(newRadius, ZONE_MIN_RADIUS);
  }
  draw();
});

canvas.addEventListener('mouseup', () => {
  dragTarget = null;
  dragType = null;
});

canvas.addEventListener('mouseleave', () => {
  dragTarget = null;
  dragType = null;
});

// Button functionality

document.getElementById('add-red-player').addEventListener('click', () => {
  const pos = randomPosition();
  redPlayers.push(pos);
  draw();
});

document.getElementById('add-blue-player').addEventListener('click', () => {
  const pos = randomPosition();
  bluePlayers.push(pos);
  draw();
});

document.getElementById('toggle-red-team').addEventListener('click', () => {
  showRed = !showRed;
  draw();
});

document.getElementById('toggle-blue-team').addEventListener('click', () => {
  showBlue = !showBlue;
  draw();
});

document.getElementById('add-ball').addEventListener('click', () => {
  ball = randomPosition();
  draw();
});

document.getElementById('add-solid-arrow').addEventListener('click', () => {
  if (redPlayers.length === 0 || bluePlayers.length === 0) {
    alert('Need at least one red and one blue player to add an arrow');
    return;
  }
  const from = redPlayers[Math.floor(Math.random() * redPlayers.length)];
  const to = bluePlayers[Math.floor(Math.random() * bluePlayers.length)];
  arrows.push({ fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, dashed: false });
  draw();
});

document.getElementById('add-dashed-arrow').addEventListener('click', () => {
  if (redPlayers.length === 0 || bluePlayers.length === 0) {
    alert('Need at least one red and one blue player to add an arrow');
    return;
  }
  const from = redPlayers[Math.floor(Math.random() * redPlayers.length)];
  const to = bluePlayers[Math.floor(Math.random() * bluePlayers.length)];
  arrows.push({ fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, dashed: true });
  draw();
});

document.getElementById('add-pick').addEventListener('click', () => {
  let team = null;
  if (redPlayers.length >= 2) team = redPlayers;
  else if (bluePlayers.length >= 2) team = bluePlayers;
  else {
    alert('Need at least two players on a team to add a pick');
    return;
  }
  const idx1 = Math.floor(Math.random() * team.length);
  let idx2 = Math.floor(Math.random() * team.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * team.length);
  }
  const p1 = team[idx1];
  const p2 = team[idx2];
  picks.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  draw();
});

document.getElementById('add-zone').addEventListener('click', () => {
  // If zone exists, just do nothing or replace
  zone = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 100,
  };
  draw();
});

document.getElementById('clear-board').addEventListener('click', () => {
  redPlayers.length = 0;
  bluePlayers.length = 0;
  ball = null;
  arrows.length = 0;
  picks.length = 0;
  zone = null;
  draw();
});

document.getElementById('save-play').addEventListener('click', () => {
  const playData = {
    redPlayers,
    bluePlayers,
    ball,
    arrows,
    picks,
    zone,
  };
  localStorage.setItem('savedPlay', JSON.stringify(playData));
  alert('Play saved!');
});

document.getElementById('load-play').addEventListener('click', () => {
  const saved = localStorage.getItem('savedPlay');
  if (!saved) {
    alert('No saved play found');
    return;
  }
  const playData = JSON.parse(saved);
  redPlayers.length = 0;
  bluePlayers.length = 0;
  arrows.length = 0;
  picks.length = 0;

  redPlayers.push(...playData.redPlayers);
  bluePlayers.push(...playData.bluePlayers);
  ball = playData.ball;
  arrows.push(...playData.arrows);
  picks.push(...playData.picks);
  zone = playData.zone || null;
  draw();
});

document.getElementById('export-play').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'lacrosse-play.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

draw();


