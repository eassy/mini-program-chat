// pages/chatIndex/chatIndex.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

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

  },
  jumpToPointToPoint () {
    wx.navigateTo({
      url: '/pages/chat-point2point/point2point',
    })
  },
  jumpToRoom () {
    wx.navigateTo({
      url: '/pages/chat-room/chatRoom',
    })
  },
  jumpToAuth () {
    wx.navigateTo({
      url: '/pages/chat-auth/chat-auth',
    })
  },
  jumpToReconnection () {
    wx.navigateTo({
      url: '/pages/chat-reconnection/chat-reconnection',
    })
  },
  jumpToLobbyRoom () {
    wx.navigateTo({
      url: '/pages/chat-lobby/chat-lobby',
    })
  },
  jumpToRelayRoom () {
    wx.navigateTo({
      url: '/pages/chat-relay/chat-relay',
    })
  }
})