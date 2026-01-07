// ================= CONFIG =================
const CONFIG = {
    PLAYER_SPEED: 6,
    FIRE_COOLDOWN: 200,
    BULLET_SPEED: 8,
    SHAPE_MIN_SPEED: 2,
    SHAPE_MAX_SPEED: 4,
    SHAPE_SIZE: 30,
    SPAWN_BASE: 800,
    SPAWN_MIN: 300
};

// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ================= GAME STATE =================
const GAME_STATE = {
    HOME: "HOME",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED"
};

let currentState = GAME_STATE.HOME;

// ================= UI =================
const homeUI = document.getElementById("homeUI");
const startBtn = document.getElementById("startBtn");
const scoreboard = document.getElementById("scoreboard");

let highScore = Number(localStorage.getItem("highScore")) || 0;
scoreboard.textContent = `HIGH SCORE: ${highScore}`;

startBtn.onclick = () => {
    currentState = GAME_STATE.PLAYING;
    homeUI.style.display = "none";
    startGame();
};

// ================= GAME LOOP =================
let lastTime = 0;

function gameLoop(timestamp) {
    const delta = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentState === GAME_STATE.PLAYING) {
        update(delta);
    }

    render();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ================= PLAYER =================
const player = {
    width: 40,
    height: 20,
    x: 0,
    y: 0,
    fireCooldown: 0
};

function resetPlayer() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
}

let moveLeft = false;
let moveRight = false;
let spaceHeld = false;

// ================= BULLETS =================
const bullets = [];

function shoot() {
    if (player.fireCooldown > 0) return;

    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: CONFIG.BULLET_SPEED
    });

    player.fireCooldown = CONFIG.FIRE_COOLDOWN;
}

// ================= ENEMIES =================
const shapes = [];
let spawnTimer = 0;

function spawnShape() {
    shapes.push({
        x: Math.random() * (canvas.width - CONFIG.SHAPE_SIZE),
        y: -CONFIG.SHAPE_SIZE,
        size: CONFIG.SHAPE_SIZE,
        speed:
            CONFIG.SHAPE_MIN_SPEED +
            Math.random() * (CONFIG.SHAPE_MAX_SPEED - CONFIG.SHAPE_MIN_SPEED)
    });
}

// ================= GAME CONTROL =================
let score = 0;

function startGame() {
    score = 0;
    spawnTimer = 0;
    bullets.length = 0;
    shapes.length = 0;
    moveLeft = false;
    moveRight = false;
    spaceHeld = false;
    resetPlayer();
}

function endGame() {
    currentState = GAME_STATE.HOME;
    homeUI.style.display = "flex";

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    scoreboard.textContent = `HIGH SCORE: ${highScore}`;
}

// ================= INPUT =================
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyP") {
        if (currentState === GAME_STATE.PLAYING) {
            currentState = GAME_STATE.PAUSED;
            moveLeft = false;
            moveRight = false;
        } else if (currentState === GAME_STATE.PAUSED) {
            currentState = GAME_STATE.PLAYING;
        }
        return;
    }

    if (currentState !== GAME_STATE.PLAYING) return;

    if (e.code === "ArrowLeft") moveLeft = true;
    if (e.code === "ArrowRight") moveRight = true;

    if (e.code === "Space" && !spaceHeld) {
        shoot();
        spaceHeld = true;
    }
});

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") moveLeft = false;
    if (e.code === "ArrowRight") moveRight = false;
    if (e.code === "Space") spaceHeld = false;
});

// ================= UPDATE =================
function update(delta) {
    player.fireCooldown -= delta;
    if (player.fireCooldown < 0) player.fireCooldown = 0;

    if (moveLeft) player.x -= CONFIG.PLAYER_SPEED;
    if (moveRight) player.x += CONFIG.PLAYER_SPEED;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    spawnTimer += delta;
    const spawnInterval = Math.max(
        CONFIG.SPAWN_MIN,
        CONFIG.SPAWN_BASE - score * 10
    );

    if (spawnTimer >= spawnInterval) {
        spawnShape();
        spawnTimer -= spawnInterval;
    }

    bullets.forEach(b => b.y -= b.speed * (delta / 16.67));
    shapes.forEach(s => s.y += s.speed * (delta / 16.67));

    checkCollisions();

    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

// ================= COLLISION =================
function rectHit(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.width > b.x &&
        a.y < b.y + b.size &&
        a.y + a.height > b.y
    );
}

function checkCollisions() {
    for (let i = shapes.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (rectHit(bullets[j], shapes[i])) {
                shapes.splice(i, 1);
                bullets.splice(j, 1);
                score++;
                return;
            }
        }

        if (shapes[i].y + shapes[i].size >= canvas.height) {
            endGame();
            return;
        }
    }
}

// ================= RENDER =================
function render() {
    ctx.fillStyle = "#00ff00";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillRect(player.x, player.y, player.width, player.height);

    bullets.forEach(b =>
        ctx.fillRect(b.x, b.y, b.width, b.height)
    );

    shapes.forEach(s =>
        ctx.fillRect(s.x, s.y, s.size, s.size)
    );

    ctx.fillText(`SCORE: ${score}`, 20, 30);
    ctx.fillText(`STATE: ${currentState}`, canvas.width - 140, 10);

    if (currentState === GAME_STATE.PAUSED) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }

    if (currentState === GAME_STATE.HOME && score > 0) {
        ctx.textAlign = "center";
        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 - 20
        );
    }
}
