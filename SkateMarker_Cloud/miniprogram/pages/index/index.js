let regeneratorRuntime = require("../../utils/regenerator-runtime/runtime");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    markers: [],  // map上的标记坐标集合
    latitude: 23.04939,
    longitude: 113.4055,
    user_latitude: 113.4055,
    user_longitude: 113.4055,
    wdheg: 0, // 设置 map 窗口高度
    avatarurl: '/static/userimg.png', // 用户头像url
  },

  /**
   * 返回当前位置
   */
  backLocate(){
    const { user_latitude, user_longitude} = this.data
    this.setData({
      latitude: user_latitude,
      longitude: user_longitude
    })
  },

  /**
   * 获取Markers信息
   */
  async getMarkers(){
    let data=[]
    await wx.cloud.callFunction({
      name: 'getMarker'
    }).then(function (res) {
      data=res.result.data
    })
    let markers=[]
    const markerlist_len=data.length
    for (var i = 0; i < markerlist_len; i++) {
      let item = {
        iconPath: '/static/mark.png',
        id: 0,
        latitude: 0,
        longitude: 0,
        width: 50,
        height: 50
      }
      if(data[i].isshop===true){
        item.iconPath = '/static/mark_shop.png'
        item.width = 55
        item.height = 55
      }
      item.latitude = data[i].marker_latitude
      item.longitude = data[i].marker_longitude
      item.marker_latitude = data[i].marker_latitude
      item.marker_longitude = data[i].marker_longitude
      item.marker_position_name = data[i].marker_position_name
      item.id = i
      item._id = data[i]._id
      markers.push(item)
    }
    this.setData({
      markers
    })
  },

  /**
   * 搜索地点
   */
  searchLoc(e) {
    let that = this
    wx.chooseLocation({
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail(e){
        console.log(e)
      }
    })
  },

  /**
   * 获取用户地理信息
   */
  getUserLoc(){
    let that=this
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          user_latitude: res.latitude,
          user_longitude: res.longitude
        })
      },
      fail(e){
        console.log(e)
      }
    })
  },

  /**
   * 跳转用户中心
   */
  goUserCenter(){
    wx.navigateTo({
      url: '/pages/usercenter/usercenter?avatarurl=' + this.data.avatarurl+'&wdheg='+this.data.wdheg,
    })
  },

  /**
   * 跳转添加标记页面
   */
  handleclick(){
    wx.navigateTo({
      url: '/pages/addmark/addmark?tag=添加&markerinfo=-1',
    })
  },

  /**
   * 显示标记详细信息
   */
  markertap(e) {
    const markerinfo = JSON.stringify(this.data.markers[e.markerId])
    wx.navigateTo({
      url: '/pages/markerinfo/markerinfo?markerinfo=' + markerinfo + '&wdheg=' + this.data.wdheg,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const userInfo=JSON.parse(options.userInfo)
    const avatarurl = userInfo.avatarUrl
    this.setData({
      avatarurl,
      wdheg: options.wdheg
    })
    this.getUserLoc()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (e) {
    this.getMarkers()
    wx.hideShareMenu()
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