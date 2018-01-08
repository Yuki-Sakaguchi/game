// phina展開
phina.globalize();


// ====================================
// 定数
// ====================================
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;
var GRAVITY = 1.8;
var BOX_SIZE = 32;

var DIRECTION = {
  UP   : 0,
  RIGHT: 1,
  DOWN : 2,
  LEFT : 3,
};

var ASSETS = {
  text: {
    stage1: 'stage/stage1.txt',
  }
};


// ====================================
// メインシーン
// ====================================
phina.define('MainScene', {
  superClass: 'DisplayScene',

  /**
   * 初期化
   */
  init: function() {
    this.superInit();
    this.backgroundColor = '#000';
    
    this.playerGroup = DisplayElement().addChildTo(this);
    this.stageGroup = DisplayElement().addChildTo(this);
    
    this.player = Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2).addChildTo(this.playerGroup);
    this.map = Map(this.stageGroup);
    this.map.loading('text', 'stage1', this.player, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  },

  /**
   * 更新
   */
  update: function() {
    this.collisionX(this.playerGroup, this.stageGroup);
    this.collisionY(this.playerGroup, this.stageGroup);
    this.map.move(this.player, this.stageGroup);
  },

  /**
   * 横軸の当たり判定
   */
  collisionX: function(attacks, defences) {
    attacks.children.some(function(attack) {
      var newX = attack.left + attack.vx;
      var newRect = Rect(newX, attack.top, attack.width, attack.height);
      defences.children.some(function(defence) {
        if (Collision.testRectRect(newRect, defence)) {
          // 右に移動
          if (attack.vx > 0) {
            attack.right = defence.left;
            attack.vx = 0;
          }
          // 左に移動
          if (attack.vx < 0) {
            attack.left = defence.right;
            attack.vx = 0;
          }
          return;
        }
      });
    });
  },

  /**
   * 縦軸の当たり判定
   */
  collisionY: function(attacks, defences) {
    attacks.children.some(function(attack) {
      var newY = attack.top + attack.vy;
      var newRect = Rect(attack.left, newY, attack.width, attack.height);
      defences.children.some(function(defence) {
        if (Collision.testRectRect(newRect, defence)) {
          // 下に移動
          if (attack.vy > 0) {
            attack.bottom = defence.top;
            attack.vy = 0;
            attack.onFloor = true;
          }
          // 上に移動
          if (attack.vy < 0) {
            attack.top = defence.bottom;
            attack.vy = 0;
          }
          return true;
        } else {
          attack.onFloor = false;
        }
      });
    });
  }
});


// ====================================
// プレイヤー
// ====================================
phina.define('Player', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(x, y) {
    this.superInit({
      width: BOX_SIZE / 2,
      height: BOX_SIZE / 2,
      fill: '#F0A32F',
      stroke: null,
      x: x,
      y: y,
    });

    this.vx = 0;
    this.vy = 0;
    this.maxVx = 8;
    this.maxVy = 14;

    this.scaleX = 1;
    this.scaleY = 1;
    
    this.speed = 2; // 移動スピード
    this.jumpSpeed = 10; // ジャンプの速度
    this.jumpPower = 0; 
    this.maxJumpPower = 2; // ジャンプの最大距離
    this.jumpCount = 0;
    this.maxJumpCount = 2; // ジャンプの最大回数
    this.direction = DIRECTION.LEFT;
    this.onFloor = false;
  },

  /**
   * 更新
   */
  update: function(app) {
    var key = app.keyboard;

    // 移動の最高速度を超えさせない
    if (this.vx > this.maxVx) {
      this.vx = this.maxVx;
    }
    if (this.vx < -this.maxVx) {
      this.vx = -this.maxVx;
    }

    // 移動していない時、慣性で徐々に止める
    if (!key.getKey('right') || !key.getKey('left')) {
      if (this.vx > 0) {
        this.vx -= this.speed/2;
      }
      if (this.vx < 0) {
        this.vx += this.speed/2;
      }
    }

    // 左に移動
    if (key.getKey('left')) {
      this.vx += -this.speed;
      this.direction = DIRECTION.LEFT;
    }

    // 右に移動
    if (key.getKey('right')) {
      this.vx += this.speed;
      this.direction = DIRECTION.RIGHT;
    }

    // 下を向く
    if (key.getKey('down')) {
      this.direction = DIRECTION.DOWN;
    }

    // 上を向く
    if (key.getKey('up')) {
      this.direction = DIRECTION.UP;
    }

    // ジャンプ
    if (key.getKey('space')) {
      if (this.jumpCount <= this.maxJumpCount) {
        this.jumpPower++;
        if (this.jumpPower <= this.maxJumpPower) {
          this.vy += -this.jumpSpeed;
          this.onFloor = false;
        }
      }
    }

    // ジャンプのカウント
    if (key.getKeyDown('space')) {
      if (this.jumpCount < this.maxJumpCount) {
        this.jumpCount++;
        this.jumpPower = 0;
        this.vy = 0;
      }
    }

    // ジャンプ中の速度
    if (!this.onFloor) {
      if (this.vy < this.maxVy) {
        this.vy += GRAVITY;
      }
    } else {
      // ジャンプの初期化
      this.jumpCount = 0;
      this.jumpPower = 0;
    }
  },

  /**
   * 移動
   */
  move: function() {
    this.x += this.vx;
    this.y += this.vy;
  }
});


