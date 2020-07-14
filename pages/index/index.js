Page({

  /**
   * 页面的初始数据
   */
  data: {
    cards:[
    ],
    startTime: 0,
    endTime: 10
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.login({
      success (res) {
        
      }
    })

  },
  touchStart: function (e){
    this.setData({
      startTime: e.timeStamp
    })
  },
  touchEnd: function (e) {
    this.setData({
      endTime: e.timeStamp
    })
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
    this.getHomeData()
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
  getHomeData: function () {
    var cards = []
    var that = this
    wx.getStorage({
      key: 'cards',
      success: function(res) {
        let oldCards = res.data
        console.log(oldCards)
        that.setData({
          cards:oldCards
        })
      }
    })
    
   
  },
  addNewCard: function () {
    wx.navigateTo({
      url: '../edit/edit',
    })
  },
  editCard: function (e) {
    console.log(this.data)
    if (this.data['endTime'] - this.data['startTime'] < 350) {
      let cardItem = e.currentTarget.dataset.item
      let cardItemString = JSON.stringify(cardItem)
      wx.navigateTo({
        url: '../edit/edit?isEdit=1&item='+cardItemString,
      })  
    }
  },
  longPress: function (e) {

    let cardItem = e.currentTarget.dataset.item
    let number = cardItem.number
    wx.setClipboardData({
      data: number,
    })
  }
})