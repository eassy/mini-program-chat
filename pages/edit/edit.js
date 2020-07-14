Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardItem: {
      name:'',
      number:'',
      id: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    var isEdit = options['isEdit']
    
    isEdit = Boolean(isEdit)
    this.setTitle(isEdit)
    if (isEdit) {
      let lastItem = JSON.parse(options['item'])
      this.setData({
        cardItem: lastItem
      })
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log(this.data.cardItem.name)
    
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
  setTitle: function (isEdit) {
    
    var navTitle = '编辑卡片'
    
    if (isEdit == false) {
      navTitle = '添加新的卡片'
    } 
    
    wx.setNavigationBarTitle({
      title: navTitle,
    })
  },
  submitHandler: function (e) {
    
    let newCard = e.detail.value
    let card = this.data['cardItem']
    if (!card.id) {
      this.addCard(newCard)
      
    } else {
      newCard.id = card.id
      this.changeCard(newCard)
    }
  },
  addCard: function (newCard) {
    var timestamp = Date.parse(new Date());  
    timestamp = timestamp / 1000;
    let dateString = timestamp.toString()
    let card = {
      name: newCard.name,
      number: newCard.number,
      id: dateString
    }
    wx.getStorage({
      key: 'cards',
      success: function(res) {
        var nowArray = res.data
        nowArray.push(card)
        wx.setStorage({
          data: nowArray,
          key: 'cards',
          success: function(res) {
            wx.navigateBack({
              delta: 0,
            })
          }
        })
      },
      fail: function(res) {
        var newArray = [card]
        wx.setStorage({
          data: newArray,
          key: 'cards',
          success: function(res) {
            wx.navigateBack({
              delta: 0,
            })
          }
        })
      }
    })
  },
  changeCard: function (newCard) {
    
    let oldCard = this.data['cardItem']
    wx.getStorage({
      key: 'cards',
      success: function(res){
        let oldCards = res.data
        let newCards = []
        for (let i = 0; i < oldCards.length; i++) {
          const oldCard = oldCards[i];
          if (oldCard.id == newCard.id) {
            oldCard.name = newCard.name
            oldCard.number = newCard.number
          }
          console.log(oldCard)
          console.log(newCard)
        }
        
        
        wx.setStorage({
          data: oldCards,
          key: 'cards',
          success: function(res) {
            wx.navigateBack({
              delta: 0,
            })
          }
        })
      }
    })

    

    
    
  }

})