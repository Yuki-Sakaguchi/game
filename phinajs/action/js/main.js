// phina展開
phina.globalize();


// ====================================
// 定数
// ====================================
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;
var BOX_SIZE = 32;
var BTN_AREA_HEIGHT = BOX_SIZE * 6;
var GRAVITY = 1.8;

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
    this.shotGroup = DisplayElement().addChildTo(this);
    this.stageGroup = DisplayElement().addChildTo(this);
    this.playerGroup = DisplayElement().addChildTo(this);
    this.enemyGroup = DisplayElement().addChildTo(this);
    this.btnGroup = DisplayElement().addChildTo(this);
    
    // プレイヤー
    this.player = Player(100, 100, this.shotGroup).addChildTo(this.playerGroup);

    // マップ生成
    this.map = Map(this.stageGroup, this.eventGroup, this.enemyGroup, this.shotGroup);
    this.map.loading('text', 'stage1', 'stage1_evt', this.player, 100, 100);

    // ボタン生成
    Btn(this.player).addChildTo(this.btnGroup);
  },

  /**
   * 更新
   */
  update: function(app) {
    // プレイヤー判定
    this.collisionX(this.playerGroup, this.stageGroup);
    this.collisionY(this.playerGroup, this.stageGroup);
    this.collisionEvent(this.playerGroup, this.eventGroup, this.map);
    this.collisionEnemy(this.playerGroup, this.enemyGroup);

    // 敵の判定
    this.collisionX(this.enemyGroup, this.stageGroup);
    this.collisionY(this.enemyGroup, this.stageGroup);
    this.collisionShot(this.shotGroup, this.enemyGroup);

    // ショットと壁
    this.collisionBlock(this.stageGroup, this.shotGroup);

    // マップの移動
    this.map.move(this.player);
  },

  /**
   * 敵とのあたり判定
   */
  collisionEnemy: function(players, enemys) {
    players.children.some(function(player) {
      enemys.children.some(function(enemy) {
        if (Collision.testRectRect(player, enemy)) {
          player.hitEnemy();
          enemy.hitPlayer();
        }
      });
    });
  },

  /**
   * 壁とショット
   */
  collisionBlock: function(stages, shots) {
    stages.children.some(function(stage) {
      shots.children.some(function(shot) {
        if (Collision.testRectRect(stage, shot)) {
          shot.hitEvent();
          stage.hitShot(shot);
        }
      });
    });
  },

  /**
   * 敵とショットのあたり判定
   */
  collisionShot: function(shots, enemys) {
    shots.children.some(function(shot) {
      enemys.children.some(function(enemy) {
        if (Collision.testRectRect(shot, enemy)) {
          shot.hitEnemy();
          enemy.hitShot(shot);
        }
      })
    });
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
  collisionEvent: function(players, events, map) {
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
  init: function(x, y, shotGroup) {
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

    // 透明
    this.alphaTime = 30;
    this.alphaCount = this.alphaTime;

    // 攻撃
    this.shotCount = 3;
    this.shotAngle = 270;
    this.shotGroup = shotGroup;
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

    // 左に
    if (this.key.getKey('left')) {
      this.moveLeft();
    }

    // 右に
    if (this.key.getKey('right')) {
      this.moveRight();
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
      this.jump();
    }

    // ジャンプのカウント
    if (this.key.getKeyDown('space')) {
      this.jumpStart();
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

    // ダメージを食らった時の半透明
    if (this.alphaCount < this.alphaTime) {
      this.alphaCount++;
      if (this.alphaCount == 1) {
        // ノックバック
        if (this.direction == DIRECTION.LEFT) {
          this.vx += 10;
        } else {
          this.vx -= 10;
        }
        this.vy -= 10;
      }
      this.alpha = 0.5;
    } else if (this.alphaCount === this.alphaTime) {
      this.alpha = 1;
    }

    // ショットを打つ
    if (this.key.getKey('a')) {
      this.shotCount++;
      if (this.shotCount <= 1) {
        switch (this.direction) {
          case DIRECTION.RIGHT:
            this.shotAngle = 0;
            break;
          case DIRECTION.UP:
            this.shotAngle = 90;
            break;
          case DIRECTION.DOWN:
            this.shotAngle = 270;
            break;
          case DIRECTION.LEFT:
            this.shotAngle = 180;
            break;
        }
        Shot(this.x, this.y, this.shotAngle, 30).addChildTo(this.shotGroup);
      }
    } else {
      this.shotCount = 0;
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
  },

  /**
   * 敵とヒット
   */
  hitEnemy: function() {
    if (this.alphaCount === this.alphaTime) {
      this.alphaCount = 0;
    }
  },

  /**
   * ジャンプ
   */
  jump: function() {
    // ジャンプ
    if (this.jumpCount <= this.maxJumpCount) {
      this.jumpPower++;
      if (this.jumpPower <= this.maxJumpPower) {
        this.vy += -this.jumpSpeed;
        this.onFloor = false;
      }
    }
  },

  /**
   * ジャンプスタート直後
   */
  jumpStart: function() {
    if (this.jumpCount < this.maxJumpCount) {
      this.jumpCount++;
      this.jumpPower = 0;
      this.vy = 0;
    }
  },

  /**
   * 左に移動
   */
  moveLeft: function() { 
    this.vx += -this.speed;
    this.direction = DIRECTION.LEFT;
  },

  /**
   * 右に移動
   */
  moveRight: function() {
    this.vx += this.speed;
    this.direction = DIRECTION.RIGHT;
  }
});


// ====================================
// 攻撃
// ====================================
phina.define('Shot', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(x, y, angle, speed) {
    this.superInit({
      fill: 'pink',
      stroke: null,
      width: 10,
      height: 10,
      x: x,
      y: y
    });

    this.power = 3;
    this.speed = speed;
    this.angle = (angle).toRadian();
    this.hp = 1;
  },

  /**
   * 更新
   */
  update: function(app) {
    this.vx = this.speed * Math.cos(this.angle);
    this.vy = -this.speed * Math.sin(this.angle);

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > SCREEN_WIDTH || this.y < 0 || this.y > (SCREEN_HEIGHT - BTN_AREA_HEIGHT)) {
      this.remove();
    }
  },

  /**
   * 敵との接触
   */
  hitEnemy: function() {
    this.remove();
  },

  /**
   * イベントとの接触
   */
  hitEvent: function() {
    this.remove();
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
  init: function(stageGroup, eventGroup, enemyGroup, shotGroup) {
    this.superInit();
    this.stageGroup = stageGroup;
    this.eventGroup = eventGroup;
    this.enemyGroup = enemyGroup;
    this.shotGroup = shotGroup;
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
          Block('normal', j * BOX_SIZE, i * BOX_SIZE).addChildTo(this.stageGroup);
        }
        if (map[i][j] === 'W') {
          Block('break', j * BOX_SIZE, i * BOX_SIZE).addChildTo(this.stageGroup);
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
      // Doorイベントの場合ドアを作成
      if (event[i][0] === 'Door') {
        var tmpX = Number(event[i][1]);
        var tmpY = Number(event[i][2]);
        var tmpNextMap = event[i][3];
        var tmpNextEvent = event[i][4];
        var tmpNextX = Number(event[i][5]);
        var tmpNextY = Number(event[i][6]);
        Door(tmpX, tmpY, tmpNextMap, tmpNextEvent, tmpNextX, tmpNextY).addChildTo(this.eventGroup);
      }

      // 敵の作成
      if (event[i][0] === 'Enemy') {
        var tmpX = Number(event[i][1]);
        var tmpY = Number(event[i][2]);
        var tmpPattern = Number(event[i][3]);
        Enemy(tmpX, tmpY, tmpPattern).addChildTo(this.enemyGroup);
      }
    }

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
  move: function(player) {
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
    } else if (this.absdisY > this.mapHeight - (SCREEN_HEIGHT - BTN_AREA_HEIGHT)) {
      offset.vy -= (this.absdisY - (this.mapHeight - (SCREEN_HEIGHT - BTN_AREA_HEIGHT)));
      this.absdisY = this.mapHeight - (SCREEN_HEIGHT - BTN_AREA_HEIGHT);
    }

    // プレイヤーの位置調整
    player.x += -offset.vx;
    player.y += -offset.vy;
    
    // ステージの位置調整
    this.stageGroup.children.some(function(block) {
      block.x += -offset.vx;
      block.y += -offset.vy;
    });

    // イベントの位置調整
    this.eventGroup.children.some(function(block) {
      block.x += -offset.vx;
      block.y += -offset.vy;
    });

    // 敵の位置調整
    this.enemyGroup.children.some(function(enemy) {
      enemy.move();
      enemy.x += -offset.vx;
      enemy.y += -offset.vy;
    });

    // 敵の位置調整
    this.shotGroup.children.some(function(shot) {
      shot.x += -offset.vx;
      shot.y += -offset.vy;
    });
  },

  /**
   * オフセット計算
   */
  calcOffset: function(player) {
    return {
      vx: player.x - SCREEN_WIDTH / 2,
      vy: player.y - (SCREEN_HEIGHT - BTN_AREA_HEIGHT) / 2
    };
  },

  /**
   * マップの削除
   */
  removes: function() {
    this.stageGroup.children.clear();
    this.eventGroup.children.clear();
    this.enemyGroup.children.clear();
  }
});


