const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.Server(app);
const io = socketIO.listen(server);

const port = 8009;

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/game/*', (req, res) => {
    res.sendFile(__dirname + '/game.html')
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

app.get('*', (req, res) => {
    res.redirect('/');
});

server.listen(port, () => {
    console.info("Server listening on port " + port);
});

io.on('connection', (socket) => {
    console.log("Client connected");

    socket.on('join_room', (player_data) => {
        let room = player_data.room;
        socket.join(room);
        if(typeof io.sockets.adapter.rooms[room].players === 'undefined'){
          io.sockets.adapter.rooms[room].players = [undefined,undefined,undefined,undefined];
        }
        if(typeof io.sockets.adapter.rooms[room].player_ids === 'undefined'){
          io.sockets.adapter.rooms[room].player_ids = [undefined,undefined,undefined,undefined];
        }
        // io.to(room).emit('player_joined');
        let id = findOpenID(socket.id, io.sockets.adapter.rooms[room].player_ids);
        console.log(io.sockets.adapter.rooms[room].player_ids);
        socket.emit('assign_id', id);
        io.sockets.adapter.rooms[room].players[id] = {'player_id':id, 'color':player_data.color};
        io.to(room).emit('add_players', io.sockets.adapter.rooms[room].players);
        let conn_players = io.sockets.adapter.rooms[room].length;
        io.to(room).emit('start_game', conn_players);
        socket.on('update', (data) => {
          io.to(room).emit('update_players', data);
        });
        socket.on('player_hit', (data) => {
          io.to(room).emit('player_destroy', data);
        });
        socket.on('respawn', (data) => {
          io.to(room).emit('player_respawn', data);
        });
        socket.on('shoot', (data) => {
          io.to(room).emit('player_shot', data);
        });
    });

    socket.on('send_message', (msg) => {

    });

    socket.on('disconnect', () => {
      console.log("Client disconnected: " + socket.id);
      removeID(socket.id);
    });
});

function findOpenID(id, player_ids) {
    for (let i = 0; i < player_ids.length; i++) {
        if (!player_ids[i]) {
            player_ids[i] = id;
            return i
        }
    }
    return null
}

function removeID(id) {
  Object.keys(io.sockets.adapter.rooms).forEach((room) => {
    if(typeof io.sockets.adapter.rooms[room].player_ids !== 'undefined'){
      for (let i = 0; i < io.sockets.adapter.rooms[room].player_ids.length; i++) {
        if (io.sockets.adapter.rooms[room].player_ids[i] === id) {
            io.sockets.adapter.rooms[room].player_ids[i] = undefined;
            io.to(room).emit('player_disconnect');
            return;
        }
      }
    }
  });
}


function getAllPlayers() {
    const players = [];
    Object.keys(io.sockets.connected).forEach((socketID) => {
        let player = io.sockets.connected[socketID].player;
        if (player) players.push(player);
    });
    return players;
}
