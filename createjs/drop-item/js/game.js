/**
 * プレイヤー
 */
var Player = (function() {
  var constructor, p;
  constructor = function(x, y) {
    var size = 80;
    var container = new createjs.Container();
    container.x = x-(size/2);
    container.y = y-(size/2);
    container.size = size;
    
    var shape = new createjs.Shape();
    shape.graphics.beginFill("black").drawRect(0, 0, size, size);
    shape.alpha = 0.5;
    container.addChild(shape);

    var ss = new createjs.SpriteSheet({
      images: ['/drop-item/images/player.png'],
      frames: [
        [0, 0, 500, 500, 0, 0, 0], // x, y, width, height, imageIndex*, regX*, regY*
        [0, 500, 500, 500, 0, 0, 0],
      ],
      animations: {
        run: {
          frames: [0, 1],
          speed: 0.1,
        }
      }
    });

    var animation = new createjs.Sprite(ss, "run");
    animation.scaleX = animation.scaleY = 0.16;
    animation.x = 0;
    animation.y = 0;
    animation.play();
    container.addChild(animation);

    return container;
  };
  p = constructor.prototype;
  return constructor;
})();


/**
 * 雪だるまゲーム
 */
var game = new Leonardo();

/**
 * 初期化
 */
game.init = function() {
  var self = this;

  // Retinaを考慮したキャンバスサイズを取得
  var width = this.divisionRetina(this.canvas.width);
  var height = this.divisionRetina(this.canvas.height);

  // state
  this.position = height-100;
  
  // 背景
  var bg = new createjs.Shape();
  bg.graphics.beginFill("#41a3c1").drawRect(0, 0, width, height);
  bg.x = bg.y = 0;
  this.stage.addChild(bg);

  // 床
  var floor = new createjs.Shape();
  floor.graphics.beginFill("white").drawRect(0, 0, width, height);
  floor.x = 0;
  floor.y = this.position;
  this.stage.addChild(floor);

  // プレイヤー
  this.player = new Player(width/2, this.position);
  this.stage.addChild(this.player);

  // ステージをクリックするとプレイヤーを移動
  this.speed = 2;
  this.moveRight = false;
  this.stage.on('click', function(e) {
    self.moveRight = !self.moveRight;
  });
};

/**
 * 更新
 */
game.update = function(e) {
  // プレイヤーの移動
  this.player.x += this.moveRight ? this.speed : -this.speed;
  if (this.player.x <= 0) {
    this.player.x = 0;
  } else if (this.player.x >= (this.divisionRetina(this.stage.canvas.width) - this.player.size)) {
    this.player.x = this.divisionRetina(this.stage.canvas.width)-this.player.size;
  }
};