// ====================================
// ボタン
// ====================================
phina.define('Btn', {
  superClass: 'RectangleShape',

  /**
   * 初期化
   */
  init: function(player) {
    this.superInit({
      width: SCREEN_WIDTH,
      height: BTN_AREA_HEIGHT,
      fill: "#30579b",
      stroke: null,
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT - (BTN_AREA_HEIGHT / 2)
    });
    this.setInteractive(true);
    this.player = player;

    // 右ボタン生成
    this.rightBtn = this.createBtn('right', this.x / 1.6, 0);

    // 左ボタン生成
    this.leftBtn = this.createBtn('left', -this.x / 1.6, 0);

    // 真ん中ボタン生成
    this.centerBtn = this.createBtn('center', 0, 0);
  },

  /**
   * ボタン生成
   */
  createBtn: function(text, x, y, func) {
    // ボタンの影
    var shadowHeight = 10;
    var shadow = RectangleShape({
      width: (SCREEN_WIDTH - 200) / 3,
      height: shadowHeight,
      stroke: null,
      fill: '#367ABD'
    }).addChildTo(this);
    
    // ボタン
    var btn = RectangleShape({
      width: (SCREEN_WIDTH - 200) / 3,
      height: (BTN_AREA_HEIGHT - shadowHeight) / 1.5,
      stroke: null,
      fill: '#4CB2D4'
    }).addChildTo(this);

    // 三角形
    this.createTriangle(text, btn);

    // 配置
    btn.setPosition(x, y - shadowHeight / 2);
    shadow.setPosition(x, y + btn.height/2);

    // アニメーション用の位置保存
    var beforeY = btn.y;
    var afterY = btn.y + shadowHeight;
    
    btn.isActive = false;

    // タッチ開始
    btn.setInteractive(true);
    btn.onpointstart = function() {
      btn.isActive = true;
      btn.tweener.clear()
      .to({
        y: afterY
      }, 50);
    };
   
    // タッチ終了
    btn.onpointend = function() {
      btn.tweener.clear()
      .to({
        y: beforeY
      }, 50);
      btn.isActive = false;
    };

    return btn;
  },

  /**
   * 更新
   */
  update: function(app) {
    if (this.rightBtn.isActive) {
      this.player.moveRight();
    }

    if (this.leftBtn.isActive) {
      this.player.moveLeft();
    }

    if (this.centerBtn.isActive) {
      this.player.jump();
    }
  },

  /**
   * 三角形
   */
  createTriangle: function(text, btn) {
    var traiangle = TriangleShape({
      width: btn.width / 2,
      height: btn.height / 2,
      fill: 'white',
      stroke: null
    }).addChildTo(btn);

    // 向き変更
    switch (text) {
      case 'right':
        traiangle.rotation = 90;
        break;
      case 'left':
        traiangle.rotation = 270;
        break;
      default:
        traiangle.rotation = 0;
    }
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
  init: function(text, x, y) {
    this.superInit({
      width: BOX_SIZE,
      height: BOX_SIZE + 1, // ジャンプした時に隙間ができるので大きめにした
      x: x + BOX_SIZE / 2,
      y: y + BOX_SIZE / 2,
      stroke: null,
    });
    this.type = text;
    this.MAX_HP = 5;
    this.hp = this.MAX_HP;

    switch (text) {
      case 'break':
        this.fill = '#4CB2D4';
        break;
      default:
        this.fill = '#30499B';
    }
  },

  /**
   * ショットが当たった時
   */
  hitShot: function(shot) {
    if (this.type == 'break') {
      this.hp -= shot.power;
      
      // 透明度
      this.alpha = this.hp / 10;

      if (this.hp < 0) {
        this.remove();
      }
    }
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
      fill: 'black',
      stroke: 'white',
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

    this.className = 'Enemy';
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
    this.maxJumpCount = 1; // ジャンプの最大回数
    this.direction = DIRECTION.LEFT;
    this.onFloor = false;
    this.isDead = false;

    // 透明
    this.alphaTime = 30;
    this.alphaCount = this.alphaTime;
    this.knockback = 0;

    this.hp = 5;

    // 敵のパターン
    this.pattern = pattern;
    switch (this.pattern) {
      case 1:
        this.fill = "#EE4035";
        this.speed = 4;
        this.height = BOX_SIZE;
        this.vx = -this.speed;
        this.rlFlag = -1;
        break;

      case 2:
        this.fill = "white";
        this.speed = 6;
        this.width = BOX_SIZE;
        this.vx = -this.speed;
        this.rlFlag = -1;
        break;

      case 3:
        this.fill = "gray";
        this.speed = 8;
        this.width = BOX_SIZE;
        this.height = BOX_SIZE;
        this.vx = -this.speed;
        this.rlFlag = -1;
        break;

      default:
        this.fill = "#56B949";
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

    // ダメージを食らった時の半透明
    if (this.alphaCount < this.alphaTime) {
      this.alphaCount++;
      if (this.alphaCount == 1) {
        // ノックバック
        this.vx += this.knockback;
        this.vy -= 10;
      }
      this.alpha = 0.5;
    } else if (this.alphaCount === this.alphaTime) {
      this.alpha = 1;
    }

    // パターンによる移動の違い
    switch (this.pattern) {
      case 1:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
            this.direction = DIRECTION.RIGHT;
          } else {
            this.vx = -this.speed;
            this.direction = DIRECTION.LEFT;
          }
        }
        break;

      case 2:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
            this.direction = DIRECTION.RIGHT;
          } else {
            this.vx = -this.speed;
            this.direction = DIRECTION.LEFT;
          }
        }
        break;

      case 3:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
            this.direction = DIRECTION.RIGHT;
          } else {
            this.vx = -this.speed;
            this.direction = DIRECTION.LEFT;
          }
        }

        // ずっとジャンプ
        this.jump();
        break;
      
      default:
        // 移動できなくなったら逆向きに移動
        if (this.vx == 0) {
          this.rlFlag = -this.rlFlag;
          if (this.rlFlag > 0) {
            this.vx = this.speed;
            this.direction = DIRECTION.RIGHT;
          } else {
            this.vx = -this.speed;
            this.direction = DIRECTION.LEFT;
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
  },

  /**
   * プレイヤーとヒット
   */
  hitPlayer: function() {

  },

  /**
   * shotに当たった時の処理
   */
  hitShot: function(shot) {
    // 死んでたら当たらない
    if (this.isDead) {
      return false;
    }

    // ダメージ
    this.hp -= shot.power;
    if (this.hp < 0) {
      // 消す
      this.isDead = true;
      this.tweener
      .clear()
      .by({y: -50, rotation: 360 * 3}, 300, 'swing')
      .call(function() {
        this.remove();
      }.bind(this));
      return false;
    }

    // ノックバック
    if ((shot.angle).toDegree() == 0) {
      // 右から当たった
      this.knockback = shot.speed;
    } else if ((shot.angle).toDegree() == 180) {
      // 左から当たった
      this.knockback = -shot.speed;
    } else {
      // それ以外の場合は向きに依存
      if (this.direction == DIRECTION.LEFT) {
        this.knockback = shot.speed;
      } else if (this.direction == DIRECTION.RIGHT) {
        this.knockback = -shot.speed;
      } else {
        this.knockback = 0;
      }
    }

    // 半透明
    if (this.alphaCount === this.alphaTime) {
      this.alphaCount = 0;
    }
  },

  /**
   * ジャンプ
   */
  jump: function() {
    // ジャンプ
    this.jumpPower++;
    if (this.jumpPower <= this.maxJumpPower) {
      this.vy += -this.jumpSpeed;
      this.onFloor = false;
    }
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