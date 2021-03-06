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

interface TreePos {
  x: number;
  y: number;
  width: number;
  height: number;
  random?: number;
}
enum Direction {
  Left,
  Right
}

class Main extends egret.DisplayObjectContainer {
  /**
   * 加载进度界面
   * Process interface loading
   */
  private loadingView: LoadingUI;
  private caracter: egret.Shape;
  private trees: Array<egret.Bitmap>;
  private currentDirection: Direction;

  public constructor() {
    super();
    this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
  }

  private onAddToStage(event: egret.Event) {
    egret.lifecycle.addLifecycleListener(context => {
      // custom lifecycle plugin

      context.onUpdate = () => {};
    });

    egret.lifecycle.onPause = () => {
      egret.ticker.pause();
    };

    egret.lifecycle.onResume = () => {
      egret.ticker.resume();
    };

    //设置加载进度界面
    //Config to load process interface
    this.loadingView = new LoadingUI();
    this.stage.addChild(this.loadingView);

    //初始化Resource资源加载库
    //initiate Resource loading library
    RES.addEventListener(
      RES.ResourceEvent.CONFIG_COMPLETE,
      this.onConfigComplete,
      this
    );
    RES.loadConfig("resource/default.res.json", "resource/");
  }

  /**
   * 配置文件加载完成,开始预加载preload资源组。
   * configuration file loading is completed, start to pre-load the preload resource group
   */
  private onConfigComplete(event: RES.ResourceEvent): void {
    RES.removeEventListener(
      RES.ResourceEvent.CONFIG_COMPLETE,
      this.onConfigComplete,
      this
    );
    RES.addEventListener(
      RES.ResourceEvent.GROUP_COMPLETE,
      this.onResourceLoadComplete,
      this
    );
    RES.addEventListener(
      RES.ResourceEvent.GROUP_LOAD_ERROR,
      this.onResourceLoadError,
      this
    );
    RES.addEventListener(
      RES.ResourceEvent.GROUP_PROGRESS,
      this.onResourceProgress,
      this
    );
    RES.addEventListener(
      RES.ResourceEvent.ITEM_LOAD_ERROR,
      this.onItemLoadError,
      this
    );
    RES.loadGroup("preload");
  }

  /**
   * preload资源组加载完成
   * Preload resource group is loaded
   */
  private onResourceLoadComplete(event: RES.ResourceEvent) {
    if (event.groupName == "preload") {
      this.stage.removeChild(this.loadingView);
      RES.removeEventListener(
        RES.ResourceEvent.GROUP_COMPLETE,
        this.onResourceLoadComplete,
        this
      );
      RES.removeEventListener(
        RES.ResourceEvent.GROUP_LOAD_ERROR,
        this.onResourceLoadError,
        this
      );
      RES.removeEventListener(
        RES.ResourceEvent.GROUP_PROGRESS,
        this.onResourceProgress,
        this
      );
      RES.removeEventListener(
        RES.ResourceEvent.ITEM_LOAD_ERROR,
        this.onItemLoadError,
        this
      );
      this.createGameScene();
    }
  }

  /**
   * 资源组加载出错
   *  The resource group loading failed
   */
  private onItemLoadError(event: RES.ResourceEvent) {
    console.warn("Url:" + event.resItem.url + " has failed to load");
  }

  /**
   * 资源组加载出错
   *  The resource group loading failed
   */
  private onResourceLoadError(event: RES.ResourceEvent) {
    //TODO
    console.warn("Group:" + event.groupName + " has failed to load");
    //忽略加载失败的项目
    //Ignore the loading failed projects
    this.onResourceLoadComplete(event);
  }

  /**
   * preload资源组加载进度
   * Loading process of preload resource group
   */
  private onResourceProgress(event: RES.ResourceEvent) {
    if (event.groupName == "preload") {
      this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
    }
  }

  private textfield: egret.TextField;

  /**
   * 创建游戏场景
   * Create a game scene
   */
  private createGameScene() {
    this.createSky();
    this.createMainCharacter();
    this.createBackgroundTrees();
    this.configStageEvents();

    //根据name关键字，异步获取一个json配置文件，name属性请参考resources/resource.json配置文件的内容。
    // Get asynchronously a json configuration file according to name keyword. As for the property of name please refer to the configuration file of resources/resource.json.
    RES.getResAsync("description_json", this.startAnimation, this);
  }
  /**
   * 舞台全局事件处理
   */
  private configStageEvents() {
    this.stage.addEventListener(
      egret.TouchEvent.TOUCH_BEGIN,
      this.touchHandler,
      this
    );
    // this.stage.addEventListener(
    //   egret.TouchEvent.TOUCH_MOVE,
    //   this.touchHandler,
    //   this
    // );
  }

