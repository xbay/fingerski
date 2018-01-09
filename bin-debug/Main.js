//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Right"] = 1] = "Right";
})(Direction || (Direction = {}));
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this) || this;
        _this.addEventListener(egret.Event.ADDED_TO_STAGE, _this.onAddToStage, _this);
        return _this;
    }
    Main.prototype.onAddToStage = function (event) {
        egret.lifecycle.addLifecycleListener(function (context) {
            // custom lifecycle plugin
            context.onUpdate = function () { };
        });
        egret.lifecycle.onPause = function () {
            egret.ticker.pause();
        };
        egret.lifecycle.onResume = function () {
            egret.ticker.resume();
        };
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    };
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    Main.prototype.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    };
    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    Main.prototype.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    Main.prototype.onItemLoadError = function (event) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    Main.prototype.onResourceLoadError = function (event) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    };
    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    Main.prototype.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    /**
     * 创建游戏场景
     * Create a game scene
     */
    Main.prototype.createGameScene = function () {
        this.createSky();
        this.createMainCharacter();
        this.createBackgroundTrees();
        this.configStageEvents();
        //根据name关键字，异步获取一个json配置文件，name属性请参考resources/resource.json配置文件的内容。
        // Get asynchronously a json configuration file according to name keyword. As for the property of name please refer to the configuration file of resources/resource.json.
        RES.getResAsync("description_json", this.startAnimation, this);
    };
    /**
     * 舞台全局事件处理
     */
    Main.prototype.configStageEvents = function () {
        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this);
        // this.stage.addEventListener(
        //   egret.TouchEvent.TOUCH_MOVE,
        //   this.touchHandler,
        //   this
        // );
    };
    /**
     * 判断碰撞
     */
    Main.prototype.checkCollision = function (stageX, stageY) {
        var isHit = false;
        this.trees.forEach(function (item) {
            if (!isHit) {
                isHit = item.hitTestPoint(stageX, stageY, true);
            }
        });
        if (isHit) {
            alert("hit it");
        }
    };
    /**
     * 触摸事件处理
     */
    Main.prototype.touchHandler = function (evt) {
        switch (evt.type) {
            case egret.TouchEvent.TOUCH_BEGIN:
                this.caracterTween(evt.stageX, evt.stageY);
                break;
        }
        this.checkCollision(evt.stageX, evt.stageY);
    };
    /**
     * 人物动画
     */
    Main.prototype.caracterTween = function (stageX, stageY) {
        var stageWidth = this.stage.stageWidth;
        var stageHeight = this.stage.stageHeight;
        var isRight = this.currentDirection === Direction.Right;
        this.currentDirection = isRight ? Direction.Left : Direction.Right;
        egret.Tween.removeTweens(this.caracter);
        egret.Tween.get(this.caracter).to({
            x: isRight ? 0 : stageWidth,
            y: stageHeight * 0.4
        }, 1500, egret.Ease.sineInOut);
    };
    /**
     * 创建背景树
     */
    Main.prototype.createBackgroundTrees = function () {
        var _this = this;
        var treeGroup = this.makeRandomPosition(5, 6);
        treeGroup.forEach(function (element) {
            var tree = _this.createBitmapByName("tree_png");
            tree.x = element.x;
            tree.y = element.y;
            tree.width = element.width;
            tree.height = element.height;
            tree.addEventListener(egret.Event.ADDED_TO_STAGE, _this.treeOnMove, _this);
            if (!_this.trees) {
                _this.trees = [];
            }
            _this.trees.push(tree);
            _this.addChild(tree);
        });
    };
    /**
     * 创建天空
     */
    Main.prototype.createSky = function () {
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        var sky = new egret.Shape();
        sky.graphics.beginFill(0xefefef, 1);
        sky.graphics.drawRect(0, 0, stageW, stageH);
        sky.graphics.endFill();
        sky.width = stageW;
        sky.height = stageH;
        this.addChild(sky);
    };
    /**
     * 创建人物
     */
    Main.prototype.createMainCharacter = function () {
        this.caracter = new egret.Shape();
        this.caracter.graphics.beginFill(0x00ff00);
        this.caracter.graphics.drawCircle(0, 0, 10);
        this.caracter.graphics.endFill();
        this.caracter.x = this.stage.stageWidth / 2;
        this.caracter.y = this.stage.stageHeight * 0.4;
        this.addChild(this.caracter);
    };
    Main.prototype.treeOnMove = function (evt) {
        var stageH = this.stage.stageHeight;
        var tw = egret.Tween.get(evt.target, { loop: true });
        tw.to({ x: evt.target.x, y: evt.target.y - stageH }, 5000);
    };
    /**
     * 获取随机位置
     * 先获得基准点点再做偏移
     */
    Main.prototype.makeRandomPosition = function (rows, cols) {
        var result = [];
        var spaceX = this.stage.stageWidth / rows;
        var spaceY = this.stage.stageHeight / cols;
        var iconWidth = spaceX;
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var random = Math.floor(Math.random() * 5 + 3) / 10;
                var x = spaceX * (row + random);
                var y = spaceY * (col + random);
                var width = iconWidth * random;
                var height = width;
                result.push({ x: x, y: y, width: width, height: height, random: random });
            }
        }
        return result;
    };
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    Main.prototype.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    /**
     * 描述文件加载成功，开始播放动画
     * Description file loading is successful, start to play the animation
     */
    Main.prototype.startAnimation = function (result) {
        var parser = new egret.HtmlTextParser();
        var textflowArr = result.map(function (text) { return parser.parse(text); });
        var textfield = this.textfield;
        var count = -1;
        var change = function () {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            var textFlow = textflowArr[count];
            // 切换描述内容
            // Switch to described content
            // textfield.textFlow = textFlow;
            // let tw = egret.Tween.get(textfield);
            // tw.to({ "alpha": 1 }, 200);
            // tw.wait(2000);
            // tw.to({ "alpha": 0 }, 200);
            // tw.call(change, this);
        };
        change();
    };
    return Main;
}(egret.DisplayObjectContainer));
__reflect(Main.prototype, "Main");
//# sourceMappingURL=Main.js.map