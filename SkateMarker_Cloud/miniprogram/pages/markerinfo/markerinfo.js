let regeneratorRuntime = require("../../utils/regenerator-runtime/runtime");
import { $wuxGallery } from '../../dist/index'
import { $wuxToast } from '../../dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    likesrc: '/static/like.png',
    like: false,   // 当前页面收藏变化记录
    like_state: false,   // 历史收藏记录
    _id: '-1',
    _openid: '-1',
    superuser: false,
    wdheg: '',
    markers: [],
    latitude: 23.129163,
    longitude: 113.264435,
    marker_position: '无',
    marker_position_name: '无',
    marker_position_description: '无',
    marker_type: '无',
    isshop: false,
    ispark: false,
    isspot: false,
    marker_warn: '无',
    fileIDList: [],
    urls: [],
    imgList: []
  },

  /**
   * 通过审核
   */
  overCheck(){
    const db = wx.cloud.database()
    db.collection('coordinates').doc(this.data._id).update({
      data:{
        check: true
      },
      success(res){
        console.log('overcheck')
        $wuxToast().show({
          type: 'success',
          duration: 1500,
          color: '#996996',
          text: '通过审核成功',
          success: () => wx.navigateBack({
            delta: 1
          })
        })
      }
    })
  },

  /**
   * 查看图片
   */
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.urls,
      current: e.currentTarget.dataset.url
    });
  },

  /**
   * 切换用户收藏
   */
  handleLike(){
    const {like}=this.data
    if(like){
      console.log('unlike')
      this.setData({
        likesrc: '/static/like.png',
        like: false
      })
    }
    else{
      console.log('like')
      this.setData({
        likesrc: '/static/activate_like.png',
        like: true
      })
    }
    
  },

  /**
   * 导航地点
   */
  handleGaide(){
    const { latitude, longitude, marker_position, marker_position_name}=this.data
    wx.openLocation({
      latitude,
      longitude,
      name: marker_position_name,
      address: marker_position
    })
  },
  
  /**
   * 查看图片
   */
  showGallery(e) {
    const { current } = e.currentTarget.dataset  // ES6 解构赋值
    const { urls } = this.data  // ES6 解构赋值
    this.$wuxGallery = $wuxGallery()
    this.$wuxGallery.show({
      showDelete: false,
      current,
      urls,
      onTap(current, urls) {
        return true
      },
    })
  },

  /**
   * 生命周期函数--监听页面加载 --- 初始化标记信息
   */
  onLoad: async function (options) {
    const that=this
    const wdheg = options.wdheg
    const markerinfo = JSON.parse(options.markerinfo)
    let { _id, marker_latitude, marker_longitude, marker_position_name, superuser } = markerinfo
    if(!superuser){
      superuser=false
      wx.setNavigationBarTitle({
        title: '标记详情'
      })
    }else{
      wx.setNavigationBarTitle({
        title: '审核标记'
      })
    }
    this.setData({
      superuser,
      _id,
      wdheg,
      latitude: marker_latitude,
      longitude: marker_longitude,
      marker_position_name
    })
    const db = wx.cloud.database()
    // 获取标记信息
    await db.collection('markers').doc(_id).get().then(res => {
      const { marker_position_description, marker_position, marker_type, marker_warn, fileIDList } = res.data
      const typelen=marker_type.length
      let isshop=false, ispark=false, isspot=false
      for(let i=0;i<typelen;i++){
        if(marker_type[i]==0){
          isshop=true
        }else if(marker_type[i]==1){
          ispark=true
        }else{
          isspot=true
        }
      }
      that.setData({
        marker_position_description, marker_position, marker_warn, fileIDList, isshop,ispark,isspot
      })
    })
    const { fileIDList } = that.data
    // 获取图片临时地址
    wx.cloud.getTempFileURL({
      fileList: fileIDList,
      success(res) {
        const fileList = res.fileList
        const len = fileList.length
        let {urls} = that.data
        for(var i=0;i<len;i++){
          urls.push(fileList[i].tempFileURL)
        }
        that.setData({
          urls
        })
      },
      fail(e){
        console.log(e)
      }
    })
    // 获取openid
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        this.setData({
          _openid: res.result.openid
        })
      }
    })
    const markers = [{
      iconPath: '/static/mark.png',
      latitude: marker_latitude,
      longitude: marker_longitude,
      width: 50,
      height: 50
    }] 
    this.setData({
      markers
    })

    // 获取like状态信息
    db.collection('user').where({
      _openid: this.data._openid
    })
    .get({
      success(res){
        const likelist = res.data[0].like
        const len=likelist.length
        const { _id } = that.data
        for(var i=0;i<len;i++){
          if(_id===likelist[i].id){
            i=-1
            break
          }
        }
        if(i===-1){
          that.setData({
            like_state: true,
            like: true,
            likesrc: '/static/activate_like.png'
          })
        }
      }
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
    const {like, like_state}=this.data
    if(like!=like_state){
      const db = wx.cloud.database()
      const _ = db.command
      const { _id, _openid, marker_position_name, latitude, longitude, } = this.data
      let that = this
      if(like===true){
        // 添加收藏记录
        db.collection('user').where({
          _openid: _openid
        }).get({
          success(res){
            let len=res.data.length
            if(len===0){
              // 当前没有该用户记录，先创建一条记录
              db.collection('user').add({
                data:{
                  like:[{
                    id: _id,
                    marker_latitude: latitude, 
                    marker_longitude: longitude,
                    marker_position_name
                  }]
                },
                success(res){
                  console.log('创建收藏记录成功')
                },
                fail(e){
                  console.log(e)
                }
              })
            }
            else{
              // 当前存在该用户记录，更新记录
              const id=res.data[0]._id
              db.collection('user').doc(id).update({
                data:{
                  like: _.unshift({
                    id: _id,
                    marker_latitude: latitude,
                    marker_longitude: longitude,
                    marker_position_name
                  })
                },
                success(res){
                  console.log('更新收藏记录成功')
                },
                fail(e){
                  console.log(e)
                }
              })
            }
          },
          fail(e){
            console.log(e)
          }
        })
      }
      else{
        // 移除收藏记录
        db.collection('user').where({
          _openid
          })
          .get({
          success(res){
            let likelist = res.data[0].like
            const len = likelist.length
            for(var i=0;i<len;i++){
              if (likelist[i].id === _id)
                break
            }
            likelist.splice(i,1)
            const like_id = res.data[0]._id  // user 集合like属性中该标记对应的 _id
            db.collection('user').doc(like_id).update({ 
              data:{
                like: likelist
              },
              success(res){
                console.log('取消收藏成功')
              },
              fail(e){
                console.log(e)
              }
            })
          }
        })
      }
    }
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