// pages/chat-room/chatRoom.js
import * as Colyseus from '../../lib/colyseus.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    room: {},
    messageList: [],
    messageContent: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    var client = new Colyseus.Client('ws://172.26.2.116:2567');
    client.joinOrCreate("chat").then(room => {
      this.data.room = room;
      console.log('加入房间', room.sessionId, "joined", room.name);
      room.onStateChange((state) => {
        console.log(room.name, "has new state:", state);
      });
  
      room.onMessage("*", (type, message) => {
        console.log(room.sessionId, "received on", room.name, type, message);
        const name = message.substring(0, message.indexOf(' '));
        this.data.messageList.push({
          name: name,
          content: message.slice(message.indexOf(' ') + 1),
          isSelf: (name === room.sessionId)
        });
        this.setData({
          messageList: this.data.messageList
        })
      });
  
      room.onError((code, message) => {
        console.log(client.id, "couldn't join", room.name);
      });
  
      room.onLeave((code) => {
        console.log(client.id, "left", room.name);
      });


    }).catch(e => {
      console.log("JOIN ERROR", e);
    });
    
    

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
    this.room.leave();
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

  },
  messageInput (e) {
    this.setData({
      messageContent: e.detail.value
    })
  },
  inputConfirm (e) {
    this.data.room.send('message', e.detail.value)
    this.setData({
      messageContent: ''
    })
  },
  send() {
    this.data.room.send('message', this.data.messageContent)
    this.setData({
      messageContent: ''
    })
  }
})