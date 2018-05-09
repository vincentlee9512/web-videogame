
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
    // scene: {
    //     preload: preload,
    //     create: create,
    //     update: update
    // }
    scene: gameScene
};

let players;
let player_count = 4;
const player_init = [
                      {'yellow': [100, 300]},
                      {'yellow': [100, 300], 'red': [1100, 300]},
                      {'yellow': [100, 150], 'red': [1100, 300], 'purple': [100, 450]},
                      {'yellow': [100, 150], 'red': [1100, 150], 'purple': [100, 450], 'green': [1100, 450]}
                    ];
// const player_init = {'yellow': [100, 150], 'red': [1100, 150], 'purple': [100, 450], 'green': [1100, 450]};
let lazers;
let player_speed = -400;
let lazer_vel = 600;
let cursors;
const game_over = false;
//Server emits to set this to true once everyone has entered the game
// let game_start = true;

const game = new Phaser.Game(config);

// function preload() {
gameScene.preload = function(){
    this.load.image('background', '/assets/Space_Background.png');
    this.load.image('yellow', '/assets/ships/yellow.png');
    this.load.image('green', '/assets/ships/green.png');
    this.load.image('red', '/assets/ships/red.png');
    this.load.image('purple', '/assets/ships/purple.png');
    this.load.image('lazer', '/assets/lazer.png')
}

// function create() {
gameScene.create = function(){
    // background for our game
    this.add.image(600, 300, 'background');

    // player ship
    //--------------------------------------------------------------------------
    players = this.physics.add.group();
    Object.keys(player_init[player_count-1]).forEach((ship) => {
        const player = players.create(player_init[player_count-1][ship][0], player_init[player_count-1][ship][1], ship);
        player.angle = (player_init[player_count-1][ship][0] > 600) ? 180 : 0;
        player.setCollideWorldBounds(true);
        player.body.immovable = true;
        player.weapon_loaded = true;
    });
    console.log(player_count);
    console.log(players);
    //--------------------------------------------------------------------------

    // lazers group/collider
    //--------------------------------------------------------------------------
    lazers = this.physics.add.group();
    this.physics.add.collider(players, lazers, player_destroy, null, this);
    //--------------------------------------------------------------------------

    // Input Events
    cursors = this.input.keyboard.createCursorKeys();

}


// function update() {
gameScene.update = function(){
    if (game_over) {
        return;
    }
    player_controller(players.children.entries[player_id]);
}

function player_controller(player) {

  // if(game_start){
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
        //update.hasShot = true;
        shoot();
        // gameScene.scene.start();
    }
    socket.emit('update', update);
  // }
}

socket.on('start_game', (num_connected) => {
  player_count = num_connected;
  console.log("startGame!");
  // console.log(player_count);
  //game_start = true;
  // game.scene.restart();
  // window.location.reload();
});

socket.on('update_players', (data) => {
  if(typeof players !== 'undefined'){
    if (data.id !== player_id) {
      let player = players.children.entries[data.id];
      // if (data.hasShot && player.weapon_loaded && player.active && cursors.space.isDown) {
      //   update.hasShot = true;
      //   shoot(player);
      // }
      player.x = data.x;
      player.y = data.y;
    }
  }
});

socket.on('player_destroy', (data) => {
  players.children.entries[data].disableBody(true, true);

});

socket.on('player_respawn', (data) => {
  ship = players.children.entries[data].texture.key;
  players.children.entries[data].enableBody(true, player_init[player_count-1][ship][0], player_init[player_count-1][ship][1], true, true);
});

socket.on('player_shot', (data) => {
  let ship = players.children.entries[data];
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

function enemy_shoot() {
    enemies.children.entries.forEach(function (enemy) {
        setInterval(() => {
            if (enemy.weapon_loaded && enemy.active) {
                shoot(enemy);
            }
        }, 1000 * Phaser.Math.RND.integerInRange(1, 5))
    });
}

function shoot() {
  socket.emit('shoot', player_id);
    players.children.entries[player_id].weapon_loaded = false;
    setTimeout(() => {
        players.children.entries[player_id].weapon_loaded = true;
    }, 500);
}


function player_destroy(player, lazer) {
  player.disableBody(true, true);
  let player_is_me = player.texture.key === players.children.entries[player_id].texture.key;
  if(player_is_me){
    socket.emit('player_hit', player_id);
    setTimeout(() => {
      socket.emit('respawn', player_id);
    }, 3000);
  }
}
