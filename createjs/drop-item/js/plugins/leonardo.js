/** 
 * @fileoverview Leonardo.js
 *    create.jsに依存したフレームワーク
 *    処理の作成に集中できるように、その他気にしないといけないことはこれがやってくれる
 * @author Yuki Sakaguchi
 */
var Leonardo = (function() {
  var CLASS_NAME = 'Leonardo';
  var constructor, p;
  var isIos = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  var isAndroid = navigator.userAgent.indexOf('Android') > 0;

  /**
   * コンストラクタ
   * @param {Array} options 設定用オブジェクト
   * @constructor
   */
  constructor = function(options) {
    var self = this;

    // オプション
    this.options = {
      target: '#canvas',
      isRetina: true,
      isTouch: true,
      fps: 60,
      parent: null,
    };

    // オプション上書き
    if (options) {
      Object.keys(options).forEach(function(key) {
        self.options[key] = options[key];
      });
    }

    // ポーズ状態かどうか
    this.isPause = false;

    // 要素
    this.parent = this.options.parent ? document.querySelector(this.options.parent) : null;
    this.canvas = document.querySelector(this.options.target);

    // 経過時間
    this.timer = 0;
    this.totalTime;
    this._initTimer();

    // 初期化処理
    this._initStage();
    
    // リサイズ時の処理
    var resizeTimer = 0;
    window.addEventListener('resize', function() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        self._resizeHandle();
      }, 200);
    });
  };
  
  // コンストラクタのプロトタイプを一時保存
  p = constructor.prototype;

  /**
   * stageで使う変数の設定
   *    このコンストラクタで作成したインスタンスでinit関数を上書きしてください
   *    stageの更新が始まる前に１度だけ動く処理です
   *    stageで使う変数をthisに定義して、update関数で使えるようにします
   */
  p.init = function() {
    throw new Error(CLASS_NAME + 'コンストラクタで作ったインスタンスにinit関数を定義し、stageの更新で使う変数、関数を定義してください。\n※ init関数ではthis.stageでstageにアクセスできます。\n※ init関数では変数をthisに定義すればupdate関数で利用することができます。\n※ update関数で何もつかわない場合でも中身は空っぽで良いのでinit関数を定義してください。');
  };

  /**
   * stage更新のメインループ
   *    このコンストラクタで作成したインスタンスでupdate関数を上書きしてください
   *    fpsを元に処理されるメインループの処理です
   *    init関数で定義した関数を使ってstageを更新します
   *    この関数内で明示的にstage.update関数をする必要はありません
   *    引数には"tick"イベントが入ってきます
   */
  p.update = function() {
    throw new Error(CLASS_NAME + 'コンストラクタで作ったインスタンスにupdate関数を定義し、メインループ処理を設定してください。\n※ updade関数ではthis.stageでstageにアクセスできます。\n※ updade関数ではinit関数で定義した変数をthis経由で使用できます。\n※ stage.update()はupdade関数の直後に自動で実行されるのでupdate関数内でstege.update()を実行する必要はありません。\n※ update関数の引数には"tick"イベントが入ってきます');
  };

  /**
   * 処理を開始
   *    諸々の初期化を行い、tickイベントでstage.update()を行う
   *    独自に更新処理はupdate()に記述しておく
   */
  p.play = function() {
    var self = this;

    // 初期設定
    try {
      this.init();
    } catch(e) {
      console.error(e);
      return false;
    }

    // fps設定
    if (this.options.fps && this.options.fps != 60) {
      // 60以外の場合はそれを優先
      createjs.Ticker.framerate = this.options.fps;
    } else {
      // 60の場合はちょうどよく判定してくれるやつにする
      createjs.Ticker.timingMode = createjs.Ticker.RAF;
    }

    // 更新処理
    createjs.Ticker.addEventListener('tick', function(event) {
      if (self.isPause) return false;
      try {
         self.update(event);
      } catch(e) {
        self._clearStage();
        console.error(e);
      }
      self.stage.update();
    });

    // タイムの測定
    this.timer = setInterval(function() {
      if (self.isPause) return false;
      self.totalTime.ms++;
      self.totalTime.s = Math.floor(self.totalTime.ms/100);
      self.totalTime.m = Math.floor(self.totalTime.s/60);
    }, 10);

    // stageの初回更新
    this.stage.update();
  };

  /**
   * stageの更新を止める
   */
  p.pause = function() {
    this.isPause = !this.isPause;
  };

  /**
   * stageを初期化して初めから動かす
   */
  p.reset = function() {
    this._clearStage();
    this._initTimer();
    this._initStage();
    this.play();
  };

  /**
   * 総タイムを元に表示用に整形された値を返す
   * @param {boolean} isZeroPadding trueの場合値をゼロ詰めする
   * @return {Object} ms, s, mを持つオブジェクト
   */
  p.getDispTime = function(isZeroPadding) {
    var dispTime = {
      ms: Math.floor(this.totalTime.ms%100),
      s: Math.floor(this.totalTime.s%60),
      m: this.totalTime.m,
    };
    if (isZeroPadding) {
      dispTime.ms = this.zeroPadding(dispTime.ms, 2);
      dispTime.s = this.zeroPadding(dispTime.s, 2);
      dispTime.m = this.zeroPadding(dispTime.m, 2);
    }
    return dispTime;
  };

  /**
   * isRetinaがtrueのとき、引数にdevicePixelRatioを割って返す
   * @param {number} num 割られる値
   * @return {number} 引数にdevicePixelRatioを割った値
   */
  p.divisionRetina = function(num) {
    return this.options.isRetina ? num / window.devicePixelRatio : num;
  };

  /**
   * ランダムの値を生成
   * @param {number} min 最小値
   * @param {number} max 最大値
   * @return {number} min〜max間のランダムの整数値
   */
  p.createRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  /**
   * ゼロ詰め
   * @param {number} target 対象の数値
   * @param {number} digit けた数
   * @return {string} ゼロ詰めされた文字列
   */
  p.zeroPadding = function(target, digit) {
    var zero = (function() {
      var tmp = '';
      for (var i = 0; i < digit; i++) tmp += "0";
      return tmp;
    })();
    return (zero + target.toString()).slice(-digit);
  };

  /**
   * それぞれのモバイルチェック（タブレットもモバイル扱い）
   */
  p.isIos = isIos;
  p.isAndroid = isAndroid;
  p.isMobile = isIos || isAndroid;

  /**
   * stageを全てクリアする
   */
  p._clearStage = function() {
    this.isPause = false;
    createjs.Ticker.removeAllEventListeners();
    this.stage.removeAllChildren();
    createjs.Tween.removeAllTweens();
    this.stage.clear();
  };

  /**
   * タイマーを初期化
   */
  p._initTimer = function() {
    clearTimeout(this.timer);
    this.totalTime = {
      ms: 0,
      s: 0,
      m: 0,
    };
  };

  /**
   * stageインスタンスを生成
   */
  p._initStage = function() {
    this.stage = null;
    this.stage = new createjs.Stage(this.options.target.replace(/(.|#)/, ''));
    this._setCanvasSize();
    if (this.options.isRetina) this._devicePixelRatio();
    if (this.options.islTouch && createjs.Touch.isSupported()) createjs.Touch.enable(this.stage);
  };

  /**
   * canvasとstageのサイズを設定
   */
  p._setCanvasSize = function() {
    if (this.parent) {
      // 親が設定されていれば親に大きさを揃える
      this.stage.canvas.width = this.canvas.width = this.parent.clientWidth;
      this.stage.canvas.height = this.canvas.height = this.parent.clientHeight;
    } else {
      // 親が設定されていなければ画面いっぱいの大きさにセット
      this.stage.canvas.width = this.canvas.width = window.innerWidth;
      this.stage.canvas.height = this.canvas.height = window.innerHeight;
    }
  };

  /**
   * Retinaに対応
   */
  p._devicePixelRatio = function() {
    if (window.devicePixelRatio) {
      var tmpW = this.canvas.width;
      var tmpH = this.canvas.height;
      this.canvas.width = tmpW * window.devicePixelRatio;
      this.canvas.height = tmpH * window.devicePixelRatio;
      this.canvas.style.width = tmpW + 'px';
      this.canvas.style.height = tmpH + 'px';
      this.stage.scaleX = this.stage.scaleY = window.devicePixelRatio;
    }
  };

  /**
   * リサイズ時の処理
   */
  p._resizeHandle = function() {
    this._setCanvasSize();
    if (this.options.isRetina) this._devicePixelRatio();
  };

  return constructor;
})();