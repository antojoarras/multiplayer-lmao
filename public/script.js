const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let players = [];

document.addEventListener("fullscreenchange", () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
});

class Player {
  constructor(id, name, x, y, speed) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = 10;
    this.keys = {};
    this.movement = false;
    this.msg = '';
  }

  update() {
    if (this.keys["w"] || this.keys["W"]) {
      this.y -= this.speed;
      this.movement = true;
    }
    if (this.keys["s"] || this.keys["S"]) {
      this.y += this.speed;
      this.movement = true;
    }
    if (this.keys["a"] || this.keys["A"]) {
      this.x -= this.speed;
      this.movement = true;
    }
    if (this.keys["d"] || this.keys["D"]) {
      this.x += this.speed;
      this.movement = true;
    }

    if (this.movement) {
      socket.emit('playerUpdate', { id: this.id, x: this.x, y: this.y, name: this.name });
    }

    this.movement = false;
  }

  draw(isLocalPlayer, offsetX = 0, offsetY = 0) {
    ctx.beginPath();
    ctx.fillStyle = isLocalPlayer ? "blue" : "red";
    
    // Si es el jugador local, se dibuja en el centro
    if (isLocalPlayer) {
      ctx.arc(canvas.width / 2, canvas.height / 2, this.size, 0, 2 * Math.PI);
    } else {
      // Otros jugadores se dibujan con un offset relativo al jugador local
      ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, 2 * Math.PI);
    }
    
    ctx.fill();
    ctx.font = "14px Comic sans";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    
    // Dibujar el nombre del jugador
    const nameX = isLocalPlayer ? canvas.width / 2 : this.x + offsetX;
    const nameY = isLocalPlayer ? canvas.height / 2 - 15 : this.y + offsetY - 15;
    ctx.fillText(this.name, nameX, nameY);
    
    if (this.msg) {
      const msgY = nameY - 15;
      ctx.fillText(this.msg, nameX, msgY);
    }
    
    ctx.closePath();
  }
}

let name = prompt('Enter your name:');

if (!name) {
  name = "Guest #" + Math.floor(Math.random() * 1000000);
}

if (name.length > 20) name = name.substring(0, 20);

let player = new Player(socket.id, name, Math.random() * canvas.width, Math.random() * canvas.height, 5);

socket.emit('newPlayer', { id: socket.id, name: player.name, x: player.x, y: player.y });

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !player.keys["Enter"]) {
    let msg = prompt('Enter your message:');
    if (msg) {
      socket.emit("chat", [socket.id, msg] );
      player.msg = msg;
    }
  }

  player.keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  player.keys[event.key] = false;
});

socket.on('updatePlayers', (data) => {
  players = data.filter(p => p.id !== socket.id).map(p => new Player(p.id, p.name, p.x, p.y, 5));
});

socket.on('connection send', (name) => {
  alert(`${name} has connected!`);
});

socket.on('chat', (data) => {
  alert(data);
});

function draw(players) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const offsetX = canvas.width / 2 - player.x;
  const offsetY = canvas.height / 2 - player.y;

  // Dibujar a los otros jugadores
  players.forEach(p => p.draw(false, offsetX, offsetY));

  // Dibujar al jugador local
  player.draw(true);
}

function render() {
  player.update();
  draw(players);
  requestAnimationFrame(render);
}

render();
