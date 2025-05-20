const canvas = document.getElementById('field-canvas');
const ctx = canvas.getContext('2d');

const modeSelect = document.getElementById('mode-select');
const usernameInput = document.getElementById('username-input');

const redPlayers = [];
const bluePlayers = [];
let ball = null;
const arrows = [];
const picks = [];

let showRed = true;
let showBlue = true;

const PLAYER_RADIUS = 15;
const BALL_RADIUS = 10;

// Helper to redraw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw zones, shots, slides if implemented (placeholders)
  // For now, just draw players, ball, arrows, picks.

  if (showRed) {
    redPlayers.forEach(p => drawPlayer(p.x, p.y, 'red'));
  }

  if (showBlue) {
    bluePlayers.forEach(p => drawPlayer(p.x, p.y, 'blue'));
  }

  if (ball) {
    drawBall(ball.x, ball.y);
  }

  arrows.forEach(a => drawArrow(a));
  picks.forEach(p => drawPick(p));
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
  const headlen = 10; // length of head in pixels
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

// Utility to get random position on canvas, inside margins
function randomPosition() {
  const margin = 50;
  return {
    x: Math.random() * (canvas.width - 2 * margin) + margin,
    y: Math.random() * (canvas.height - 2 * margin) + margin,
  };
}

// Add red player
document.getElementById('add-red-player').addEventListener('click', () => {
  const pos = randomPosition();
  redPlayers.push(pos);
  draw();
});

// Add blue player
document.getElementById('add-blue-player').addEventListener('click', () => {
  const pos = randomPosition();
  bluePlayers.push(pos);
  draw();
});

// Toggle red team visibility
document.getElementById('toggle-red-team').addEventListener('click', () => {
  showRed = !showRed;
  draw();
});

// Toggle blue team visibility
document.getElementById('toggle-blue-team').addEventListener('click', () => {
  showBlue = !showBlue;
  draw();
});

// Add ball
document.getElementById('add-ball').addEventListener('click', () => {
  ball = randomPosition();
  draw();
});

// Add solid arrow: For demo, arrow from random red to random blue player if exist
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

// Add dashed arrow (same logic but dashed)
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

// Add pick: draw a purple line between two random red players or blue players if possible
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

// Clear board
document.getElementById('clear-board').addEventListener('click', () => {
  redPlayers.length = 0;
  bluePlayers.length = 0;
  ball = null;
  arrows.length = 0;
  picks.length = 0;
  draw();
});

// Save play to localStorage
document.getElementById('save-play').addEventListener('click', () => {
  const playData = {
    redPlayers,
    bluePlayers,
    ball,
    arrows,
    picks,
  };
  localStorage.setItem('savedPlay', JSON.stringify(playData));
  alert('Play saved!');
});

// Load play from localStorage
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
  draw();
});

// Export play as image
document.getElementById('export-play').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'lacrosse-play.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

draw(); // initial draw to clear canvas

