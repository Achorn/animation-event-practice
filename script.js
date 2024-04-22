const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let score = 0;
let gameOver = false;
ctx.font = "50px Impact";
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;

let ravens = [];

class Raven {
  constructor() {
    this.image = new Image();
    this.image.src = "./assets/birb.png";
    // Sizing of sprite
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    // Positions of sprite
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    // Sprite movement
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    // Animation variables
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = 50;
    // Garbage collection help
    this.markedForDeletion = false;
    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color =
      "rgb(" +
      this.randomColors[0] +
      "," +
      this.randomColors[1] +
      "," +
      this.randomColors[2] +
      ")";
    this.hasTrail = Math.random() > 0.5;
  }

  update(deltaTime) {
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY = this.directionY * -1;
    }
    this.x -= this.directionX;
    this.y += this.directionY;

    if (this.x < 0 - this.width) this.markedForDeletion = true;

    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
      if (this.hasTrail) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(this.x, this.y, this.width, this.color));
        }
      }
    }
    if (this.x < 0 - this.width) gameOver = true;
  }
  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

let explosions = [];
class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "./assets/boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = "./assets/penguin_RIP.wav";
    this.timeSinceLastFrame = 0;
    this.frameInterval = 100;
    this.markedForDeletion = false;
  }
  update(deltaTime) {
    if (this.frame === 0) this.sound.play();
    this.timeSinceLastFrame += deltaTime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;

      if (this.frame > 5) this.markedForDeletion = true;
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y - this.size / 4,
      this.size,
      this.size
    );
  }
}

let particles = [];
class Particle {
  constructor(x, y, size, color) {
    this.size = size;
    this.x = x + this.size / 2;
    this.y = y + this.size / 2;
    this.radius = (Math.random() * this.size) / 10; //growing in size
    this.maxRadius = Math.random() * 20 + 35; //when to remove
    this.markedForDeletion = false;
    this.speedX = Math.random() * 1 + 0.5; //slowly drift to the right
    this.color = color;
  }
  update() {
    this.x += this.speedX;
    this.radius += 0.2;
    if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 1 - this.radius / this.maxRadius;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); //circle
    ctx.fill();
    ctx.restore();
  }
}

const drawScore = () => {
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 50, 75);
};
const drawGameOver = () => {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText(
    "Game Over , your score is " + score,
    canvas.width / 2,
    canvas.height / 2
  );
};
window.addEventListener("click", (e) => {
  const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  const pc = detectPixelColor.data;
  ravens.forEach((raven) => {
    if (
      raven.randomColors[0] === pc[0] &&
      raven.randomColors[1] === pc[1] &&
      raven.randomColors[0] === pc[0]
    ) {
      raven.markedForDeletion = true;
      score++;
      explosions.push(new Explosion(raven.x, raven.y, raven.width));
    }
  });
});

const animate = (timestamp) => {
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;
  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToNextRaven = 0;
    ravens.sort((a, b) => a.width - b.width);
  }

  //array literal with spread operator
  drawScore();
  [...particles, ...ravens, ...explosions].forEach((object) =>
    object.update(deltaTime)
  );
  [...particles, ...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);
  explosions = explosions.filter((object) => !object.markedForDeletion);

  particles = particles.filter((object) => !object.markedForDeletion);
  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
};
animate(0);
