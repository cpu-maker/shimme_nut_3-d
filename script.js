const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stats = document.getElementById("stats");
const restartBtn = document.getElementById("restartBtn");

let keys = {};
let mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener("mousedown", () => mouse.down = true);
canvas.addEventListener("mouseup", () => mouse.down = false);

class Player {
    constructor() {
        this.radius = 20;
        this.reset();
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 6;
        this.health = 100;
        this.cooldown = 0;
    }

    update() {
        if (keys["w"]) this.y -= this.speed;
        if (keys["s"]) this.y += this.speed;
        if (keys["a"]) this.x -= this.speed;
        if (keys["d"]) this.x += this.speed;

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        if (this.cooldown > 0) this.cooldown--;

        if (mouse.down && this.cooldown <= 0) {
            bullets.push(new Bullet(this.x, this.y, mouse.x, mouse.y));
            this.cooldown = 8;
        }
    }

    draw() {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillStyle = "#3498db";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(0, -4, 32, 8);

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, tx, ty) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 14;

        const angle = Math.atan2(ty - y, tx - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor() {
        const edge = Math.floor(Math.random() * 4);

        if (edge === 0) { this.x = 0; this.y = Math.random() * canvas.height; }
        if (edge === 1) { this.x = canvas.width; this.y = Math.random() * canvas.height; }
        if (edge === 2) { this.x = Math.random() * canvas.width; this.y = 0; }
        if (edge === 3) { this.x = Math.random() * canvas.width; this.y = canvas.height; }

        this.radius = 18;
        this.speed = 2 + Math.random() * 1.5;
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    draw() {
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

let player = new Player();
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

function spawnEnemy() {
    enemies.push(new Enemy());
}

setInterval(() => {
    if (!gameOver) spawnEnemy();
}, 1000);

function collision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

function update() {
    if (gameOver) return;

    player.update();
    bullets.forEach(b => b.update());
    enemies.forEach(e => e.update());

    bullets = bullets.filter(b =>
        b.x > 0 && b.x < canvas.width &&
        b.y > 0 && b.y < canvas.height
    );

    enemies.forEach((enemy, ei) => {
        if (collision(player, enemy)) {
            player.health -= 1;
            if (player.health <= 0) endGame();
        }

        bullets.forEach((bullet, bi) => {
            if (collision(bullet, enemy)) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 10;
            }
        });
    });

    stats.textContent = `Health: ${player.health} | Score: ${score}`;
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    player.draw();
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    restartBtn.hidden = false;
}

restartBtn.addEventListener("click", () => {
    player.reset();
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
    restartBtn.hidden = true;
});

gameLoop();
