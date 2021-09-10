//  微型游戏引擎
function GameEngine(id, params) {
  let _ = this
  let settings = {
    width: 960,
    height: 640
  };
  Object.assign(_, settings, params); //拷贝属性到this中

  let $canvas = document.getElementById(id)
  $canvas.width = _.width
  $canvas.height = _.height
  let _context = $canvas.getContext('2d'); //获取画布上下文
  let _stages = []                //布景对象队列
  let _events = {}                //事件集合 {‘keydown’： {s1: 回调函数， s2: 回调函数}} 保存每个stage自身的回调函数
  let _currentStage = 0,          //当前布景索引
      _hander;                    //帧动画控制

  //-------------------------------------------------活动对象构造器-------------------------------------------------------
  const Item = function (params) {
    this._params = params || {}
    this._id = 0                  //标志符
    this._stage = null            //所属的布景
    this._settings = {            //_settings中会保留对象默认属性，在reset时可使用Object.assign对对象中的属性复位
      //对象属性
      x: 0,                       //位置横坐标
      y: 0,                       //位置纵坐标
      width: 20,                  //对象宽度
      height: 20,                 //对象高度
      type: 0,                    //对象类型：0(普通对象，不绑定地图) 1(玩家所控制对象) 2(程序控制对象NPC)
      color: '#F00',              //颜色
      status: 1,                  //对象状态：0(未激活/结束) 1(正常) 2(暂停) 3(临时状态) 4(表示异常)
      direction: 0,               //当前对象定位方向：0(右) 1(下) 2(左) 3(上)
      speed: 0,                   //移动速度
      //地图相关属性
      location: null,             //地图定位，Map对象
      coord: null,                //若是对象绑定地图，需要设置地图坐标；若不绑定地图，则设置位置坐标
      path: [],                   //NPC寻路路径
      vector: null,               //目标坐标
      //布景相关属性
      frames: 1,                  //速度等级:多少帧变化一次
      times: 0,                   //对象刷新计数器(循环动画判断)
      timeout: 0,                 //倒计时(过度动画状态判断)
      control: {},                //控制缓存，到达定位点是处理
      update: function () {
      },      //更新参数信息
      draw: function () {
      }         //绘制对象 需要在创建对象时传入
    };
    Object.assign(this, this._settings, this._params)
  }
  //--------------------------------------------------地图构造器---------------------------------------------------------
  const Map = function (params) {
    this._params = params || {}
    this._id = 0                    //标识符
    this._stage = null              //所属布景绑定
    this._settings = {
      x: 0,                         //地图起始点坐标
      y: 0,
      size: 20,                     //地图单元的宽度
      data: [],                     //地图数据
      x_length: 0,                  //二维数组X轴长度
      y_length: 0,                  //二维数组Y轴长度
      frames: 1,                    //速度等级(内部计算器 多少帧变化一次)
      times: 0,                     //刷新画布计数器(用于循环动画状态判断)
      cache: false,                 //是否静态(静态需设置缓存)
      update: function () {
      },        //更新地图数据
      draw: function () {
      },          //绘制地图
    }
    Object.assign(this, this._settings, this._params)
  }
  //获取地图上某个点的值
  Map.prototype.get = function (x, y) {
    if (this.data[y] && typeof this.data[y][x] != 'undefined') {
      return this.data[y][x];
    }
    return -1
  }
  //设置地图上某个点的值
  Map.prototype.set = function (x, y, value) {
    if (this.data[y]) {
      this.data[y][x] = value;
    }
  }
  //地图坐标转换为画布位置
  Map.prototype.mapCoorToCanvasPosition = function (mapX, mapY) {
    return {
      x: this.x + mapX * this.size + this.size / 2,
      y: this.y + mapY * this.size + this.size / 2,
    }
  }
  //画布位置转换为地图坐标
  Map.prototype.canvasPositionToMapCoor = function (canvX, canvY) {
    let fx = Math.abs(canvX - this.x) % this.size - this.size / 2
    let fy = Math.abs(canvY - this.y) % this.size - this.size / 2
    return {
      x: Math.floor((canvX - this.x) / this.size),
      y: Math.floor((canvY - this.y) / this.size),
      offset: Math.sqrt(fx * fx + fy * fy)
    }
  }
  //NPC寻路算法
  Map.prototype.finder = function (params) {
    let defaults = {
      map: null,                      //地图信息(可走坐标的值为0)
      start: {},                      //起点(NPC位置)
      end: {},                        //目标点(玩家控制角色位置)
      type: 'path'                    //类型: 'path' 返回路径
    };
    let options = Object.assign({}, defaults, params)
    //若起点或目标点在墙上 则返回空
    if (options.map[options.start.y][options.start.x] || options.map[options.end.y][options.end.x]) return []
    let founded = false;                     //表示符 是否找到路径
    let result = [];                         //找到的路径 返回值
    let y_length = options.map.length;      //地图Y轴长度
    let x_length = options.map[0].length;    //地图X轴长度
    let steps = [];                          //与地图维度相同 每个位置的值代表最近路径的上一个点的坐标

    //给step每个位置置0
    for (let y = y_length; y--;) {
      steps[y] = new Array(x_length).fill(0);
    }

    //获取坐标点的值
    const _getValue = function (x, y) {  //获取地图上的值
      if (options.map[y] && typeof options.map[y][x] != 'undefined') {
        return options.map[y][x];
      }
      return -1;
    };
    //判定是否可走,可走放入列表
    const _next = function (to) { //判定是否可走,可走放入列表
      let value = _getValue(to.x, to.y);
      if (value < 1) {
        if (value === -1) {
          to.x = (to.x + x_length) % x_length;
          to.y = (to.y + y_length) % y_length;
          to.change = 1;
        }
        if (!steps[to.y][to.x]) {
          result.push(to);
        }
      }
    };
    //寻路算法(递归实现) 寻路结果放在steps数组中
    let _render = function (list) {
      let nextList = [];
      const next = function (from, to) {
        let value = _getValue(to.x, to.y);
        //目标点可走
        if (value < 1) {
          //边缘可走位置
          if (value === -1) {
            to.x = (to.x + x_length) % x_length;
            to.y = (to.y + y_length) % y_length;
            to.change = 1;
          }
          if (to.x === options.end.x && to.y === options.end.y) {
            steps[to.y][to.x] = from
            founded = true
          } else if (!steps[to.y][to.x]) {
            steps[to.y][to.x] = from;
            nextList.push(to);
          }
        }
      };
      list.forEach(function (current) {
        next(current, {y: current.y + 1, x: current.x});
        next(current, {y: current.y, x: current.x + 1});
        next(current, {y: current.y - 1, x: current.x});
        next(current, {y: current.y, x: current.x - 1});
      });
      if (!founded && nextList.length) {
        _render(nextList);
      }
    }

    //寻找
    _render([options.start]);
    if (founded) {
      let current = options.end;
      let temp = null
      if (options.type === 'path') {
        while (current.x !== options.start.x || current.y !== options.start.y) {
          result.unshift(current);
          current = steps[current.y][current.x];
        }
      } else if (options.type === 'next') {
        _next({x: current.x + 1, y: current.y});
        _next({x: current.x, y: current.y + 1});
        _next({x: current.x - 1, y: current.y});
        _next({x: current.x, y: current.y - 1});
      }
    }
    return result;
  }
  //-----------------------------------------------------布景构造器------------------------------------------------------
  const Stage = function (params) {
    this._params = params || {};
    this._settings = {
      index: 0,                   //布景索引
      status: 0,                  //布景状态:0(未激活/结束) 1(正常) 2(暂停) 3(临时状态)
      maps: [],                   //地图队列
      audio: [],                  //音频资源
      images: [],                 //图片资源
      items: [],                  //布景中各种对象队列
      timeout: 0,                 //倒计时(用于过程动画判断)
      update: function () {
      }
    };
    Object.assign(this, this._settings, this._params);
  }
  //创建场景中的对象(NPC,角色,文字等等)
  Stage.prototype.createItem = function (options) {
    let item = new Item(options)
    //动态属性
    if (item.location) {
      //初始化场景中对象坐标 属性等
      Object.assign(item, item.location.mapCoorToCanvasPosition(item.coord.x, item.coord.y))
    }
    //关系绑定
    item._stage = this;
    item._id = this.items.length;
    this.items.push(item)
    return item
  }
  //创建场景中的地图
  Stage.prototype.createMap = function (options) {
    let map = new Map(options);
    //动态属性
    map.data = JSON.parse(JSON.stringify(map._params.data));
    map.x_length = map.data[0].length;
    map.y_length = map.data.length;
    map.imageData = null;

    //关系绑定
    map._stage = this;
    map.id = this.maps.length;
    this.maps.push(map)
    return map
  }
  //绑定事件
  Stage.prototype.bind = function (eventType, callBack) {
    if (!_events[eventType]) {
      _events[eventType] = {};
      window.addEventListener(eventType, function (e) {
        let key = 's' + _currentStage;
        if (_events[eventType][key]) {
          _events[eventType][key](e);
        }
        // e.preventDefault();
      });
    }
    _events[eventType]['s' + this.index] = callBack.bind(this);

  }
  //获取指定类型的对象列表
  Stage.prototype.getItemsByType = function (type) {
    return this.items.filter(function (item) {
      return item.type === type;
    });
  }
  //重置布景(包括地图 对象等)
  Stage.prototype.reset = function () {
    Object.assign(this, this._settings, this._params);
    this.resetItems();
    this.resetMaps();
  }
  //重置对象位置
  Stage.prototype.resetItems = function () {
    this.status = 1;
    this.items.forEach(function (item, index) {
      Object.assign(item, item._settings, item._params);
      if (item.location) {
        //重新设置场景中对象的坐标 属性等
        Object.assign(item, item.location.mapCoorToCanvasPosition(item.coord.x, item.coord.y));
      }
    });
  }
  //重置地图
  Stage.prototype.resetMaps = function () {
    this.status = 1;
    this.maps.forEach(function (map) {
      Object.assign(map, map._settings, map._params);
      map.data = JSON.parse(JSON.stringify(map._params.data));
      map.y_length = map.data.length;
      map.x_length = map.data[0].length;
      map.imageData = null;
    });
  }
  //----------------------------------------------------游戏引擎方法------------------------------------------------------
  //创建一个布景
  this.createStage = function (options) {
    let stage = new Stage(options);
    stage.index = _stages.length;
    _stages.push(stage)
    return stage
  }
  //设置布景
  this.setStage = function (currentStage) {
    _stages[currentStage].status = 0;
    //更新当前布景索引
    _currentStage = currentStage;
    _stages[currentStage].status = 1;
    _stages[currentStage].reset(); //重置布景
  }
  //获取布景
  this.getStages = function () {
    return _stages;
  }
  //进入下一个布景
  this.nextStage = function () {
    if (_currentStage < _stages.length - 1) {
      return this.setStage(++_currentStage);
    } else {
      throw new Error('undefined new stage')
    }
  }
  //游戏引擎启动
  this.start = function () {
    _currentStage = 0;
    let frames = 0; //记录帧数 每刷新一次记录为1帧
    let reDraw = function () {
      let stage = _stages[_currentStage]; //获取当前布景
      _context.clearRect(0, 0, _.width, _.height) //清除画布
      _context.fillStyle = '#FFFFFF';
      _context.fillRect(0, 0, _.width, _.height); //填充背景色
      frames++;
      if (stage.update() !== false) {
        //刷新布景中的地图
        stage.maps.forEach(function (map) {
          if (!(frames % map.frames)) {
            map.times = frames / map.frames;		//计数器
          }
          if(stage.timeout) stage.timeout--
          if (map.cache) {
            if (!map.imageData) {
              _context.save();
              map.draw(_context);
              map.imageData = _context.getImageData(0, 0, _.width, _.height);
              _context.restore();
            } else {
              _context.putImageData(map.imageData, 0, 0);
            }
          } else {
            map.update();
            map.draw(_context);
          }
        });
        //刷新布景中的实例
        stage.items.forEach(function (item) {
          if (!(frames % item.frames)) {
            item.times = frames / item.frames;        //计数器:当刷新帧数为速度等级的整数倍时改变times(times用于绘制对象时形态判断)
          }
          if (stage.status === 1 && item.status !== 2) {
            if (item.location) {
              item.coord = item.location.canvasPositionToMapCoor(item.x, item.y);
            }
            if (item.timeout) item.timeout--
            item.update();
          }
          item.draw(_context)
        })
      }
      _hander = requestAnimationFrame(reDraw);
    }
    _hander = requestAnimationFrame(reDraw);
  }
}