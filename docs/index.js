//--------------------------------------------------------------------
//SS開発室：【Web版漢字学習システム】手書き入力：Google InputAPI テスト javasctipt
// 2020/02/05-02/06
// progmammed by Yasuhiko Fujii
//--------------------------------------------------------------------

//--------------------------------------------------------------------
//Google Input APIへSendするデータ構造
//--------------------------------------------------------------------
var text = {
  'app_version' : 0.4,
  'api_level' : '537.36',
  'device' : window.navigator.userAgent,
  'input_type' : 0,               // ?
  'options' : 'enable_pre_space', // ?
  'requests' : [{
    'writing_guide' : {
      'writing_area_width' : 250, // canvas width
      'writing_area_height' : 250,// canvas height
    },
    'pre_context' : '',           // confirmed preceding chars
    'max_num_results' : 20,
    'max_completions' : 0,
    'language': 'ja',
    //ストロークデータ構造 [x1,x2,x3],[y1,y2,y3],[開始時間、終了時間], //１画づつに区切られた連続データ
    'ink' : []
  }]
};

//--------------------------------------------------------------------
//グローバル変数
//--------------------------------------------------------------------
var ht        = 'https://';
var hu        = 'inputtools.google.com';
var p         = '/request?itc=ja-t-i0-handwrit';
var hostUrl   = ht + hu + p;
var scale     = 0.5;                //canvasサイズのスケール値
var count     = 0;                  //ストローク回数
var stroke    = [[],[],[]];       //１ストローク合体モノ
var strokeX   = [];               //１ストローク分のデータ
var strokeY   = [];               //１ストローク分のデータ
var strokeT   = [];               //１ストローク分のデータ
var beforeTime = 0;             //前回の時間
var drawing   = false;            //マウスをクリックしていない時false
var before_x  = 0;               //前回の座標を記録する
var before_y  = 0;               //
var finger    = new Array;           //スマホタッチ座標用
var data2     = [];              //変換候補の保存

for(var i=0;i<10;i++){
  finger[i]={
    x:0,y:0,x1:0,y1:0,
    color:"rgb("
      +Math.floor(Math.random()*16)*15+","
      +Math.floor(Math.random()*16)*15+","
      +Math.floor(Math.random()*16)*15+")"
  };
}
document.getElementById('width').value = 4;     //線の太さ初期値

//--------------------------------------------------------------------
//CANVAS初期化2D
//--------------------------------------------------------------------
var container = document.getElementById('canvas-container');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

//--------------------------------------------------------------------
//画面サイズ取得
//--------------------------------------------------------------------
//画面サイズの取得
getScreenSize();

//ウィンドウサイズの取得
getWindowSize();

//親要素のサイズをCanvasに指定
setCanvasSize();

//Containerサイズの取得
getContainerSize();

//Canvasサイズの取得
getCanvasSize();


//画面サイズを取得する
function getScreenSize() {
  var s = "Screen:" + window.parent.screen.width + ":" + window.parent.screen.height;
  document.getElementById("ScrSize").innerHTML = s;
}

//ウィンドウサイズを取得する
function getWindowSize() {
//画面に情報表示
  var s = "/Window:" + window.innerWidth + ":" + window.innerHeight;
  document.getElementById("WinSize").innerHTML = s;
}

//Canvasサイズを取得する
function getCanvasSize() {
  var s = "/Canvas:" + canvas.width + ":" + canvas.height;
  document.getElementById("CanSize").innerHTML = s;
}

//Canvasサイズを取得する
function getContainerSize() {
  var s = "/Container:" + container.clientWidth + ":" + container.clientHeight;
  document.getElementById("ConSize").innerHTML = s;
}

//親要素のサイズをCanvasに指定
function setCanvasSize() {
  //親要素のサイズをCanvasに指定
  canvas.width            = container.clientWidth;
  canvas.height           = container.clientHeight;

  //選択テキストエリアのサイズ
  text.writing_area_width = container.clientWidth;
  text.writing_area_height= container.clientHeight;

  //破線
  dispCross();
}

  //canvasに破線描画
function dispCross() {
  //横破線
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(234,0,0,1)';            //赤
  ctx.lineWidth = 2;                              //1 中心線サイズ
  ctx.setLineDash([2, 4]);
  ctx.moveTo(0, canvas.height/2);
  ctx.lineTo(canvas.width, canvas.height/2);
  ctx.closePath();
  ctx.stroke();
  //縦破線
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(234,0,0,1)';            //赤
  ctx.lineWidth = 2;                              //1 中心線サイズ
  ctx.setLineDash([2, 4]);
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.closePath();
  ctx.stroke();
  //破線パターンクリア
  ctx.setLineDash([]);
  ctx.restore();
  //矩形線
  ctx.strokeStyle = 'rgb(0,0,0)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height)
}

//--------------------------------------------------------------------
//スマホでスクロールを禁止する
//--------------------------------------------------------------------
//スクロール禁止
//no_scroll();

