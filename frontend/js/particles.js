const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.radius = Math.random() * 2.2 + 0.4;

    this.speedX = (Math.random() - 0.5) * 0.25;
    this.speedY = (Math.random() - 0.5) * 0.25;

    this.opacity = Math.random() * 0.7 + 0.2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;

    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle =
      `rgba(255, 200, 80, ${this.opacity})`;

    ctx.fill();
  }
}

function initParticles() {
  particles = [];

  for (let i = 0; i < 260; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animateParticles);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

initParticles();
animateParticles();