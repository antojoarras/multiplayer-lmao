const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('uuid');

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
  console.log('A player has connected:', socket.id);

  socket.on('newPlayer', (data) => {
    players[socket.id] = {
      id: socket.id,
      name: data.name,
      x: data.x,
      y: data.y,
    };
    
    io.emit("connection send", data.name);
    io.emit('updatePlayers', Object.values(players));
  });

  socket.on('playerUpdate', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].name = data.name;
      players[socket.id].msg = data.msg;
    }
    io.emit('updatePlayers', Object.values(players));
  });
  
  socket.on('msg upd', (data) => {
    io.emit('msgs', data)
  })

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('updatePlayers', Object.values(players));
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