// スクロール禁止
function no_scroll() {
    // PCでのスクロール禁止
    document.addEventListener("mousewheel", scroll_control, { passive: false });
    // スマホでのタッチ操作でのスクロール禁止
    document.addEventListener("touchmove", scroll_control, { passive: false });
}
// スクロール禁止解除
function return_scroll() {
    // PCでのスクロール禁止解除
    document.removeEventListener("mousewheel", scroll_control, { passive: false });
    // スマホでのタッチ操作でのスクロール禁止解除
    document.removeEventListener('touchmove', scroll_control, { passive: false });
}
// スクロール関連メソッド
function scroll_control(event) {
    event.preventDefault();
}
//タッチ操作での拡大縮小禁止
function no_scaling() {
  document.addEventListener("touchmove", mobile_no_scroll, { passive: false });
}
//タッチ操作での拡大縮小禁止解除
function return_scaling() {
  document.removeEventListener('touchmove', mobile_no_scroll, { passive: false });
}
//拡大縮小禁止
function mobile_no_scroll(event) {
  // ２本指での操作の場合
  if (event.touches.length >= 2) {
    // デフォルトの動作をさせない
    event.preventDefault();
  }
}

//--------------------------------------------------------------------
//メイン処理
//--------------------------------------------------------------------
//マウスをクリックしてる時
canvas.addEventListener('mousedown', function(e) {
  drawing = true;
  var rect = e.target.getBoundingClientRect();
  before_x = e.clientX - rect.left;
  before_y = e.clientY - rect.top;
});

//マウス用イベントリスナー
canvas.addEventListener('mousemove', draw_canvas);  //マウスを移動中（drawing中でなければ、点と点を補完する線を引く）
canvas.addEventListener('mousedown', onDown, false);
canvas.addEventListener('mouseup', function() { drawing = false; });
canvas.addEventListener('mouseup', onUp, false);

//スマホタッチ用イベントリスナー
//タッチした瞬間座標を取得
canvas.addEventListener("touchstart",function(e){
  e.preventDefault();
  var rect  = e.target.getBoundingClientRect();

  for(var i=0;i<finger.length;i++){
    if (e.touches[i] != null) {
      finger[i].x1 = e.touches[i].clientX-rect.left;
      finger[i].y1 = e.touches[i].clientY-rect.top;
    }
  }
    stroke = [[],[],[]];                      //初期化
});

//タッチして動き出したら描画
canvas.addEventListener("touchmove",function(e){
  if(e.cancelable){
    e.preventDefault();
  }
  var rect = e.target.getBoundingClientRect();
  var w = document.getElementById('width').value;
  var color = document.getElementById('color').value;
  var r = parseInt(color.substring(1,3), 16);
  var g = parseInt(color.substring(3,5), 16);
  var b = parseInt(color.substring(5,7), 16);

  for(var i=0;i<finger.length;i++){
    if (e.touches[i] != null) {
      finger[i].x = e.touches[i].clientX-rect.left;
      finger[i].y = e.touches[i].clientY-rect.top;

  ctx.setLineDash([]);
  ctx.restore();
      ctx.beginPath();
      ctx.moveTo(finger[i].x1,finger[i].y1);
      ctx.lineTo(finger[i].x,finger[i].y);
      ctx.lineCap="round";
      ctx.strokeStyle = 'rgb('+ r + ',' + g + ',' + b + ')';
      ctx.lineWidth = 10;                                       //w
      ctx.stroke();
      ctx.closePath();

      stroke[0].push(parseInt(finger[i].x));
      stroke[1].push(parseInt(finger[i].y));
      finger[i].x1=finger[i].x;
      finger[i].y1=finger[i].y;
    }
  }
});

//タッチを離した時の処理
canvas.addEventListener("touchend",function(e){
  text.requests[0].ink.push(stroke);
  beforeTime = 0;
  count ++;
  stroke = [[],[],[]];                      //初期化

  //１画づつ手書きエンジンへ送る
  ajaxCall();
});

