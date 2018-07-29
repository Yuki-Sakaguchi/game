/**
 * 金魚すくいゲーム
 *    create.jsに依存してます
 */

/**
 * TODO
 *    - 金魚の種類はjson形式で決定
 *    - 時間帯で金魚の種類を決める（読み込むjsonを切り替える）
 *    - 
 */

var Game = function(options) {
  // デフォルトの金魚リスト
  var targetList = [
    {
      color: 'red',
      point: 20,
      speed: 200,
      life: 300,
      par: 60
    },
    {
      color: 'blue',
      point: 50,
      speed: 400,
      life: 100,
      par: 20
    },
    {
      color: 'pink',
      point: -20,
      speed: 200,
      life: 300,
      par: 20
    },
    {
      color: 'yellow',
      point: 1000,
      speed: 200,
      life: 100,
      par: 5
    }
  ];

  // デフォルトのオプション
  this.options = {
    selector: 'game',
    targetList: targetList,
  };

  // オプションの上書き
  this.setOption(options);

  // 初期化処理
  this.init();
};

/** 
 * オプションを設定
 */
Game.prototype.setOption = function(options) {
  if (options) {
    Object.keys(options).forEach(function(key) {
      this.options[key] = options[key];
    }.this(this));
  }
};

/**
 * 初期化
 */
