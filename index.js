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
    console.log(socket);
    console.log(io.clients())
});