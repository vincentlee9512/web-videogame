const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.Server(app);
const io = socketIO.listen(server);

const port = 8009;

const ships = [
    ['yellow', undefined],
    ['red', undefined],
    ['purple', undefined],
    ['green', undefined]
];

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

    socket.on('join_room', (room) => {
        socket.join(room);
        io.to(room).emit('player_joined');
        let id = findOpenID(socket.id);
        socket.emit('assign_id', id);

        socket.on('update', (data) => {
            io.to(room).emit('update_players', data);
        })
    });

    socket.on('send_message', (msg) => {

    });

    socket.on('disconnect', () => {
        console.log("Client disconnected: " + socket.id);
        removeID(socket.id);
    });
});

function findOpenID(id) {
    for (let i = 0; i < ships.length; i++) {
        if (!ships[i][1]) {
            ships[i][1] = id;
            return i
        }
    }
    return null
}

function removeID(id) {
    for (let i = 0; i < ships.length; i++) {
        if (ships[i][1] === id) {
            ships[i][1] = undefined;
            return;
        }
    }
}


function getAllPlayers() {
    const players = [];

    Object.keys(io.sockets.connected).forEach((socketID) => {
        let player = io.sockets.connected[socketID].player;
        if (player) players.push(player);
    });
    return players;
}