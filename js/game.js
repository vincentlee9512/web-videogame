
let gameScene = new Phaser.Scene('Game');

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false
        }
    },
    parent: 'gameDiv',
    scene: gameScene
};

let players = [undefined, undefined, undefined, undefined];
let players_grp;
const spawn_points = [
                        [[100, 300]],
                        [[100, 300], [1100, 300]],
                        [[100, 150], [1100, 300], [100, 450]],
                        [[100, 150], [1100, 150], [100, 450], [1100, 450]]
                      ];
let lazers;
let player_speed = -400;
let lazer_vel = 600;
let cursors;
const game_over = false;
//Server emits to set this to true once everyone has entered the game
let game_start = false;

const game = new Phaser.Game(config);

// function preload() {
gameScene.preload = function(){
    this.load.image('background', '/assets/Space_Background.png');
    this.load.image('yellow', '/assets/ships/yellow.png');
    this.load.image('green', '/assets/ships/green.png');
    this.load.image('red', '/assets/ships/red.png');
    this.load.image('purple', '/assets/ships/purple.png');
    this.load.image('black', '/assets/ships/black.png');
    this.load.image('blue', '/assets/ships/blue.png');
    this.load.image('orange', '/assets/ships/orange.png');
    this.load.image('lazer', '/assets/lazer.png')
}

// function create() {
gameScene.create = function(){
    // background for our game
    this.add.image(600, 300, 'background');

    // players_grp for collider, and adding ships
    //--------------------------------------------------------------------------
    players_grp = this.physics.add.group();
    // console.log(players_grp);
    //--------------------------------------------------------------------------

    // lazers group/collider
    //--------------------------------------------------------------------------
    lazers = this.physics.add.group();
    this.physics.add.collider(players_grp, lazers, player_destroy, null, this);
    //--------------------------------------------------------------------------

    // Input Events
    cursors = this.input.keyboard.createCursorKeys();

    // had to emit here so that that it would not try to
    // create ships until the game had been created
    socket.emit('join_room', {'room':room, 'color':ship_color, 'player_count': player_count});
}


// function update() {
gameScene.update = function(){
    if (game_over) {
        return;
    }
    if(typeof players[player_id] !== 'undefined'){
      player_controller(players[player_id]);
    }
}

function player_controller(player) {

  if(game_start){
    //vertical movement
    if (cursors.up.isDown) {
        player.setVelocityY(player_speed);
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(-player_speed);
    }
    else {
        player.setVelocityY(0);
    }
    //horizontal movement
    if (cursors.right.isDown) {
        player.setVelocityX(-player_speed);
    }
    else if (cursors.left.isDown) {
        player.setVelocityX(player_speed);
    }
    else {
        player.setVelocityX(0);
    }

    let update = {
        id: player_id,
        hasShot: false,
        x: player.x,
        y: player.y
    };

    // Shooting
    if (player.weapon_loaded && player.active && cursors.space.isDown) {
        shoot();
    }
    socket.emit('update', update);
  }
}

socket.on('start_game', (num_connected) => {
  if(num_connected === player_count){
    game_start = true;
  }
});

socket.on('update_players', (data) => {
  if(typeof players !== 'undefined'){
    if (data.id !== player_id) {
      let player = players[data.id];
      player.x = data.x;
      player.y = data.y;
    }
  }
});

socket.on('player_destroy', (data) => {
  players[data].disableBody(true, true);

});

socket.on('player_respawn', (data) => {
  ship = players[data].texture.key;
  players[data].enableBody(true, spawn_points[player_count-1][player_id][0], spawn_points[player_count-1][player_id][1], true, true);
});

socket.on('player_shot', (data) => {
  let ship = players[data];
  const lz = (ship.angle === 0) ? {'x': ship.x + 40, 'vel': lazer_vel} : {'x': ship.x - 40, 'vel': -lazer_vel};
  const lazer = lazers.create(lz['x'], ship.y, 'lazer');
  lazer.setCollideWorldBounds(false);
  lazer.body.immovable = true;
  lazer.setVelocity(lz['vel'], 0);
  setTimeout(() => {
    lazer.destroy();
    delete lazer;
  }, 1500);
});

socket.on('add_players', (data) => {
  console.log('Trying to add player(s)');
  console.log(data);
  data.forEach((cur_player) => {
    console.log(cur_player);
    if(cur_player){
      let should_create = true;
      players.forEach((player) => {
        console.log(player);
        if(player){
          if(player.player_id === cur_player.player_id){
            should_create = false;
            console.log('player already exists');
          }
        }else if(cur_player.player_id > player_count-1){
          should_create = false;
          console.log('Invalid ID: ' + cur_player.player_id);
        }
      });
      if(should_create){
        gameScene.createPlayer(cur_player);
      }
    }
  });
});

gameScene.createPlayer = function(new_player){
  let player = players_grp.create(spawn_points[player_count-1][new_player.player_id][0], spawn_points[player_count-1][new_player.player_id][1], new_player.color);
  player.angle = (spawn_points[player_count-1][new_player.player_id][0] > 600) ? 180 : 0;
  player.setCollideWorldBounds(true);
  player.body.immovable = true;
  player.weapon_loaded = true;
  player.player_id = new_player.player_id;
  player.color = new_player.color;
  players[new_player.player_id] = player;
}

function shoot() {
  socket.emit('shoot', player_id);
    players[player_id].weapon_loaded = false;
    setTimeout(() => {
        players[player_id].weapon_loaded = true;
    }, 500);
}


function player_destroy(player, lazer) {
  player.disableBody(true, true);
  let player_is_me = player.texture.key === players[player_id].texture.key;
  if(player_is_me){
    socket.emit('player_hit', player_id);
    setTimeout(() => {
      socket.emit('respawn', player_id);
    }, 3000);
  }
}
