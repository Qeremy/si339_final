// Get HTML elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const controlBtn = document.getElementById('control-btn');

const unlockThreshold = 30;
let score = 0;
const gameSpeed = 15;
let gameInterval;
let obstacleInterval;
const gravity = 0.8;

// Game state options: "idle", "running", "paused", "failed", "passed"
let gameState = "idle";

// Player starts with 3 lives
let lives = 3;

// Variables for the win animation
let winAnimationStart = null;
let winAnimationRequestId = null;

// Player configuration (drawn as a triangle)
const player = {
  x: 50,
  y: canvas.height - 50, // ground level with 10px padding from bottom
  width: 20,
  height: 20,
  dy: 0,
  jumpForce: 10,
  grounded: true
};

// Obstacle configuration (drawn as semicircles)
let obstacles = [];
const obstacleWidth = 30;
const obstacleHeight = 30;
const obstacleFrequency = 1100; // New obstacle every 1300ms

// Control Button click handler—its function depends on gameState.
controlBtn.addEventListener('click', function() {
  if (gameState === "idle" || gameState === "failed") {
    startGame();
  } else if (gameState === "running") {
    pauseGame();
  } else if (gameState === "paused") {
    resumeGame();
  } else if (gameState === "passed") {
    window.location.href = "page2.html"; // Update URL as needed
  }
});

// Listen for keydown events for Space key
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === "idle" || gameState === "failed") {
      startGame();
    } else if (gameState === "running" && player.grounded) {
      player.dy = -player.jumpForce;
      player.grounded = false;
    }
  }
});

// Update the text of the control button based on game state.
function updateControlButton() {
  if (gameState === "idle") {
    controlBtn.textContent = "Start Game";
  } else if (gameState === "running") {
    controlBtn.textContent = "Pause Game";
  } else if (gameState === "paused") {
    controlBtn.textContent = "Continue Game";
  } else if (gameState === "failed") {
    controlBtn.textContent = "Restart Game";
  } else if (gameState === "passed") {
    controlBtn.textContent = "Next Page";
  }
}

// Draw the lives (hearts) as black text in the top right corner.
function drawLives() {
  ctx.font = '20px Arial';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'black'; // Ensure hearts are drawn in black.
  let hearts = "";
  for (let i = 0; i < lives; i++) {
    hearts += "♥ ";
  }
  ctx.fillText("Lives: " + hearts, canvas.width - 10, 25);
}

// Start (or restart) the game.
function startGame() {
  // If starting afresh, reset lives; if restarting after a life loss, keep current lives.
  if (gameState !== "failed") {
    lives = 3;
  }
  score = 0;
  obstacles = [];
  // Reset win animation variables in case of restart.
  winAnimationStart = null;
  if (winAnimationRequestId) {
    cancelAnimationFrame(winAnimationRequestId);
    winAnimationRequestId = null;
  }
  // Set player's ground position (10px padding from bottom)
  player.y = canvas.height - player.height - 10;
  player.dy = 0;
  player.grounded = true;
  
  gameState = "running";
  updateControlButton();
  
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  gameInterval = setInterval(update, 20);
  obstacleInterval = setInterval(createObstacle, obstacleFrequency);
}

// Pause the game.
function pauseGame() {
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  gameState = "paused";
  updateControlButton();
}

// Resume the game.
function resumeGame() {
  gameState = "running";
  updateControlButton();
  gameInterval = setInterval(update, 20);
  obstacleInterval = setInterval(createObstacle, obstacleFrequency);
}

// Create a new obstacle.
function createObstacle() {
  obstacles.push({
    x: canvas.width,
    y: canvas.height - obstacleHeight - 10, // align with ground
    width: obstacleWidth,
    height: obstacleHeight
  });
}

// Main game loop.
function update() {
  // Clear the canvas.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the lives in the top right.
  drawLives();
  
  // Draw the score in the top left.
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'black';
  ctx.fillText("Score: " + Math.floor(score), 10, 25);
  
  // Draw the player as a triangle.
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width, player.y + player.height / 2);
  ctx.lineTo(player.x, player.y);
  ctx.closePath();
  ctx.fill();
  
  // Update the player's position with gravity.
  player.y += player.dy;
  if (player.y + player.height < canvas.height - 10) {
    player.dy += gravity;
  } else {
    player.y = canvas.height - player.height - 10;
    player.dy = 0;
    player.grounded = true;
  }
  
  // Update and draw obstacles as semicircles.
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    // Calculate the center of the semicircle.
    let cx = obs.x + obs.width / 2;
    let cy = canvas.height - 10; // ground line
    let r = obs.width / 2;
    // Draw the top half of a circle.
    ctx.arc(cx, cy, r, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    
    // Approximate collision detection (bounding box).
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < cy - r + r &&
      player.y + player.height > cy - r
    ) {
      handleCollision();
      return; // Stop further updates on collision.
    }
  }
  
  // Remove obstacles that have left the screen.
  obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
  
  // Increase score over time.
  score += 0.05;
  
  // Check if the score threshold is reached.
  if (score >= unlockThreshold) {
    gamePassed();
  }
}

// Handle collision: subtract a life and either allow a restart or hide the game.
function handleCollision() {
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  lives -= 1;
  if (lives > 0) {
    alert("Ouch! You lost a life. " + lives + " remaining.");
    // Set state to "failed" so the control button shows "Restart Game".
    gameState = "failed";
    updateControlButton();
  } else {
    alert("No more lives! Game over.");
    document.getElementById('game-section').style.display = 'none';
  }
}

// Handle success: score threshold reached.
function gamePassed() {
  clearInterval(gameInterval);
  clearInterval(obstacleInterval);
  gameState = "passed";
  updateControlButton();
  // Instead of an alert, start the win animation.
  winAnimationRequestId = requestAnimationFrame(animateWin);
}

// Animate the WIN text (red, bold, bouncing up and down a little).
function animateWin(timestamp) {
  if (!winAnimationStart) {
    winAnimationStart = timestamp;
  }
  const progress = timestamp - winAnimationStart;
  
  // Clear the canvas.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw static elements (lives and score) in black.
  drawLives();
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'black';
  ctx.fillText("Score: " + Math.floor(score), 10, 25);
  
  // Calculate a small vertical offset for the bounce effect (±3 pixels).
  const amplitude = 3;
  // Use a faster oscillation (divide progress appropriately).
  const offset = Math.sin(progress / 200) * amplitude;
  
  // Determine a base Y so the WIN text is lower; here we offset from the vertical center.
  const baseY = canvas.height / 2 + 20;
  
  // Draw the WIN text centered horizontally.
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  ctx.fillText("WIN", canvas.width / 2, baseY + offset);
  
  // Continue the animation.
  winAnimationRequestId = requestAnimationFrame(animateWin);
}
