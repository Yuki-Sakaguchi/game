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

  // デフォルトのオプション
  this.options = {
    selector: 'game',
    autoPlay: true,
    targetList: {
      color: 'red',
      point: 100,
      speed: 200,
      life: 300,
      par: 60
    }
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
    }.bind(this));
  }
};

/**
 * 初期化
 */
Game.prototype.init = function() {
  console.log('init');

  // canvasサイズの設定
  this.canvas = document.querySelector('#' + this.options.selector);
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;

  // FPS
  createjs.Ticker.timingMode = createjs.Ticker.RAF;

  // 自動再生がonの場合は初期化後にすぐプレイ
  if (this.options.autoPlay) {
    this.play();
  }
};

/**
 * ゲーム開始
/**
 *
 *
 */
Game.prototype.play = function() {
  console.log('play');

  var self = this;

  // ステージ作成
  var stage = new createjs.Stage(this.options.selector);

  // 金魚ガチャ
  var targetList = new Gacha(this.options.targetList);

  // 魚のリスト
  var fishList = [];

  // 更新された回数
  var tickCount = 0;

  // 魚を生成する数
  var MAX_COUNT = 1;

  // スコアの位置
  var scoreY = this.canvas.height - 40;

  // タッチ操作も可能にする(iOS,Android向け)
  if (createjs.Touch.isSupported()) {
    createjs.Touch.enable(stage);
  }

  // ポイント表示
  var point = 0;
  var fontStyle = "16px sans-serif";
  var fontColor = "white";
  var pointTitle = new createjs.Text('SCORE', fontStyle, fontColor);
  pointTitle.x = 20;
  pointTitle.y = scoreY;
  stage.addChild(pointTitle);
  var pointText = new createjs.Text(point, fontStyle, fontColor);
  pointText.x = 120;
  pointText.y = scoreY;
  stage.addChild(pointText);

  // タイマー
  var timer = 30;
  var timerTitle = new createjs.Text('TIME', fontStyle, fontColor);
  timerTitle.x = (this.canvas.width/2) + 20;
  timerTitle.y = scoreY;
  stage.addChild(timerTitle);
  var timerText = new createjs.Text(timer, fontStyle, fontColor);
  timerText.x = (this.canvas.width/2) + 120;
  timerText.y = scoreY;
  stage.addChild(timerText);

  // 時間制限をスタート
  var gameTimer = setInterval(function() {
    timer--;
    timerText.text = timer;
    stage.addChild(timerText);
    if (timer < 0) {
      clearInterval(gameTimer);
      if (point >= 500) {
        alert('GAME CLEAR -> [' + point + ']');
      } else {
        alert('GAME OVER -> [' + point + ']');
      }
      createjs.Ticker.removeAllEventListeners();
      stage.removeAllEventListeners();
    }
  }.bind(this), 1000);

  /**
   * 画面更新
   */
  function handleTick(event) {
    // 時間を追加
    tickCount++;
  
    // 一定の時間ごとに金魚を生成
    if (tickCount % 30 == 0) {
      emitfishList();
    }

    // パーティクルを更新
    updatefishList();

    // 画面を更新する
    stage.update();
  }

  /**
   * 金魚を生成
   */
  function emitfishList() {
    // パーティクルの生成
    for (var i = 0; i < MAX_COUNT; i++) {
      // 金魚の情報を設定
      var info = targetList.gacha();

      // オブジェクトの作成
      var fish = new createjs.Shape();
      fish.graphics
          .beginFill(info.color)
          .drawCircle(0, 0, 30);

      // 金魚にデータを追加
      var offset = 20;
      fish.life = info.life;
      fish.point = info.point;
      fish.speed = info.speed;
      fish.compositeOperation = "lighter";
      fish.x = self.random(offset, window.innerWidth - offset);
      fish.y = self.random(offset, window.innerHeight - offset);
      stage.addChild(fish);

      // 金魚の移動
      createjs.Tween.get(fish)
      .to({
        x: fish.x + (fish.speed * (Math.random() - 0.5)),
        y: fish.y + (fish.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: fish.x + (fish.speed * (Math.random() - 0.5)),
        y: fish.y + (fish.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: fish.x + (fish.speed * (Math.random() - 0.5)),
        y: fish.y + (fish.speed * (Math.random() - 0.5)),
      }, 1000)
      .to({
        x: fish.x + (fish.speed * (Math.random() - 0.5)),
        y: fish.y + (fish.speed * (Math.random() - 0.5)),
      }, 1000)
      .call(function() {
        stage.removeChild(fish);
      });

      // 金魚をクリックした時
      fish.on('click', function() {
        // ポイントを追加
        point += this.point;
        pointText.text = point;
        stage.addChild(pointText);

        // 取得したポイントを表示
        var textColor = 'white';
        if (this.point < 0) {
          textColor = "red";
        }

        // ポイントのテキスト
        var t = new createjs.Text(this.point, "24px sans-serif", textColor);
        t.x = this.x;
        t.y = this.y;
        t.textAlign = "center";
        t.textBaseline = "bottom";
        stage.addChild(t);

        // 金魚の位置を取得
        var x = this.x;
        var y = this.y;

        // テキストを上に移動させながら消す
        createjs.Tween.get(t)
        .to({
          x: x,
          y: y - 20,
          alpha: 0
        }, 1000)
        .call(function() {
          stage.removeChild(t);
        });

        // 金魚自体を削除
        stage.removeChild(this);

        // 配列からも削除
        for (var j = 0; j < fishList.length; j++) {
          if (this == fishList[j]) {
            fishList.splice(j, 1);
          }
        }
      });

      fishList.push(fish);
    }
  }
  
  /**
   * 魚を更新
   */
  function updatefishList() {
    // パーティクルの計算を行う
    for (var i = 0; i < fishList.length; i++) {
      // オブジェクトの作成
      var fish = fishList[i];
     
      // 寿命を減らす
      fish.life -= 1;

      // 寿命の判定
      if (fish.life <= 0) {
        // ステージから削除
        stage.removeChild(fish);
        // 配列からも削除
        fishList.splice(i, 1);
      }
    }
  }

  // 更新の実行
  createjs.Ticker.addEventListener("tick", handleTick);
};

/**
 * ランダムで数値を生成
 */
Game.prototype.random = function(min, max) {
  return Math.random() * (max - min) + min;
};

/**
 * ガチャガチャ機能を有する変数（クラス）
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