// ====================================
// マップ
// ====================================
phina.define('Map', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(group) {
    this.superInit();
    this.group = group;
    this.mapWidth = null;
    this.mapHeight = null;
    this.absdisX = 0;
    this.absdisY = 0;
  },

  /**
   * マップのローディング
   */
  loading: function(text, stage, player, nextX, nextY) {
    this.text = AssetManager.get(text, stage).data;
    var ary = this.text.split('\n');
    var map = [];

    for (var i = 0, len = ary.length; i < len; i++) {
      map.push(ary[i].split(''));
    }

    // Bのところにだけブロックを配置
    for (var i = 0, iLen = map.length; i < iLen; i++) {
      for (var j = 0, jLen = map[i].length; j < jLen; j++) {
        if (map[i][j] === 'B') {
          Block(j * BOX_SIZE, i * BOX_SIZE).addChildTo(this.group);
        }
      }
    }

    this.mapWidth = map[0].length * BOX_SIZE;
    this.mapHeight = map.length * BOX_SIZE;

    player.x = nextX;
    player.y = nextY;
  },

  /**
   * 移動
   */
  move: function(player, group) {
    player.move();
    var offset = this.calcOffset(player);

    this.absdisX += offset.vx;
    this.absdisY += offset.vy;

    // X軸の端で動かないようにする処理
    if (this.absdisX < 0) {
      offset.vx -= this.absdisX;
      this.absdisX = 0;
    } else if (this.absdisX > this.mapWidth - SCREEN_WIDTH) {
      offset.vx -= (this.absdisX - (this.mapWidth - SCREEN_WIDTH));
      this.absdisX = this.mapWidth - SCREEN_WIDTH;
    }

    // Y軸の端で動かないようにする処理
    if (this.absdisY < 0) {
      offset.vy -= this.absdisY;
      this.absdisY = 0;
    } else if (this.absdisY > this.mapHeight - SCREEN_HEIGHT) {
      offset.vy -= (this.absdisY - (this.mapHeight - SCREEN_HEIGHT));
      this.absdisY = this.mapHeight - SCREEN_HEIGHT;
    }

    // プレイヤーの位置移動
    player.x += -offset.vx;
    player.y += -offset.vy;
    
    // ステージの位置移動
    group.children.some(function(block) {
      block.x += -offset.vx;
      block.y += -offset.vy;
    });
  },

  /**
   * オフセット計算
   */
  calcOffset: function(player) {
    return {
      vx: player.x - SCREEN_WIDTH / 2,
      vy: player.y - SCREEN_HEIGHT / 2
    };
  }
});


// ====================================
// ブロック
// ====================================
phina.define('Block', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(x, y) {
    this.superInit({
      width: BOX_SIZE,
      height: BOX_SIZE + 1, // ジャンプした時に隙間ができるので大きめにした
      x: x + BOX_SIZE / 2,
      y: y + BOX_SIZE / 2,
      fill: '#30499B',
      stroke: '#30499B',
      strokeWidth: 0,
    });
  }
});


// ====================================
// アプリ起動
// ====================================
phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    assets: ASSETS,
  });
  app.fps = 30;
  app.run();
});