let Client = {};

let player_id = null;

Client.socket = io.connect();

//this will be call when the page load
Client.request_newplayer = function () {
    console.log('sending request to server. (request_newplayer');
    Client.socket.emit('newplayer');
};

//this will be call when the user type something on the page
Client.sendClick = function(clicked_data){
    let send_obj = {};
    send_obj.keyclicked = clicked_data;
    send_obj.id = player_id;
    Client.socket.emit('click', send_obj);
};

Client.socket.on('newplayer', function(data) {
    console.log("a new player join in the room");
    console.log("new player: " + data.id);
});

Client.socket.on('allplayers', function (data) {
    console.log('receiving data from server. (on allplayer)');

    for(var i = 0; i < data.length; i++){
        console.log(data[i].id,data[i].x,data[i].y);
    }

    player_id = data[data.length-1].id;

    Client.socket.on('move', function (data) {
        console.log(data);
    });

    Client.socket.on('remove', function(id) {
        console.log("id: " + id + " just left the romm");
    })
});
