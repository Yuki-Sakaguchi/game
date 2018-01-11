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
    stage1:     'stage/stage1.txt',
    stage1_evt: 'event/stage1.txt',
    stage2:     'stage/stage2.txt',
    stage2_evt: 'event/stage2.txt',
    stage3:     'stage/stage3.txt',
    stage3_evt: 'event/stage3.txt',
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
    
    // グループ
    this.eventGroup = DisplayElement().addChildTo(this);
    this.stageGroup = DisplayElement().addChildTo(this);
    this.playerGroup = DisplayElement().addChildTo(this);
    this.enemyGroup = DisplayElement().addChildTo(this);
    
    // プレイヤー
    this.player = Player(100, 100).addChildTo(this.playerGroup);

    // マップ生成
    this.map = Map(this.stageGroup, this.eventGroup, this.enemyGroup);
    this.map.loading('text', 'stage1', 'stage1_evt', this.player, 100, 100);
  },

  /**
   * 更新
   */
  update: function(app) {
    // プレイヤーと床の判定
    this.collisionX(this.playerGroup, this.stageGroup);
    this.collisionY(this.playerGroup, this.stageGroup);

    // 敵と床の判定
    this.collisionX(this.enemyGroup, this.stageGroup);
    this.collisionY(this.enemyGroup, this.stageGroup);

    // プレイヤーとイベントの判定
    this.collistionEvent(this.playerGroup, this.eventGroup, this.map);

    // マップの移動
    this.map.move(this.player, this.stageGroup, this.eventGroup, this.enemyGroup);
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
  },

  /**
   * イベントの当たり判定
   */
  collistionEvent: function(players, events, map) {
    players.children.some(function(player) {
      events.children.some(function(event) {
        if (Collision.testRectRect(player, event)) {
          player.hit(event, map);
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
      fill: '#F3A530',
      stroke: null,
      x: x,
      y: y,
    });

    this.vx = 0;
    this.vy = 0;
    this.maxVx = 12;
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
    this.key = app.keyboard;

    // 移動の最高速度を超えさせない
    if (this.vx > this.maxVx) {
      this.vx = this.maxVx;
    }
    if (this.vx < -this.maxVx) {
      this.vx = -this.maxVx;
    }

    // 移動していない時、慣性で徐々に止める
    if (!this.key.getKey('right') || !this.key.getKey('left')) {
      if (this.vx > 0) {
        this.vx -= this.speed/2;
      }
      if (this.vx < 0) {
        this.vx += this.speed/2;
      }
    }

    // 左に移動
    if (this.key.getKey('left')) {
      this.vx += -this.speed;
      this.direction = DIRECTION.LEFT;
    }

    // 右に移動
    if (this.key.getKey('right')) {
      this.vx += this.speed;
      this.direction = DIRECTION.RIGHT;
    }

    // 下を向く
    if (this.key.getKey('down')) {
      this.direction = DIRECTION.DOWN;
    }

    // 上を向く
    if (this.key.getKey('up')) {
      this.direction = DIRECTION.UP;
    }

    // ジャンプ
    if (this.key.getKey('space')) {
      if (this.jumpCount <= this.maxJumpCount) {
        this.jumpPower++;
        if (this.jumpPower <= this.maxJumpPower) {
          this.vy += -this.jumpSpeed;
          this.onFloor = false;
        }
      }
    }

    // ジャンプのカウント
    if (this.key.getKeyDown('space')) {
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
  },

  /**
   * イベント処理
   */
  hit: function(event, map) {
    if (this.key.getKeyDown('up')) {
      if (event.className == 'Door') {
        this.vx = 0;
        this.vy = 0;
        map.removes();
        map.loading('text', event.nextMap, event.nextEvent, this, event.nextX, event.nextY);
      }
    }
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
  init: function(stageGroup, eventGroup, enemyGroup) {
    this.superInit();
    this.stageGroup = stageGroup;
    this.eventGroup = eventGroup;
    this.enemyGroup = enemyGroup;
    this.mapWidth = null;
    this.mapHeight = null;
    this.absdisX = 0;
    this.absdisY = 0;
  },

  /**
   * マップのローディング
   */
  loading: function(text, stage, event, player, nextX, nextY) {
    // ステージの作成
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
          Block(j * BOX_SIZE, i * BOX_SIZE).addChildTo(this.stageGroup);
        }
      }
    }

    // イベントの作成
    this.event = AssetManager.get(text, event).data;
    var tmpEvent = this.event.split('\n');
    var event = [];

    for (var i = 0, len = tmpEvent.length; i < len; i++) {
      event.push(tmpEvent[i].split(','));
    }

    for (var i = 0, len = event.length; i < len; i++) {
      if (event[i][0] === 'Door') {
        // Doorイベントの場合ドアを作成
        var tmpX = Number(event[i][1]);
        var tmpY = Number(event[i][2]);
        var tmpNextMap = event[i][3];
        var tmpNextEvent = event[i][4];
        var tmpNextX = Number(event[i][5]);
        var tmpNextY = Number(event[i][6]);
        Door(tmpX, tmpY, tmpNextMap, tmpNextEvent, tmpNextX, tmpNextY).addChildTo(this.eventGroup);
      }
    }

    // 敵
    Enemy(500, 50).addChildTo(this.enemyGroup);
    Enemy(500, 50, 1).addChildTo(this.enemyGroup);
    Enemy(500, 50, 2).addChildTo(this.enemyGroup);

    this.absdisX = 0;
    this.absdisY = 0;

    this.mapWidth = map[0].length * BOX_SIZE;
    this.mapHeight = map.length * BOX_SIZE;

    player.x = nextX;
    player.y = nextY;
  },

  /**
   * 移動
   */
  move: function(player, stageGroup, eventGroup, enemyGroup) {
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

    // プレイヤーの位置調整
    player.x += -offset.vx;
    player.y += -offset.vy;
    
    // ステージの位置調整
    stageGroup.children.some(function(block) {
      block.x += -offset.vx;
      block.y += -offset.vy;
    });

    // イベントの位置調整
    eventGroup.children.some(function(block) {
      block.x += -offset.vx;
      block.y += -offset.vy;
    });

    // 敵の位置調整
    enemyGroup.children.some(function(enemy) {
      enemy.move();
      enemy.x += -offset.vx;
      enemy.y += -offset.vy;
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
  },

  /**
   * マップの削除
   */
  removes: function() {
    this.stageGroup.children.clear();
    this.eventGroup.children.clear();
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
// ドア
// ====================================
phina.define('Door', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(x, y, nextMap, nextEvent, nextX, nextY) {
    this.superInit({
      width: BOX_SIZE,
      height: BOX_SIZE * 2,
      fill: '#F9ED3A',
      stroke: '#F9ED3A',
      x: x,
      y: y,
    });
    this.className = 'Door';
    this.nextMap = nextMap;
    this.nextEvent = nextEvent;
    this.nextX = nextX;
    this.nextY = nextY;
  }
});


// ====================================
// 敵
// ====================================
phina.define('Enemy', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(x, y, pattern) {
    this.superInit({
      width: BOX_SIZE / 2,
      height: BOX_SIZE / 2,
      fill: 'white',
      stroke: null,
      x: x,
      y: y,
    });

    this.vx = 0;
    this.vy = 0;
    this.maxVx = 12;
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

    // 敵のパターン
    this.pattern = pattern;
    switch (this.pattern) {
      case 1:
        this.fill = "red";
        this.speed = 5;
        this.height = BOX_SIZE;
        this.vx = -this.speed;
        this.rlFlag = -1;
        break;

      case 2:
        this.fill = "white";
        this.speed = 10;
        this.width = BOX_SIZE;
        this.vx = -this.speed;
        this.rlFlag = -1;
        break;

      default:
        this.fill = "green";
        this.vx = -this.speed;
        this.rlFlag = -1;
    }
  },

  /**
   * 更新
   */
  update: function(app) {
    // 落下
    if (!this.onFloor) {
      if (this.vy < this.maxVy) {
        this.vy += GRAVITY;
      }
    }

    // パターンによる移動の違い
    switch (this.pattern) {
      case 1:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
          } else {
            this.vx = -this.speed;
          }
        }
        break;

      case 2:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
          } else {
            this.vx = -this.speed;
          }
        }
        break;
      
      default:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
          } else {
            this.vx = -this.speed;
          }
        }
        break;
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