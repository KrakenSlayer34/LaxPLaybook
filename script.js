document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username-input');
  const playbookTitle = document.getElementById('playbook-title');

  usernameInput.addEventListener('input', () => {
    playbookTitle.textContent = `${usernameInput.value || 'Your'}'s Playbook`;
  });

  const canvas = document.getElementById('field-canvas');
  const ctx = canvas.getContext('2d');

  // Placeholder: Example circle on field
  ctx.fillStyle = 'rgba(255,0,0,0.6)';
  ctx.beginPath();
  ctx.arc(500, 300, 20, 0, 2 * Math.PI);
  ctx.fill();

  document.getElementById('clear-board').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Additional event listeners and functionalities will be implemented here
});
