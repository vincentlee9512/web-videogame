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
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let players;
let enemies;
const enemy_init = {'green': [1100, 150], 'purple': [1100, 450]};
const player_init = {'yellow': [100, 150], 'red': [1100, 150], 'purple': [100, 450], 'green': [1100, 450]};
let lazers;
let player_speed = -400;
let lazer_vel = 600;
let cursors;
const game_over = false;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', '/assets/Space_Background.png');
    this.load.image('yellow', '/assets/ships/yellow.png');
    this.load.image('green', '/assets/ships/green.png');
    this.load.image('red', '/assets/ships/red.png');
    this.load.image('purple', '/assets/ships/purple.png');
    this.load.image('lazer', '/assets/lazer.png')
}

function create() {
    // background for our game
    this.add.image(600, 300, 'background');

    // player ship
    //--------------------------------------------------------------------------
    players = this.physics.add.group();
    Object.keys(player_init).forEach((ship) => {
        const player = players.create(player_init[ship][0], player_init[ship][1], ship);
        player.angle = (player_init[ship][0] > 600) ? 180 : 0;
        player.setCollideWorldBounds(true);
        player.weapon_loaded = true;
    });
    //console.log(players);
    //--------------------------------------------------------------------------

    // lazers group
    //--------------------------------------------------------------------------
    lazers = this.physics.add.group();
    this.physics.add.collider(players, lazers, player_destroy, null, this);
    this.physics.add.collider(enemies, lazers, enemy_destroy, null, this);
    //--------------------------------------------------------------------------

    // Input Events
    cursors = this.input.keyboard.createCursorKeys();

}


function update() {
    if (game_over) {
        return;
    }
    player_controller(players.children.entries[player_id]);
}

function player_controller(player) {

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
        xVelocity: player.body.velocity.x,
        yVelocity: player.body.velocity.y
    };

    // Shooting
    if (player.weapon_loaded && player.active && cursors.space.isDown) {
        update.hasShot = true;
        shoot(player);
    }

    socket.emit('update', update);

    socket.on('update_players', (data) => {
        if (data.id !== player_id) {
            let player = players.children.entries[data.id];
            if (data.hasShot && player.weapon_loaded && player.active && cursors.space.isDown) {
                update.hasShot = true;
                shoot(player);
            }
            player.setVelocity(data.xVelocity, data.yVelocity);
        }
    });
}

function enemy_shoot() {
    enemies.children.entries.forEach(function (enemy) {
        setInterval(() => {
            if (enemy.weapon_loaded && enemy.active) {
                shoot(enemy);
            }
        }, 1000 * Phaser.Math.RND.integerInRange(1, 5))
    });
}

function shoot(ship) {
    ship.weapon_loaded = false;
    //shoot
    const lz = (ship.angle === 0) ? {'x': ship.x + 40, 'vel': lazer_vel} : {'x': ship.x - 40, 'vel': -lazer_vel};
    const lazer = lazers.create(lz['x'], ship.y, 'lazer');
    lazer.setCollideWorldBounds(false);
    lazer.setVelocity(lz['vel'], 0);
    setTimeout(() => {
        lazer.destroy();
    }, 1500);
    setTimeout(() => {
        ship.weapon_loaded = true;
    }, 500);
}


function player_destroy(player, lazer) {
    player.disableBody(true, true);
    setTimeout(() => {
        player.enableBody(true, player_init[player.texture.key][0], player_init[player.texture.key][1], true, true);
    }, 3000);
}

function enemy_destroy(enemy, lazer) {
    enemy.disableBody(true, true);
    setTimeout(() => {
        enemy.enableBody(true, enemy_init[enemy.texture.key][0], enemy_init[enemy.texture.key][1], true, true);
    }, 3000);
}
