
var fs = require('fs');
var path = require('path');
var http = require('http');

var express = require('express');
var WebSocket = require('ws');
var socketio = require('socket.io');

var port = 8035;
var app = express();
var server = http.createServer(app);
server.listen(port);

app.use('/js',express.static(__dirname + '/js'));

var generate_player_id =  0;

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        if (err) {

        }
        else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        }
    });
});

var io = socketio(server);

io.on('connection', (socket) => {
    console.log('connected');

    socket.on('newplayer', function () {
        console.log('receive request for creating new player');
        socket.player = {
            id: generate_player_id++,
            x:100,
            y:100
        };

        socket.emit('allplayers', get_all_players());
        //this broadcase.emit(), will send all players who is on 'newplayer'
        //except the one just created.
        socket.broadcast.emit('newplayer', socket.player);

        socket.on('click', function (data) {
            console.log("id: " + data.id + " , clicked: " + data.keyclicked);

            io.emit("move", "id: " + data.id + " , clicked: " + data.keyclicked);
        })

        socket.on('disconnect', function() {
            io.emit('remove', socket.player.id);
        });
    });

});

function get_all_players(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}
