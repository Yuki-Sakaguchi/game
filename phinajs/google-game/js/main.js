phina.globalize();

//-------------------------
// 定数宣言
//-------------------------
var
WIDTH = 900,
HEIGHT = 300,
BOX_WIDTH  = 32,
BOX_HEIGHT = 64,
JUMP_SPEED = 200,// 低いとジャンプが早くなる
OBSTACLE_SPEED = 10, // 高いと障害物が早くなる
OBSTACLE_VIEW_SPEED = 55, // 低いと障害物が現れる間隔が早くなる [min, max]
// FONT_FAMIRY = 'Impact',
SCORE_NAME = 'avoid_it_hightScore',

BASE_COLOR = {
    bk: '#86C3BB', // 薄緑
    main: '#E46322', // 茶色
    font: 'white' // 白
},

SCENES = [
    {
        label: 'main',
        className: 'MainScene',
    }
];

//-------------------------
// メインシーン
//-------------------------
phina.define('MainScene', {
    superClass: 'DisplayScene',

    init: function() {
        var _self = this;

        _self.superInit({
            width: WIDTH,
            height: HEIGHT,
        });

        // 背景
        _self.backgroundColor = BASE_COLOR.bk;

        // 床
        var floor = RectangleShape({
            width : WIDTH,
            height: HEIGHT,
            fill: BASE_COLOR.main,
            stroke: null,
            y: _self.gridY.center() + 220,
            x: _self.gridX.center(),
        })
        .setInteractive(true)
        .on('pointstart', function() {
            if (!_self.player.isJump) {
                _self.player.jump();
            }
        }).addChildTo(_self);

        // 障害物グループ
        _self.obstacleGroup = DisplayElement().addChildTo(_self);

        // プレイヤー
        _self.player = Player().addChildTo(_self);

        var hiScore = (localStorage.getItem(SCORE_NAME)) ? localStorage.getItem(SCORE_NAME) : 0;
        var hiScoreLabel = Label({
            text: 'HI ' + this.zeroPadding(hiScore),
            fill: BASE_COLOR.font,
            y: 30,
            x: WIDTH - 160,
            // fontFamily: FONT_FAMIRY,
            fontSize: 30,
            align: 'right'
        }).addChildTo(_self);

        // ポイント
        _self.time = 0;
        _self.timeLabel = Label({
            text: _self.time,
            fill: BASE_COLOR.font,
            y: 30,
            x: WIDTH - 30,
            // fontFamily: FONT_FAMIRY,
            fontSize: 30,
            align: 'right'
        }).addChildTo(_self);
    },

    userOperation: function(app) {
        // キーボード用
        var key = app.keyboard;
        if (key.getKeyDown('space')) {
            if (!this.player.isJump) {
                this.player.jump();
            }
        }
    },

    collision: function(app) {
        var player = this.player;
        var rect = Rect(player.left, player.top, player.width, player.height);
        var self = this;
        var hit = false;

        this.obstacleGroup.children.some(function(block) {
            if (Collision.testRectRect(block, rect)) {
                // 障害物に当たったら処理を止める
                hit = true;
                // block.remove();
                this.update = null;
                this.player.tweener.clear();
                this.player.isJump = true;

                var point = Math.floor(this.time / 1000);

                // ハイスコア保存
                if (localStorage.getItem(SCORE_NAME) < point) {
                    localStorage.setItem(SCORE_NAME, point);
                }

                // タイトルへボタン表示
                setTimeout(function() {
                    var gameover = Label({
                        text: 'GAME OVER',
                        fill: BASE_COLOR.font,
                        y: 90,
                        x: this.gridX.center(),
                        fontSize: 25,
                    }).addChildTo(this);

                    var titleBtn = Button({
                        text: 'continue',
                        y: this.gridY.center(),
                        x: this.gridX.center(),
                        fill: BASE_COLOR.font,
                        fontColor: BASE_COLOR.bk,
                        scaleX: 1,
                        scaleY: 1,
                        cornerRadius: 4,
                        // fontFamily: FONT_FAMIRY,
                    }).addChildTo(this);

                    // タイトルボタンのクリックイベント
                    titleBtn.on('click', function() {
                        this.exit({nextLabel: "main"});
                    }.bind(this));
                }.bind(this), 1500);
            }

            if (block.left < -100) {
                // 画面外に出た障害物を消してポイント加算
                block.remove();
            }

            if (hit) {
                // 障害物に当たったら障害物の更新を止める
                this.obstacleGroup.children.some(function(block) {
                    block.update = null;
                });
            }
        }.bind(this));
    },

    zeroPadding: function (num) {
        return ('00000' + num).slice(-5);
    },

    update: function(app) {
        this.time += app.deltaTime * 10;
        this.timeLabel.text = this.zeroPadding(Math.floor(this.time / 1000));

        // ユーザの操作を監視
        this.userOperation(app);

        // 障害物との当たり判定を監視
        this.collision(app);

        if (app.frame % OBSTACLE_VIEW_SPEED === 0) {
            Obstacle().addChildTo(this.obstacleGroup);
        }
    }
});

//-------------------------
// プレイヤークラス
//-------------------------
phina.define('Player', {
    superClass: 'RectangleShape',

    init: function() {
        this.superInit({
            width : BOX_WIDTH,
            height: BOX_HEIGHT,
            fill: 'white',
            stroke: null,
            y: 200,
            x: 150,
        });
        this.isJump = false;
    },

    jump: function() {
        this.isJump = true;
        this.tweener
        .clear()
        .by({
            y: -BOX_HEIGHT * 1.8
        }, JUMP_SPEED, 'easeOutCirc')
        .by({
            y: BOX_HEIGHT * 1.8
        }, JUMP_SPEED, 'easeInCubic')
        .call(function() {
            this.isJump = false;
        }.bind(this));
    }
});

//-------------------------
// 障害物クラス
//-------------------------
phina.define('Obstacle', {
    superClass: 'RectangleShape',

    init: function() {
        // ランダムで縦位置を決定
        /*
        var y = 699;
        if (Math.randint(1, 2) === 1) {
            y -= BOX_HEIGHT * 1.5;
        }
        */

        var y = 200;
        var x = WIDTH + BOX_WIDTH;
        if (Math.randint(1, 2) === 1) {
            x += BOX_WIDTH * 4;
        }

        this.superInit({
            width : BOX_WIDTH,
            height: BOX_HEIGHT,
            fill: 'black',
            stroke: null,
            y: y,
            x: x,
        });
    },

    update: function() {
        this.x -= OBSTACLE_SPEED;
    }
});

//-------------------------
// アプリ起動
//-------------------------
phina.main(function() {
    var app = GameApp({
        startLabel: 'main',
        scenes: SCENES,
        domElement: document.getElementById("phinaCanvas"),
        width: WIDTH,
        height: HEIGHT,
    });
    app.fps = 60;
    app.run();
});
