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

// === UI Enhancements ===
const toolbar = document.createElement("div");
toolbar.id = "toolbar";
toolbar.style.position = "fixed";
toolbar.style.bottom = "20px";
toolbar.style.left = "50%";
toolbar.style.transform = "translateX(-50%)";
toolbar.style.backgroundColor = "white";
toolbar.style.border = "1px solid #ccc";
toolbar.style.borderRadius = "10px";
toolbar.style.padding = "10px";
toolbar.style.display = "flex";
toolbar.style.gap = "10px";
toolbar.style.zIndex = 1000;
toolbar.innerHTML = `
  <label>Color: <input type="color" id="toolbar-color"></label>
  <label>Label: <input type="text" id="toolbar-label" maxlength="3"></label>
  <label>Zone Radius: <input type="range" id="toolbar-radius" min="20" max="200"></label>
`;
document.body.appendChild(toolbar);

document.getElementById("toolbar-color").addEventListener("input", e => {
  if (selectedElement && selectedElement.color !== undefined) {
    selectedElement.color = e.target.value;
    draw();
  }
});

document.getElementById("toolbar-label").addEventListener("input", e => {
  if (selectedElement && selectedElement.label !== undefined) {
    selectedElement.label = e.target.value;
    draw();
  }
});

document.getElementById("toolbar-radius").addEventListener("input", e => {
  if (selectedElement && selectedElement.radius !== undefined) {
    selectedElement.radius = parseInt(e.target.value);
    draw();
  }
});

// === Save/Load Functions ===
function savePlay() {
  const data = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball });
  localStorage.setItem("savedPlay", data);
  alert("Play saved.");
}

function loadPlay() {
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
}

function exportPlay() {
  // Temporarily hide control points
  const tempDraw = draw;
  draw = () => {
    drawBoard(true);
  };
  draw();

  const data = JSON.stringify({ redPlayers, bluePlayers, arrows, picks, zones, slides, ball });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lacrosse_play.json";
  a.click();
  URL.revokeObjectURL(url);

  draw = tempDraw;
  draw();
}

document.getElementById("save-play").addEventListener("click", savePlay);
document.getElementById("load-play").addEventListener("click", loadPlay);
document.getElementById("export-play").addEventListener("click", exportPlay);

// === Helper UI Toggle ===
function updateToolbarForSelection() {
  if (!selectedElement) return;
  if (selectedElement.color !== undefined) {
    document.getElementById("toolbar-color").value = selectedElement.color;
  }
  if (selectedElement.label !== undefined) {
    document.getElementById("toolbar-label").value = selectedElement.label;
  }
  if (selectedElement.radius !== undefined) {
    document.getElementById("toolbar-radius").value = selectedElement.radius;
  }
}

document.addEventListener("click", () => {
  updateToolbarForSelection();
});

// === Make Player Labels Editable on Click ===
canvas.addEventListener("dblclick", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (let player of [...redPlayers, ...bluePlayers]) {
    if (Math.hypot(player.x - x, player.y - y) < 15) {
      const name = prompt("Edit player label:", player.label || "");
      if (name !== null) {
        player.label = name;
        draw();
      }
      return;
    }
  }
});
