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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/space.html')
});

server.listen(port, () => {
    console.info("Server listening on port " + port);
});