  /**
   * 判断碰撞
   */
  private checkCollision(stageX: number, stageY: number) {
    let isHit = false;
    this.trees.forEach(item => {
      if (!isHit) {
        isHit = item.hitTestPoint(stageX, stageY, true);
      }
    });
    if (isHit) {
      alert("hit it");
    }
  }

  /**
   * 触摸事件处理
   */
  private touchHandler(evt: egret.TouchEvent) {
    switch (evt.type) {
      case egret.TouchEvent.TOUCH_BEGIN:
        this.caracterTween(evt.stageX, evt.stageY);
        break;
    }
    this.checkCollision(evt.stageX, evt.stageY);
  }

  /**
   * 人物动画
   */
  private caracterTween(stageX: number, stageY: number) {
    const stageWidth = this.stage.stageWidth;
    const stageHeight = this.stage.stageHeight;
    const isRight = this.currentDirection === Direction.Right;
    this.currentDirection = isRight ? Direction.Left : Direction.Right;
    egret.Tween.removeTweens(this.caracter);
    egret.Tween.get(this.caracter).to(
      {
        x: isRight ? 0 : stageWidth,
        y: stageHeight * 0.4
      },
      1500,
      egret.Ease.sineInOut
    );
  }

  /**
   * 创建背景树
   */
  private createBackgroundTrees() {
    let treeGroup = this.makeRandomPosition(5, 6);
    treeGroup.forEach(element => {
      let tree = this.createBitmapByName("tree_png");
      tree.x = element.x;
      tree.y = element.y;
      tree.width = element.width;
      tree.height = element.height;
      tree.addEventListener(egret.Event.ADDED_TO_STAGE, this.treeOnMove, this);
      if (!this.trees) {
        this.trees = [];
      }
      this.trees.push(tree);
      this.addChild(tree);
    });
  }

  /**
   * 创建天空
   */
  private createSky() {
    let stageW = this.stage.stageWidth;
    let stageH = this.stage.stageHeight;

    let sky = new egret.Shape();
    sky.graphics.beginFill(0xefefef, 1);
    sky.graphics.drawRect(0, 0, stageW, stageH);
    sky.graphics.endFill();

    sky.width = stageW;
    sky.height = stageH;
    this.addChild(sky);
  }

  /**
   * 创建人物
   */
  private createMainCharacter() {
    this.caracter = new egret.Shape();
    this.caracter.graphics.beginFill(0x00ff00);
    this.caracter.graphics.drawCircle(0, 0, 10);
    this.caracter.graphics.endFill();
    this.caracter.x = this.stage.stageWidth / 2;
    this.caracter.y = this.stage.stageHeight * 0.4;
    this.addChild(this.caracter);
  }

  private treeOnMove(evt: egret.Event) {
    let stageH = this.stage.stageHeight;
    var tw = egret.Tween.get(evt.target, { loop: true });
    tw.to({ x: evt.target.x, y: evt.target.y - stageH }, 5000);
  }

  /**
   * 获取随机位置
   * 先获得基准点点再做偏移
   */
  private makeRandomPosition(rows: number, cols: number): TreePos[] {
    let result = [];
    let spaceX = this.stage.stageWidth / rows;
    let spaceY = this.stage.stageHeight / cols;
    let iconWidth = spaceX;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let random = Math.floor(Math.random() * 5 + 3) / 10;
        let x = spaceX * (row + random);
        let y = spaceY * (col + random);
        let width = iconWidth * random;
        let height = width;
        result.push({ x, y, width, height, random });
      }
    }

    return result;
  }

  /**
   * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
   * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
   */
  private createBitmapByName(name: string) {
    let result = new egret.Bitmap();
    let texture: egret.Texture = RES.getRes(name);
    result.texture = texture;
    return result;
  }

  /**
   * 描述文件加载成功，开始播放动画
   * Description file loading is successful, start to play the animation
   */
  private startAnimation(result: string[]) {
    let parser = new egret.HtmlTextParser();

    let textflowArr = result.map(text => parser.parse(text));
    let textfield = this.textfield;
    let count = -1;
    let change = () => {
      count++;
      if (count >= textflowArr.length) {
        count = 0;
      }
      let textFlow = textflowArr[count];

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
  }
}
