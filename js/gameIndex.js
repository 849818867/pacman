(function () {
  _COLOR = ['#F00', '#F93', '#0CF', '#F9C'];       //4只怪物颜色
  _COLORPLAYER = ['#FFCD48', '#BF7704', '#000'] //玩家角色填充 边缘 眼睛颜色
  _LIFE = 5;                                    //玩家血量
  _SCORE = 0;                                   //玩家得分
  _COS = [1, 0, -1, 0];                            //用于方向判断(X轴)
  _SIN = [0, 1, 0, -1];                            //用于方向判断(Y轴)

  //创建游戏引擎对象
  let game = new GameEngine('canvas');
  //---------------------------------------------------初始化启动页面-----------------------------------------------------
  (function () {
    let stage = game.createStage()
    //创建logo对象
    stage.createItem({
      x: game.width / 2,
      y: game.height * .45,
      width: 100,
      height: 100,
      frames: 3,
      draw: function (context) {
        // t: 5->0->5->0
        let t = Math.abs(5 - this.times % 10);
        context.fillStyle = _COLORPLAYER[0];
        context.strokeStyle = _COLORPLAYER[1];
        context.lineWidth = 5
        context.beginPath();
        context.arc(this.x, this.y, this.width / 2, t * .04 * Math.PI, (2 - t * .04) * Math.PI, false);
        context.lineTo(this.x, this.y);
        context.lineTo(this.x + (this.width / 2) * Math.cos(t * .04 * Math.PI), this.y + (this.width / 2) * Math.sin(t * .04 * Math.PI))
        context.stroke();
        context.closePath();
        context.fill();

        context.fillStyle = '#000';
        context.beginPath();
        context.arc(this.x + 5, this.y - 27, 7, 0, 2 * Math.PI, false);
        context.closePath();
        context.fill();
      }
    });
    //创建游戏名称
    stage.createItem({
      x: game.width / 2,
      y: game.height * .6,
      draw: function (context) {
        context.font = 'bold 42px Helvetica';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000000';
        context.fillText('Pac-Man', this.x, this.y);
      }
    });
    stage.bind('keydown', function (e) {
      switch (e.keyCode) {
        case 32:
          game.nextStage();
          break;
      }
    })
  })();
  //---------------------------------------------------初始化游戏主程序---------------------------------------------------
  (function () {
    //每张地图创建一个布景
    _COIGIG.forEach(function (config, index) {
      let stage, map, beans, player, items;
      //创建布景
      stage = game.createStage({
        update: function () {
          let stage = this;
          if (stage.status === 1) {								//场景正常运行
            items.forEach(function (item) {
              if (map && !map.get(item.coord.x, item.coord.y) && !map.get(player.coord.x, player.coord.y)) {
                let dx = item.x - player.x;
                let dy = item.y - player.y;
                if (dx * dx + dy * dy < 750 && item.status !== 4) {		//物体检测
                  if (item.status === 3) {
                    item.status = 4;
                    _SCORE += 10;
                  } else {
                    stage.status = 3;
                    stage.timeout = 30;
                  }
                }
              }
            });
            if (JSON.stringify(beans.data).indexOf('0') < 0) {	//当没有物品的时候，进入下一关
              game.nextStage();
            }
          } else if (stage.status === 3) {		//场景临时状态
            if (!stage.timeout) {
              _LIFE--;
              if (_LIFE) {
                stage.resetItems();
              } else {
                let stages = game.getStages();
                game.setStage(stages.length - 1);
                return false;
              }
            }
          }
        }
      });
      //绘制地图
      map = stage.createMap({
        x: 60,
        y: 10,
        data: config['map'],
        cache: true,
        draw: function (context) {
          context.lineWidth = 2;
          for (let j = 0; j < this.y_length; j++) {
            for (let i = 0; i < this.x_length; i++) {
              let value = this.get(i, j);
              if (value) {
                let code = [0, 0, 0, 0];
                if (this.get(i + 1, j) && !(this.get(i + 1, j - 1) && this.get(i + 1, j + 1) && this.get(i, j - 1) && this.get(i, j + 1))) {
                  code[0] = 1;
                }
                if (this.get(i, j + 1) && !(this.get(i - 1, j + 1) && this.get(i + 1, j + 1) && this.get(i - 1, j) && this.get(i + 1, j))) {
                  code[1] = 1;
                }
                if (this.get(i - 1, j) && !(this.get(i - 1, j - 1) && this.get(i - 1, j + 1) && this.get(i, j - 1) && this.get(i, j + 1))) {
                  code[2] = 1;
                }
                if (this.get(i, j - 1) && !(this.get(i - 1, j - 1) && this.get(i + 1, j - 1) && this.get(i - 1, j) && this.get(i + 1, j))) {
                  code[3] = 1;
                }
                if (code.indexOf(1) > -1) {
                  context.strokeStyle = value === 2 ? "#FFF" : config['wall_color'];
                  let pos = this.mapCoorToCanvasPosition(i, j);
                  switch (code.join('')) {
                    case '1100':
                      context.beginPath();
                      context.arc(pos.x + this.size / 2, pos.y + this.size / 2, this.size / 2, Math.PI, 1.5 * Math.PI, false);
                      context.stroke();
                      context.closePath();
                      break;
                    case '0110':
                      context.beginPath();
                      context.arc(pos.x - this.size / 2, pos.y + this.size / 2, this.size / 2, 1.5 * Math.PI, 2 * Math.PI, false);
                      context.stroke();
                      context.closePath();
                      break;
                    case '0011':
                      context.beginPath();
                      context.arc(pos.x - this.size / 2, pos.y - this.size / 2, this.size / 2, 0, .5 * Math.PI, false);
                      context.stroke();
                      context.closePath();
                      break;
                    case '1001':
                      context.beginPath();
                      context.arc(pos.x + this.size / 2, pos.y - this.size / 2, this.size / 2, .5 * Math.PI, 1 * Math.PI, false);
                      context.stroke();
                      context.closePath();
                      break;
                    default:
                      let dist = this.size / 2;
                      code.forEach(function (v, index) {
                        if (v) {
                          context.beginPath();
                          context.moveTo(pos.x, pos.y);
                          context.lineTo(pos.x + _COS[index] * dist, pos.y + _SIN[index] * dist);
                          context.stroke();
                          context.closePath();
                        }
                      });
                  }
                }
              }
            }
          }
        }
      });
      //绘制地图物品(豆子)
      beans = stage.createMap({
        x: 60,
        y: 10,
        data: config['map'],
        frames: 8,
        draw: function (context) {
          for (let j = 0; j < this.y_length; j++) {
            for (let i = 0; i < this.x_length; i++) {
              let value = this.get(i, j)
              if (!value) {
                let position = this.mapCoorToCanvasPosition(i, j);
                context.fillStyle = "#228B22";
                if (config['goods'][i + ',' + j]) {
                  context.fillStyle = '#FF9933'
                  context.beginPath();
                  context.arc(position.x, position.y, 3 + Math.abs(this.times % 20 - 10) / 4, 0, 2 * Math.PI, true);
                  context.fill();
                  context.closePath();
                } else {
                  context.fillRect(position.x - 2, position.y - 2, 4, 4);
                }
              }
            }

          }
        }
      });
      //绘制关卡得分
      stage.createItem({
        x: 690,
        y: 80,
        draw: function (context) {
          context.font = 'bold 26px Helvetica';
          context.textAlign = 'left';
          context.textBaseline = 'bottom';
          context.lineWidth = 1
          context.fillStyle = '#F08A79';
          context.strokeStyle = '#CE240C'
          context.strokeText('SCORE:', this.x, this.y);
          context.fillText('SCORE:', this.x, this.y)
          context.fillStyle = '#60C8F7';
          context.strokeStyle = '#5FA2CD'
          context.strokeText(_SCORE, this.x + 130, this.y);
          context.fillText(_SCORE, this.x + 130, this.y);
          context.fillStyle = '#F08A79';
          context.strokeStyle = '#CE240C'
          context.strokeText('LEVEL:', this.x, this.y + 72);
          context.fillText('LEVEL:', this.x, this.y + 72);
          context.fillStyle = '#60C8F7';
          context.strokeStyle = '#5FA2CD'
          context.strokeText((index + 1).toString(), this.x + 130, this.y + 72);
          context.fillText((index + 1).toString(), this.x + 130, this.y + 72);
        }
      });
      //生命值
      stage.createItem({
        x: 690,
        y: 258,
        width: 30,
        height: 30,
        frames: 3,
        draw: function (context) {
          let max = Math.min(_LIFE, 5);
          let t = 5
          context.fillStyle = '#F08A79';
          context.strokeStyle = '#CE240C'
          context.lineWidth = 1
          context.beginPath();
          context.strokeText('LIFE:', this.x, this.y - 36);
          context.fillText('LIFE:', this.x, this.y - 36);
          context.closePath();

          for (let i = 0; i < max; i++) {
            let x = this.x + 40 * i + this.width / 2, y = this.y;
            context.fillStyle = _COLORPLAYER[0];
            context.strokeStyle = _COLORPLAYER[1];
            if (i === max - 1) {
              context.fillStyle = '#60C8F7';
              context.strokeStyle = '#5FA2CD';
              t = Math.abs(5 - this.times % 10);
            }
            context.lineWidth = 2
            context.beginPath();
            context.arc(x, y, this.width / 2, t * .04 * Math.PI, (2 - t * .04) * Math.PI, false);
            context.lineTo(x, y);
            context.lineTo(x + (this.width / 2) * Math.cos(t * .04 * Math.PI), y + (this.width / 2) * Math.sin(t * .04 * Math.PI))
            context.stroke();
            context.closePath();
            context.fill();

            context.fillStyle = '#000';
            context.beginPath();
            context.arc(x + 2, y - 6, 2, 0, 2 * Math.PI, false);
            context.closePath();
            context.fill();
          }
        }
      });
      //状态文字(暂停时才会显示)
      stage.createItem({
        x: 690,
        y: 350,
        frames: 25,
        draw: function (context) {
          if (stage.status === 2 && !(this.times % 2)) {
            context.font = '24px Helvetica';
            context.textAlign = 'left';
            context.textBaseline = 'center';
            context.fillStyle = '#60C8F7';
            context.fillText('PAUSE', this.x, this.y);
          }
        }
      });
      //绘制NPC
      for (let i = 0; i < 4; i++) {
        let item = stage.createItem({
          width: 30,
          height: 30,
          direction: 3,
          color: _COLOR[i],
          location: map,
          coord: {x: 12 + i, y: 14},
          vector: {x: 12 + i, y: 14},
          type: 2,
          frames: 5,
          speed: 0.5,
          timeout: Math.floor(Math.random() * 120),
          update: function () {
            let newMap;
            if (this.status === 3 && !this.timeout) {
              this.status = 1;
            }
            if (!this.coord.offset) {
              if (this.status === 1) {
                if (!this.timeout) {
                  let id = this._id;
                  //拷贝一份地图信息 并将NPC周围初始位置替换为可走路径
                  newMap = JSON.parse(JSON.stringify(map.data).replace(/2/g, '0'));

                  //当前NPC将其它所有还处于正常状态的NPC当成地图上不可走的点
                  items.forEach(function (item) {
                    if (item._id !== id && item.status === 1) {
                      //1表示墙体 寻址时其他位置被视为封死
                      newMap[item.coord.y][item.coord.x] = 1;
                    }
                  });
                  //寻址算法 返回一条路径
                  this.path = map.finder({
                    map: newMap,
                    start: this.coord,
                    end: player.coord
                  });
                  if (this.path.length) {
                    this.vector = this.path[0];
                  }
                }
              } else if (this.status === 3) {
                newMap = JSON.parse(JSON.stringify(map.data).replace(/2/g, 0));
                let id = this._id;
                items.forEach(function (item) {
                  if (item._id !== id) {
                    newMap[item.coord.y][item.coord.x] = 1;
                  }
                });
                this.path = map.finder({
                  map: newMap,
                  start: player.coord,
                  end: this.coord,
                  type: 'next'
                });
                if (this.path.length) {
                  this.vector = this.path[Math.floor(Math.random() * this.path.length)];
                }
              } else if (this.status === 4) {
                newMap = JSON.parse(JSON.stringify(map.data).replace(/2/g, 0));
                this.path = map.finder({
                  map: newMap,
                  start: this.coord,
                  end: this._params.coord,
                });
                if (this.path.length) {
                  this.vector = this.path[0];
                }
                else{
                  this.status = 1;
                }
              }
              //判断是否为边缘可通过位置 funder算法返回节点会在该位置将change属性设为1
              if (this.vector.change) {
                this.coord.x = this.vector.x;
                this.coord.y = this.vector.y;
                let pos = map.mapCoorToCanvasPosition(this.coord.x, this.coord.y);
                this.x = pos.x;
                this.y = pos.y;
              }
              //方向判定
              if (this.vector.x > this.coord.x) {
                this.direction = 0;
              } else if (this.vector.x < this.coord.x) {
                this.direction = 2;
              } else if (this.vector.y > this.coord.y) {
                this.direction = 1;
              } else if (this.vector.y < this.coord.y) {
                this.direction = 3;
              }
            }
            //更新位置信息
            this.x += this.speed * _COS[this.direction];
            this.y += this.speed * _SIN[this.direction];
          },
          draw: function (context) {
            let isSick = false
            if (this.status === 3) isSick = this.times % 4 || (this.timeout > 80 && this.timeout < 720)
            if (this.status !== 4) {
              context.fillStyle = isSick ? '#BABABA' : this.color;
              let t = Math.abs(this.times % 20 - 10)
              let A = {
                x: this.x + Math.cos(Math.PI * 2 / 3 - this.direction * Math.PI / 2) * this.width * .5 / Math.cos(Math.PI / 6),
                y: this.y - Math.sin(Math.PI * 2 / 3 - this.direction * Math.PI / 2) * this.width * .5 / Math.cos(Math.PI / 6)
              }
              let B = {
                x: this.x + Math.cos(Math.PI * 2 / 3 - this.direction * Math.PI / 2 + t * Math.PI / 45) * (this.width * .5 + t) / Math.cos(Math.PI / 6),
                y: this.y - Math.sin(Math.PI * 2 / 3 - this.direction * Math.PI / 2 + t * Math.PI / 45) * (this.width * .5 + t) / Math.cos(Math.PI / 6)
              }
              let C = {
                x: this.x + Math.cos(Math.PI * 5 / 6 - this.direction * Math.PI / 2) * this.width * .35,
                y: this.y - Math.sin(Math.PI * 5 / 6 - this.direction * Math.PI / 2) * this.width * .35
              }
              let D = {
                x: this.x + Math.cos(Math.PI - this.direction * Math.PI / 2) * (this.width * .5 + t),
                y: this.y - Math.sin(Math.PI - this.direction * Math.PI / 2) * (this.width * .5 + t)
              }
              let E = {
                x: this.x + Math.cos(Math.PI * 7 / 6 - this.direction * Math.PI / 2) * this.width * .35,
                y: this.y - Math.sin(Math.PI * 7 / 6 - this.direction * Math.PI / 2) * this.width * .35
              }
              let F = {
                x: this.x + Math.cos(Math.PI * 4 / 3 - this.direction * Math.PI / 2 - t * Math.PI / 45) * (this.width * .5 + t) / Math.cos(Math.PI / 6),
                y: this.y - Math.sin(Math.PI * 4 / 3 - this.direction * Math.PI / 2 - t * Math.PI / 45) * (this.width * .5 + t) / Math.cos(Math.PI / 6)
              }
              let G = {
                x: this.x + Math.cos(Math.PI * 4 / 3 - this.direction * Math.PI / 2) * this.width * .5 / Math.cos(Math.PI / 6),
                y: this.y - Math.sin(Math.PI * 4 / 3 - this.direction * Math.PI / 2) * this.width * .5 / Math.cos(Math.PI / 6)
              }

              context.beginPath();
              context.arc(this.x, this.y, this.width * .5, (1 / 2) * Math.PI + this.direction * Math.PI / 2, this.direction * Math.PI / 2 - (1 / 2) * Math.PI, true);
              context.lineTo(A.x, A.y);

              context.quadraticCurveTo(B.x, B.y, C.x, C.y);
              context.quadraticCurveTo(D.x, D.y, E.x, E.y);
              context.quadraticCurveTo(F.x, F.y, G.x, G.y);
              context.fill();
              context.closePath();
            }

            let H = {
              x: this.x + Math.cos(Math.PI / 4 - this.direction * Math.PI / 2) * this.width * .26,
              y: this.y - Math.sin(Math.PI / 4 - this.direction * Math.PI / 2) * this.width * .26
            }
            let I = {
              x: this.x + Math.cos(-Math.PI / 4 - this.direction * Math.PI / 2) * this.width * .26,
              y: this.y - Math.sin(-Math.PI / 4 - this.direction * Math.PI / 2) * this.width * .26
            }
            context.fillStyle = '#FFF';
            context.beginPath();
            context.arc(H.x, H.y, this.width * .12, 0, 2 * Math.PI, false);
            context.arc(I.x, I.y, this.width * .12, 0, 2 * Math.PI, false);
            context.fill();
            context.closePath();
            context.fillStyle = '#000';
            context.beginPath();
            context.arc(H.x + this.width * (.04 * _COS[this.direction]), H.y + this.height * (.04 * _SIN[this.direction]), this.width * .07, 0, 2 * Math.PI, false);
            context.arc(I.x + this.width * (.04 * _COS[this.direction]), I.y + this.height * (.04 * _SIN[this.direction]), this.width * .07, 0, 2 * Math.PI, false);
            context.fill();
            context.closePath();
          }
        })
      }
      items = stage.getItemsByType(2);
      //玩家控制角色
      player = stage.createItem({
        width: 30,
        height: 30,
        type: 1,               //玩家类型
        location: map,         //地图
        coord: {x: 13.5, y: 23}, //地图坐标
        direction: 2,          //前进方向向左
        speed: 1,              //移动速度
        frames: 3,            //速度等级:多少帧变化一次
        update: function () {
          let coord = this.coord;
          let value = map.get(this.coord.x + _COS[this.direction], this.coord.y + _SIN[this.direction]);
          if (!coord.offset) {
            if (typeof this.control.direction != 'undefined') {
              if (!map.get(this.coord.x + _COS[this.control.direction], this.coord.y + _SIN[this.control.direction])) {
                this.direction = this.control.direction
              }
            }
            // this.control = {}
            if (value === 0) {
              this.x += this.speed * _COS[this.direction]
              this.y += this.speed * _SIN[this.direction]
            } else if (value < 0) {
              this.x -= map.size * (map.x_length - 1) * _COS[this.direction];
              this.y -= map.size * (map.y_length - 1) * _SIN[this.direction];
              console.log(this.x, this.y)
            }
          } else {
            //如果当前位置存在豆子
            if (!beans.get(this.coord.x, this.coord.y)) {
              _SCORE++;
              beans.set(this.coord.x, this.coord.y, 1);
              //若该豆子是特殊豆子 改变NPC状态
              if (config['goods'][this.coord.x + ',' + this.coord.y]) {
                items.forEach(function (item) {
                  if (item.status === 1 || item.status === 3) {	//如果NPC为正常状态，则置为临时状态
                    item.status = 3;
                    item.timeout = 800
                  }
                });
              }
            }
            this.x += this.speed * _COS[this.direction]
            this.y += this.speed * _SIN[this.direction]
          }
        },
        draw: function (context) {
          let t = Math.abs(5 - this.times % 10);
          let offsetX = 0, offsetY = 0;

          this.direction === 0 || this.direction === 2 ? offsetY = -8 : offsetY = 0
          this.direction === 1 || this.direction === 3 ? offsetX = 8 : offsetX = 0

          context.fillStyle = _COLORPLAYER[0];
          context.strokeStyle = _COLORPLAYER[1];
          context.lineWidth = 2
          if (stage.status !== 3) {	//玩家正常状态
            context.beginPath();
            context.arc(this.x, this.y, this.width / 2, (.5 * this.direction + t * .04) * Math.PI, (.5 * this.direction + 2 - t * .04) * Math.PI, false);
            context.lineTo(this.x, this.y);
            context.lineTo(this.x + (this.width / 2) * Math.cos((.5 * this.direction + t * .04) * Math.PI), this.y + (this.width / 2) * Math.sin((.5 * this.direction + t * .04) * Math.PI))
            context.stroke();
            context.closePath();
            context.fill();

            context.fillStyle = '#000';
            context.beginPath();
            context.arc(this.x + _COS[this.direction] * 2 + offsetX, this.y + _SIN[this.direction] * 2 + offsetY, 2, 0, 2 * Math.PI, false);
            context.closePath();
            context.fill();
          }
        }
      })
      //绑定事件(上下左右空格回车)
      stage.bind('keydown', function (e) {
        switch (e.keyCode) {
          case 32: //空格
            this.status = this.status === 2 ? 1 : 2;
            break;
          case 39: //右
            player.control = {direction: 0};
            break;
          case 40: //下
            player.control = {direction: 1};
            break;
          case 37: //左
            player.control = {direction: 2};
            break;
          case 38: //上
            player.control = {direction: 3};
            break;
        }
      });
    })
  })();
  //---------------------------------------------------初始化结束页面-----------------------------------------------------
  (function () {
    let stage = game.createStage()
    //结束语
    stage.createItem({
      x: game.width * .5,
      y: game.height * .5,
      draw: function (context) {
        context.font = 'bold 42px Helvetica';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000000';
        context.fillText('GAME OVER', this.x, this.y);
      }
    });
    //得分
    stage.createItem({
      x: game.width * .5,
      y: game.height * .6,
      draw: function (context) {
        context.font = 'bold 42px Helvetica';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000000';
        context.fillText('SCORE:  ' + _SCORE, this.x, this.y);
      }
    });
    stage.bind('keydown', function (e) {
      switch (e.keyCode) {
        case 32:
          _LIFE = 5;
          _SCORE = 0;
          game.setStage(1);
          break;
      }
    });
  })();
  //启动游戏引擎
  game.start()
})();