const socket = io();
const canvas = document.getElementById('gameCanvas');
const btn = document.getElementById('button');
const inp = document.getElementById('input');
const cht = document.getElementById('chat');
const txt = document.getElementById('textPlace');
const dv = document.getElementById('chatArea');
const ctx = canvas.getContext('2d');

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let players = [];
let msgs = [];
let started = false;
const MSGTIMEOUT = 300;

document.addEventListener("fullscreenchange", () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
});

class Player {
  constructor(id, name, x, y, speed, msg='') {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = 10;
    this.keys = {};
    this.movement = false;
    this.msg = msg;
    this.msgTimeout = 0
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
      socket.emit('playerUpdate', { id: this.id, x: this.x, y: this.y, name: this.name, msg: this.msg });
    }
    this.movement = false;
    
    if (this.msgTimeout > 0 && this.msg) {
      this.msgTimeout--
    } else this.msg = ''
  }

  draw(isLocalPlayer, offsetX = 0, offsetY = 0) {
    ctx.beginPath();
    ctx.fillStyle = isLocalPlayer ? "blue" : "red";

    if (isLocalPlayer) {
      ctx.arc(canvas.width / 2, canvas.height / 2, this.size, 0, 2 * Math.PI);
    } else {
      ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, 2 * Math.PI);
    }

    ctx.fill();
    ctx.font = "14px Comic Sans MS";
    ctx.fillStyle = "black";
    if (isLocalPlayer) {
      ctx.fillStyle = "rgba(200, 200, 200, 0.75)";
      let textX = `X: ${Math.floor(this.x * 10) / 10}`;
      let textY = `Y: ${Math.floor(this.y * 10) / 10}`;
      let textMetricsX = ctx.measureText(textX);
      let textMetricsY = ctx.measureText(textY);
      let rectWidth = Math.max(textMetricsX.width, textMetricsY.width) + 20;
      let rectHeight = 40;
      ctx.beginPath();
      ctx.rect(0, 0, rectWidth, rectHeight);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.textAlign = "left";
      ctx.textBaseline = 'top';
      ctx.fillText(textX, 5, 5);
      ctx.fillText(textY, 5, 20);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';

    const nameX = isLocalPlayer ? canvas.width / 2 : this.x + offsetX;
    const nameY = isLocalPlayer ? canvas.height / 2 - 15 : this.y + offsetY - 15;
    ctx.fillText(this.name, nameX, nameY);

    if (this.msg) {
      const msgY = nameY - 15;
      const padding = 2;
      ctx.font = "14px Comic Sans MS";
      let dimensions = ctx.measureText(this.msg);
      const textHeight = 14;
      ctx.fillStyle = "rgba(200,200,200,0.5)";
      ctx.fillRect(
        nameX - (dimensions.width / 2) - padding,
        msgY - (textHeight / 2) - padding,
        dimensions.width + padding * 2,
        textHeight + padding * 2
      );
      ctx.fillStyle = "black";
      ctx.fillText(this.msg, nameX, msgY);
    }
    ctx.closePath();
  }
}

//here i create the main menu

//the input possition
inp.style.position = 'absolute';
inp.style.width = `${canvas.width / 3}px`
inp.style.height = `${canvas.height / 25}px`
inp.style.left = `${canvas.width / 2 - inp.offsetWidth / 2}px`;
inp.style.top = `${canvas.height / 2 - inp.offsetHeight / 2}px`;

//the button possition
btn.style.position = 'absolute';
btn.style.width = `${canvas.width / 3}px`
btn.style.height = `${canvas.height / 25}px`
btn.style.left = `${canvas.width / 2 - btn.offsetWidth / 2}px`;
btn.style.top = `${canvas.height / 2 - btn.offsetHeight / 2 + canvas.height / 20}px`;

//the chat messages
cht.style.position = 'absolute';
cht.style.width = btn.style.width;
cht.style.height = btn.style.height;
cht.style.left = '1px';
cht.style.top = `${canvas.height - cht.offsetHeight}px`;

dv.style.position = 'absolute';
dv.style.width = `${canvas.width / 2.91}px`
dv.style.height = `${canvas.height / 4}px`
dv.style.left = cht.style.left
dv.style.top = `${canvas.height - cht.offsetHeight - dv.offsetHeight + .5}px`;

cht.style.display = "none"
dv.style.display = "none"

function e(event) {
  if (event.key === "Enter") {
    startGame();
  }
}

window.addEventListener('keydown', e)

window.addEventListener('load', () => {
  const storedName = localStorage.getItem('playerName');
  if (storedName) {
    inp.value = storedName;
  }
});

function startGame() {
  
  window.removeEventListener('keydown', e);
  
  name = inp.value;
  
  localStorage.setItem('playerName', name);
  
  dv.style.display = 'block'
  
  inp.style.display = 'none';
  btn.style.display = 'none';
  cht.style.display = 'block';
  
  if (!name) {
    name = "Guest #" + Math.floor(Math.random() * 1000000);
  }
  
  if (name.length > 20) name = name.substring(0, 20);
  
  let player = new Player(socket.id, name, Math.random() * canvas.width, Math.random() * canvas.height, 5);
  
  socket.emit('newPlayer', { id: socket.id, name: player.name, x: player.x, y: player.y });
  
  window.addEventListener("keyup", (event) => {
    player.keys[event.key] = false;
  });
  
  socket.on('updatePlayers', (data) => {
    players = data.filter(p => p.id !== socket.id).map(p => new Player(p.id, p.name, p.x, p.y, 5, p.msg));
  });
  
  /*socket.on('connection send', (name) => {
    msgs.push(`\n${name} has joined the game!`)
    txt.innetText = msgs.join('')
    console.log()
    dv.scrollTop = dv.scrollHeight;
  });*/
  
  socket.on('msgs', (data) => {
    if (socket.id !== data[0]) {
      msgs.push(data[1]);
      txt.innerText = msgs.join('')
      dv.scrollTop = dv.scrollHeight;
      players[data[0]].msg = data[1]
      players[data[0]].msgTimeout = MSGTIMEOUT
    }
  });
  
  function draw(players) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    players.forEach(p => p.draw(false, offsetX, offsetY));
    player.draw(true);
  }
  
  function render() {
    player.update();
    draw(players);
  }
  
  setInterval(render, 16)
  
  window.addEventListener('keydown', ev)
  
  function ev(event) {
    if (event.key === "Enter") {
      cht.focus();
      window.removeEventListener('keydown', ev)
      window.addEventListener('keydown', ch)
    }
    player.keys[event.key] = true
  }
  
  function ch(event) {
    if (event.key === "Enter") {
      let msg = cht.value.trim();
      if (msg) {
        msgs.push(player.name + ': ' + msg + '\n');
        socket.emit('msg upd', [socket.id, player.name + ': ' + msg + '\n']);
        txt.innerText = msgs.join('')
        console.log()
        dv.scrollTop = dv.scrollHeight;
        player.msg = msg
        player.msgTimeout = MSGTIMEOUT
      }
      cht.value = '';
      cht.blur();
      window.addEventListener('keydown', ev);
      window.removeEventListener('keydown', ch);
    }
  }
}
