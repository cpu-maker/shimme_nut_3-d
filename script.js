const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stats = document.getElementById("stats");
const restartBtn = document.getElementById("restartBtn");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = "square";
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

class Player {
    constructor(x, y, color, controls) {
        this.spawnX = x;
        this.spawnY = y;
        this.color = color;
        this.controls = controls;
        this.reset();
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.radius = 20;
        this.health = 100;
        this.cooldown = 0;
    }

    update(gamepad) {
        let dx = 0, dy = 0;

        // Keyboard
        if (keys[this.controls.up]) dy -= 1;
        if (keys[this.controls.down]) dy += 1;
        if (keys[this.controls.left]) dx -= 1;
        if (keys[this.controls.right]) dx += 1;

        // Gamepad
        if (gamepad) {
            dx += gamepad.axes[0];
            dy += gamepad.axes[1];
            if (gamepad.buttons[0].pressed) this.shoot();
        }

        this.x += dx * 5;
        this.y += dy * 5;

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        if (this.cooldown > 0) this.cooldown--;
        if (keys[this.controls.shoot]) this.shoot();
    }

    shoot() {
        if (this.cooldown > 0) return;
        bullets.push(new Bullet(this.x, this.y));
        this.cooldown = 15;
        playSound(400);
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 10;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -1;
    }

    update() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
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
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.radius = 18;
        this.speed = 2 + wave * 0.5;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

let players = [
    new Player(600, 900, "#3498db", {
        up: "w", down: "s", left: "a", right: "d", shoot: " "
    }),
    new Player(1300, 900, "#2ecc71", {
        up: "ArrowUp", down: "ArrowDown",
        left: "ArrowLeft", right: "ArrowRight",
        shoot: "/"
    })
];

let bullets = [];
let enemies = [];
let wave = 1;
let score = 0;
let gameOver = false;

function spawnWave() {
    for (let i = 0; i < wave * 5; i++) {
        enemies.push(new Enemy());
    }
}

function collision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

function update() {
    if (gameOver) return;

    const gamepads = navigator.getGamepads();

    players.forEach((p, i) => p.update(gamepads[i]));

    bullets.forEach(b => b.update());
    enemies.forEach(e => e.update());

    enemies.forEach((enemy, ei) => {
        players.forEach(player => {
            if (collision(player, enemy)) {
                player.health -= 10;
                playSound(120);
                if (player.health <= 0) gameOver = true;
            }
        });

        bullets.forEach((bullet, bi) => {
            if (collision(bullet, enemy)) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 10;
                playSound(800);
            }
        });
    });

    if (enemies.length === 0) {
        wave++;
        spawnWave();
    }

    stats.textContent = `Wave: ${wave} | Score: ${score} | P1 HP: ${players[0].health} | P2 HP: ${players[1].health}`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    players.forEach(p => p.draw());
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

restartBtn.onclick = () => location.reload();

spawnWave();
loop();