//--------------------------------------------------------------------
// 描画の処理
//--------------------------------------------------------------------
function draw_canvas(e) {
  //マウスをクリックしている時描画処理へ
  if (!drawing){
    return
  };

  //破線
  //dispCross();

  //ページに有る設定項目を数値にしてセット
  var rect = e.target.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  var w = document.getElementById('width').value;
//  var w = 6;
  var color = document.getElementById('color').value;
//  var color = 0;
  var r = parseInt(color.substring(1,3), 16);
  var g = parseInt(color.substring(3,5), 16);
  var b = parseInt(color.substring(5,7), 16);

  // 描画 線を引く
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgb('+ r + ',' + g + ',' + b + ')';
  ctx.lineWidth = 10;                                       //w;
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.moveTo(before_x, before_y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.closePath();
  stroke[0].push(parseInt(before_x));
  stroke[1].push(parseInt(before_y));

  // 描画最後の座標を前回の座標に代入する
  before_x = x;
  before_y = y;
}

//--------------------------------------------------------------------
//イベント処理
//--------------------------------------------------------------------

//消去ボタンクリック時
function del_canvas(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  count = 0;
  beforeTime = 0;
  document.getElementById( "KOUHO" ).value =  "";

  text.requests[0].ink = [];      //送信成功時　リクエストのストロークデータはクリア

  document.getElementById( "id_answer" ).value = "　";  //inputに転送
  document.getElementById( "KOUHO" ).value =  "<br>"+"画: ";;
  document.getElementById( "KOUHO0" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO1" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO2" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO3" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO4" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO5" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO6" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO7" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO8" ).value = "　"; //候補ボタンへ
  document.getElementById( "KOUHO9" ).value = "　"; //候補ボタンへ

  //破線
  dispCross();
}

//マウスダウン時
function onDown(e) {
  var x = e.clientX - canvas.offsetLeft;
  var y = e.clientY - canvas.offsetTop;
}

//マウスアップ時
function onUp(e) {
  var x = e.clientX - canvas.offsetLeft;
  var y = e.clientY - canvas.offsetTop;
  var t = (new Date).getTime() - beforeTime;
  text.requests[0].ink.push(stroke);
  beforeTime = 0;
  count ++;
  stroke = [[],[],[]];

  //１画づつ手書きエンジンへ送る
  ajaxCall();
}

//矩形ドロー
function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

//Windowリサイズ時
window.onresize = function(){
  //画面サイズの取得
  getScreenSize();

  //ウィンドウサイズの取得
  getWindowSize();

  //親要素のサイズをCanvasに指定
  setCanvasSize();

  //Containerサイズの取得
  getContainerSize();

  //Canvasサイズの取得
  getCanvasSize();

  //Canvasデータ消去
  del_canvas();

  //破線
  dispCross();
}

function funcUnity(v) {
  if (Window.Unity){
    var value = document.getElementById( "id_answer" ).value = v;
    Unity.call(value);
  }
  return false;
}

/*
function funcKOUHO1() {document.getElementById( "id_answer" ).value = data2[1];}
function funcKOUHO2() {document.getElementById( "id_answer" ).value = data2[2];}
function funcKOUHO3() {document.getElementById( "id_answer" ).value = data2[3];}
function funcKOUHO4() {document.getElementById( "id_answer" ).value = data2[4];}
function funcKOUHO5() {document.getElementById( "id_answer" ).value = data2[5];}
function funcKOUHO6() {document.getElementById( "id_answer" ).value = data2[6];}
function funcKOUHO7() {document.getElementById( "id_answer" ).value = data2[7];}
function funcKOUHO8() {document.getElementById( "id_answer" ).value = data2[8];}
function funcKOUHO9() {document.getElementById( "id_answer" ).value = data2[9];}
*/
//--------------------------------------------------------------------
//AjaxにてrequestをGoogleInputAPIへ送信する
//--------------------------------------------------------------------
function ajaxCall() {
    $.ajax({
      url :         hostUrl,
      method :      'POST',
      contentType : 'application/json',
      data :        JSON.stringify(text),
      dataType :    'json',
    })


    // Ajaxリクエストが成功した時発動
    .done( (data) => {
      $('.result').html(data);
      if (data.length > 0){
//        console.log(data[1][0][1][0]);                                    //Responseデータをログへ表示
        data2 = data[1][0][1];
        document.getElementById( "id_answer" ).value = data2[0];  //inputに転送
        document.getElementById( "KOUHO" ).value =  "<br>"+count+"画: ";
        document.getElementById( "KOUHO0" ).value = data2[0]; //候補ボタンへ
        document.getElementById( "KOUHO1" ).value = data2[1]; //候補ボタンへ
        document.getElementById( "KOUHO2" ).value = data2[2]; //候補ボタンへ
        document.getElementById( "KOUHO3" ).value = data2[3]; //候補ボタンへ
        document.getElementById( "KOUHO4" ).value = data2[4]; //候補ボタンへ
        document.getElementById( "KOUHO5" ).value = data2[5]; //候補ボタンへ
        document.getElementById( "KOUHO6" ).value = data2[6]; //候補ボタンへ
        document.getElementById( "KOUHO7" ).value = data2[7]; //候補ボタンへ
        document.getElementById( "KOUHO8" ).value = data2[8]; //候補ボタンへ
        document.getElementById( "KOUHO9" ).value = data2[9]; //候補ボタンへ

        console.log(data2);                                              //Responseデータをログへ表示
      }
    })
    // Ajaxリクエストが失敗した時発動
    .fail( (data) => {
      $('.result').html(data);
      document.getElementById( "KOUHO" ).value =  "<br>"+data[0];
    })
    // Ajaxリクエストが成功・失敗どちらでも発動
    .always( (data) => {
      $('.result').html(data);
      //document.getElementById( "Unity" ).value =  data2[0];
      console.log(data2[0]);
      if (Window.Unity) Unity.call(data2[0]);
      var jsn = JSON.stringify(text);
      console.log(JSON.stringify(text));
    });
}
