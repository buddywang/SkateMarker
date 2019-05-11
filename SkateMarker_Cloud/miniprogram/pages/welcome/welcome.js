import { $wuxDialog } from '../../dist/index'

// pages/welcome/welcome.js
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    wdheg: ''
  },

  /**
   * 获取窗口高度（map高度）
   */
  getWindowHeight() {
    let that = this;
    wx.getSystemInfo({
      success: function (res) {
        var clientHeight = res.windowHeight;
        that.setData({
          wdheg: clientHeight
        })
      }
    })
  },

  /**
   * 获取用户信息成功
   */
  getUserMsg(e){
    const errMsg=e.detail.errMsg
    if (errMsg ==="getUserInfo:fail auth deny"){
      console.log('getusermsg fail')
      $wuxDialog().alert({
        content: 'SkateMarker需要获取你的头像信息',
      })
    }
    else{
      const userInfo = JSON.stringify(e.detail.userInfo)
      const wdheg=this.data.wdheg
      wx.redirectTo({
        url: '/pages/index/index?userInfo=' + userInfo + '&wdheg=' + wdheg
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getWindowHeight()
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})