Game.prototype.init = function() {
  console.log('init');

  // ステージ作成
  this.stage = new createjs.Stage(this.options.selector);

  var targetList = new Gacha(this.options.targetList);

  var particles = [];

  var point = 0;
  var pointText = new createjs.Text(point, "24px sans-serif", "white");
  pointText.x = 20;
  pointText.y = 20;
  this.stage.addChild(pointText);

  var timer = 30;
  var timerText = new createjs.Text(timer, "24px sans-serif", "white");
  timerText.x = 20;
  timerText.y = 50;
  this.stage.addChild(timerText);

  var gameTImer = setInterval(function() {
    timer -= 1;
    timerText.text = timer;
    this.stage.addChild(timerText);

    if (timer <= 0) {
      clearInterval(gameTImer);
      if (point >= 500) {
        alert('GAME CLEAR -> [' + point + ']');
      } else {
        alert('GAME OVER -> [' + point + ']');
      }
      createjs.Ticker.removeAllEventListeners();
      this.stage.removeAllEventListeners();
    }
  }.bind(this), 1000);

  // タッチ操作も可能にする(iOS,Android向け)
  if (createjs.Touch.isSupported()) {
    createjs.Touch.enable(this.stage);
  }

  // tick イベントの登録
  createjs.Ticker.timingMode = createjs.Ticker.RAF;

  // 更新
  createjs.Ticker.addEventListener("tick", function(e) {
    handleTick.call(this, e);
  }.bind(this));

  var count = 0;
  function handleTick(event) {
    // パーティクルを発生

    count++;
    
    if (count % 30 == 0) {
      emitParticles.call(this);
    }

    // パーティクルを更新
    updateParticles.call(this);

    // 画面を更新する
    this.stage.update();
  }

  var count = 0; // tick イベントの回数
  var MAX_COUNT = 1;

  // パーティクルを発生させます
  function emitParticles() {
    // パーティクルの生成
    for (var i = 0; i < MAX_COUNT; i++) {
      // カウントの更新
      count += 1;

      // 金魚の情報を設定
      var info = targetList.gacha();

      // オブジェクトの作成
      var particle = new createjs.Shape();
      particle.graphics
              .beginFill(info.color)
              .drawCircle(0, 0, 30);

      particle.life = info.life;
      particle.point = info.point;
      particle.speed = info.speed;
              
      this.stage.addChild(particle);
      particle.compositeOperation = "lighter";

      // パーティクルの発生場所
      particle.x = this.random(200, 760);
      particle.y = this.random(200, 340);
      
      // 動的にプロパティーを追加します。
      // 速度
      // particle.vx = 5 * (Math.random() - 0.5);
      // particle.vy = 5 * (Math.random() - 0.5);
      // particle.vx = 0;
      // particle.vy = 1;

      var textColor;
      if (particle.point < 0) {
        textColor = "red";
      } else {
        textColor = "white";
      }

      particle.on('click', function() {
        var t = new createjs.Text(this.point, "24px sans-serif", textColor);
        t.x = this.x;
        t.y = this.y;
        t.textAlign = "center";
        t.textBaseline = "bottom";
        this.stage.addChild(t);

        var x = this.x;
        var y = this.y;

        point += this.point;
        pointText.text = point;
        this.stage.addChild(pointText);

        createjs.Tween.get(t)
        .to({
          x: x,
          y: y - 20,
          alpha: 0
        }, 1000)
        .call(function() {
          this.stage.removeChild(this);
        });

        this.stage.removeChild(this);
        // 配列からも削除
        particles.splice(i, 1);
      });

      // パーティクルの移動
      createjs.Tween.get(particle)
      .to({
        x: particle.x + (particle.speed * (Math.random() - 0.5)),
        y: particle.y + (particle.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: particle.x + (particle.speed * (Math.random() - 0.5)),
        y: particle.y + (particle.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: particle.x + (particle.speed * (Math.random() - 0.5)),
        y: particle.y + (particle.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: particle.x + (particle.speed * (Math.random() - 0.5)),
        y: particle.y + (particle.speed * (Math.random() - 0.5)),
      }, 1000)
      .call(function() {
        this.stage.removeChild(particle);
      }.bind(this));

      particles.push(particle);
    }
  }

  // パーティクルを更新します
  function updateParticles() {
    // パーティクルの計算を行う
    for (var i = 0; i < particles.length; i++) {
      // オブジェクトの作成
      var particle = particles[i];

      // // 重力
      // particle.vy += 1;
      
      // 摩擦
      // particle.vx *= 0.99;
      // particle.vy *= 0.99;

      // 速度を位置に適用
      // particle.x += particle.vx;
      // particle.y += particle.vy;

      // 地面
      // if (particle.y > this.stage.canvas.height) {
      //   particle.y = this.stage.canvas.height; // 行き過ぎ補正
      //   particle.vy *= -1; // Y軸の速度を反転
      // }

      // パーティクルのサイズをライフ依存にする
      // var scale = particle.life / MAX_LIFE;
      // particle.scaleX = particle.scaleY = scale;
      
      // 寿命を減らす
      particle.life -= 1;
      // 寿命の判定
      if (particle.life <= 0) {
        // ステージから削除
        this.stage.removeChild(particle);
        // 配列からも削除
        particles.splice(i, 1);
      }
    }
  }
};

/**
 * ランダムで数値を生成
 */
Game.prototype.random = function(min, max) {
  return Math.random() * (max - min) + min;
};

/**
 * ゲーム開始
 */
Game.prototype.play = function() {
  console.log('play');
};



/**
 * ガチャガチャ機能を有する変数（クラス）
 * 引数　gachalist(アイテム名と重みの多重配列）
 * 例） スライム１０匹に対してはぐれメタルが１匹程度の割合
 *       [
 *        ['スライム', 10],
 *        ['はぐれメタル', 1]
 *       ] 
 */
var Gacha = function(gachalist) {
	//thisを扱い易くするために変数に保存
	var self = this;

	//引数のガチャの中身と重み（多重配列）を保存
	self.lists = gachalist;

	//引数のガチャの中身と重み（多重配列）を元に全体の重みを計算
	self.totalWeight = (function() {
		var sum = 0;//合計保存用変数

    //listsの中を全て取り出すループ
		self.lists.forEach(function(list) {
			sum += list.par;//配列に入っている確率の値を足す
		});
		return sum;//全ての確率値を足した値を
	}());
}

/**
 * ガチャを一回回すメソッド
 * Gachaオブジェクト生成時に渡した多重配列を元に一つ出力する
 */
Gacha.prototype.gacha = function() {
	//ランダムで値を生成（0〜totalWeightの間の数）
	var r = Math.random() * this.totalWeight;

	//重み保存用変数
	var s = 0.0;

	//リストを順に取り出して、ランダムで生成した値rと比べて対象のアイテムを決めるて返す
	for (list in this.lists) {
		s += this.lists[list].par;//ガチャの中身から重みを取得
		
		//ランダムの値と取得した重みを比べて対象のアイテムだった場合
		if (r < s) {
			//アイテム名を取得し、返す
			return this.lists[list];
		}
	}
}