// pages/chat-point2point/point2point.js
import * as Colyseus from '../../lib/colyseus.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    room: {},
    players: [],

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var client = new Colyseus.Client('ws://172.26.2.116:2567');
    var _this = this;
    client.joinOrCreate('state_handler').then(room_instance => {
      
      var players = {};
      var colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
      console.log('加入房间, room:', room_instance);
      room_instance.state.players.onAdd = function (player, sessionId) {
        
        player.sessionId = sessionId;
        
        _this.data.players.push(player);
        _this.setData ({
          players: _this.data.players
        });
        player.onChange = function (changes) {
          console.log('player:', _this.data.players)
        }
      }
      room_instance.state.players.onRemove = function (player, sessionId) {
        document.body.removeChild(players[sessionId]);
        delete players[sessionId];
      }
      room_instance.onMessage("hello", (message) => {
        console.log(message);
      });
      _this.room = room_instance;
      
    });
  },
  up () {
    this.room.send("move", { y: -1 });
  },
  right () {
    this.room.send("move", { x: 1 });
  },
  down () {
    this.room.send("move", { y: 1 });
  },
  left () {
    this.room.send("move", { x: -1 });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})