let regeneratorRuntime = require("../../utils/regenerator-runtime/runtime");
import { $wuxToast } from '../../dist/index'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    active_shop: 'gray',
    active_park: 'gray',
    active_spot: 'gray',

    imgList: [], // 图片的临时地址和已上传图片的id列表
    fileIDList:[],  // 已上传图片的id列表
    tag: '添加',
    _id: '',  // 需要更改标记的id
    marker_latitude: 0,
    marker_longitude: 0,
    marker_position: '',
    marker_position_name: '',
    marker_position_description: '',
    marker_type: [],
    marker_warn: '',
    img_num: 0  //上传图片的计数
  },

  /**
   * 选择Tag
   */
  clickTag(e){
    const id = e.target.dataset.id
    if(id==0){
      let bg=(this.data.active_shop==='gray')?'mauve':'gray'
      this.setData({
        active_shop: bg
      })
    }else if(id==1){
      let bg = (this.data.active_park === 'gray') ? 'mauve' : 'gray'
      this.setData({
        active_park: bg
      })
    }else{
      let bg = (this.data.active_spot === 'gray') ? 'mauve' : 'gray'
      this.setData({
        active_spot: bg
      })
    }
  },

  /**
   * 处理添加/更新标记
   */
  async handleSubmit(e) {
    let { _id, tag, marker_latitude, marker_position, marker_longitude, fileIDList, imgList, img_num } = this.data
    const { marker_position_name, marker_position_description, marker_warn,} = e.detail.value
    let marker_type=[]
    let isshop=false
    if(this.data.active_shop==='mauve'){
      marker_type.push(0)
      isshop=true
    } 
    if (this.data.active_park === 'mauve'){
      marker_type.push(1)
    } 
    if (this.data.active_spot === 'mauve') {
      marker_type.push(2)
    }
    if (!marker_position) {
      $wuxToast().show({
        type: 'text',
        duration: 1500,
        color: '#996996',
        text: '请选择地点'
      })
      return
    }

    // 删除 更新去掉的图片
    let len = fileIDList.length
    let i = 0
    let deleteimglist = []
    for (; i < len; i++){
      if (imgList.indexOf(fileIDList[i])===-1){
        deleteimglist.push(fileIDList[i])
        fileIDList[i]='0'
      }
    }
    fileIDList=fileIDList.filter(n => n!='0')
    if(deleteimglist.length>0){
      wx.cloud.deleteFile({
        fileList: deleteimglist,
        success: res => {
          // handle success
          console.log('删除成功')
        },
        fail: console.error
      })
    }

    // 上传图片
    len = imgList.length
    if(len>0){
      $wuxToast().show({
        type: 'default',
        duration: 20000,
        color: '#996996',
        icon: 'md-cloud-upload',
        text: '图片上传中'
      })
      for (i = 0; i < len; i++) {
        if (!imgList[i].startsWith("cloud")) {
          await wx.cloud.uploadFile({
            cloudPath: '' + marker_latitude + marker_longitude + (++img_num) + '.png',
            filePath: imgList[i], // 文件路径
          }).then(res => {
            // get resource ID
            fileIDList.push(res.fileID)
          }).catch(error => {
            // handle error
            console.log(error)
          })
        }
      }
      $wuxToast().hide()
    }
    
    // 添加标记记录
    const db = wx.cloud.database()
    const that = this
    if (tag === '添加') {
      // 添加标记
      await db.collection('coordinates').add({
        data: {
          check: false,
          isshop,
          marker_latitude,
          marker_longitude,
          marker_position_name
        }
      })
        .then(res => {
          that.setData({
            _id: res._id
          })
        })
      _id = that.data._id
      db.collection('markers').add({
        data: {
          _id,
          marker_position_description,
          marker_position,
          marker_type,
          marker_warn,
          fileIDList,
          img_num
        },
        success(res) {
          console.log('添加成功,审核中')
          $wuxToast().show({
            type: 'success',
            duration: 1500,
            color: '#996996',
            text: '添加成功,审核中',
            success: () => wx.navigateBack({
              delta: 1
            })
          })
        },
        fail(e) {
          console.log(e)
        }
      })
    }
    else {
      // 更新标记
      db.collection('coordinates').doc(_id).update({
        data:{
          isshop,
          marker_latitude,
          marker_longitude,
          marker_position_name
        }
      })
      db.collection('markers').doc(_id).update({
        data: {
          marker_position_description,
          marker_position,
          marker_type,
          marker_warn,
          fileIDList,
          img_num
        },
        success(res) {
          $wuxToast().show({
            type: 'success',
            duration: 1500,
            color: '#996996',
            text: '更新成功',
            success: () => wx.navigateBack({
              delta: 1
            })
          })
        },
        fail(e) {
          console.log(e)
        }
      })
    }
  },

  /**
   * 选择图片
   */
  ChooseImage() {
    wx.chooseImage({
      count: 4, //默认9
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album'], //从相册选择
      success: (res) => {
        if (this.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths)
          })
        } else {
          this.setData({
            imgList: res.tempFilePaths
          })
        }
      }
    });
  },

  /**
   * 查看图片
   */
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },

  /**
   * 删除图片
   */
  DelImg(e) {
    wx.showModal({
      title: 'Skater',
      content: '确定要删除这张图片吗？',
      cancelText: '取消',
      confirmText: '删除',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },

  /**
   * 选择标记位置
  */
  chooseL(e){
    let that=this
    wx.chooseLocation({
      success: function(res) {
        that.setData({
          marker_position_name: res.name,
          marker_position: res.address,
          marker_latitude: res.latitude,
          marker_longitude: res.longitude
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { tag } = options
    if (tag=='更新'){  // 若为-1，则是增加标记页面，否则为更新标记页面
      wx.setNavigationBarTitle({
        title: '更新标记'
      })
      const that = this
      const markerinfo = JSON.parse(options.markerinfo)
      let { _id, _openid, marker_position_name, marker_latitude, marker_longitude } = markerinfo
      that.setData({
        _id,
        tag,
        marker_position_name,
        marker_latitude,
        marker_longitude
      })
      const db = wx.cloud.database()
      db.collection('markers').doc(_id).get({
        success(res){
          const { marker_position, marker_position_description, marker_type, marker_warn, fileIDList, img_num }=res.data
          const typelen=marker_type.length
          let active_shop = 'gray', active_park = 'gray',active_spot='gray'
          for(let i=0;i<typelen;i++){
            if(marker_type[i]==0){
              active_shop='mauve'
            } else if (marker_type[i] == 1){
              active_park = 'mauve'
            }else{
              active_spot = 'mauve'
            }
          }
          let imgList=fileIDList.filter(n => true)
          that.setData({
            marker_position_description,
            marker_position,
            active_shop,
            active_park,
            active_spot,
            marker_warn,
            fileIDList,
            imgList,
            img_num,
          })
        }
      })
    }else{
      wx.setNavigationBarTitle({
        title: '添加标记'
      })
    }
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