let regeneratorRuntime = require("../../utils/regenerator-runtime/runtime");
import { $wuxDialog } from '../../dist/index'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    issuper: false,
    _openid: '0',
    userid: '0',
    wdheg: 0,
    avatarurl: '/static/userimg.png',
    TabCur: 0,
    scrollLeft: 0,
    marker_position: 'non',
    marker_position_name: 'non',
    mymarkerlist: [],
    mylikelist: [],
    mycheckingmarkerlist: [],
    tochecklist: [],
    menulist: ['我的标记','我的收藏','审核中']
  },
  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1) * 60
    })
  },

  /**
   * 跳转标记详情
   */
  async goMarkerInfo(e){
    const {TabCur}=this.data
    const index = e.target.id
    let markerinfo={}
    if(TabCur==0){
      markerinfo=this.data.mymarkerlist[index]
    }
    else if(TabCur==1){
      markerinfo = this.data.mylikelist[index]
      markerinfo._id=markerinfo.id
      const db=wx.cloud.database()
      let fail=false
      await db.collection('coordinates').doc(markerinfo._id).get()
      .then(e => {
        console.log('success')
      })
      .catch(e => {
        fail=true
        console.log('fail')
      })
      if (fail){
        $wuxDialog().alert({
          title: "提示",
          content: "该标记已被删除！"
        })
        let like = this.data.mylikelist
        like.splice(index,1)
        db.collection('user').doc(this.data.userid).update({
          data:{
            like
          },
          success(res){
            console.log('delete like success')
          }
        })
        this.setData({
          mylikelist: like
        })
        return
      } 
    }
    else if (TabCur == 4){
      markerinfo = this.data.tochecklist[index]
      this.data.tochecklist.splice(index, 1)
      this.setData({
        tochecklist: this.data.tochecklist
      })
      markerinfo.superuser = true
    }
    else{
      markerinfo = this.data.mycheckingmarkerlist[index]
    }
    markerinfo=JSON.stringify(markerinfo)
    wx.navigateTo({
      url: '/pages/markerinfo/markerinfo?markerinfo=' + markerinfo + '&wdheg=' + this.data.wdheg,
    })
  },

  /**
   * 更新标记
   */
  editMarker(e){
    const { TabCur } = this.data
    const index = e.target.id
    let markerinfo = {}
    if (TabCur == 0) {
      markerinfo = this.data.mymarkerlist[index]
    }
    else {
      markerinfo = this.data.mycheckingmarkerlist[index]
    }
    markerinfo = JSON.stringify(markerinfo)
    wx.navigateTo({
      url: '/pages/addmark/addmark?tag=更新&markerinfo='+ markerinfo,
    })
  },

  /**
   * 删除标记
   */
  deleteMarker(e){
    console.log("deletemarker")
    const that=this
    $wuxDialog().confirm({
      title: "提示",
      content: "删除该标记？",
      onConfirm: () => {
        console.log('删除标记')
        const _id = (that.data.TabCur === 0) ? that.data.mymarkerlist[e.target.id]._id : that.data.mycheckingmarkerlist[e.target.id]._id
        const db=wx.cloud.database()
        db.collection('coordinates').doc(_id).remove({
          success(res){
            console.log('delete coordinates success')
          }
        })
        db.collection('markers').doc(_id).get({
          success(res){
            wx.cloud.deleteFile({
              fileList: res.data.fileIDList,
              success: res => {
                console.log('delete img success')
                db.collection('markers').doc(_id).remove({
                  success(res) {
                    console.log('delete markers success')
                  }
                })
              },
              fail: err => console.log(err)
            })
          }
        })
        if(that.data.TabCur==0){
          let mlist = that.data.mymarkerlist
          mlist.splice(e.target.id, 1)
          that.setData({
            mymarkerlist: mlist
          })
        }
        else{
          let mlist = that.data.mycheckingmarkerlist
          mlist.splice(e.target.id, 1)
          that.setData({
            mycheckingmarkerlist: mlist
          })
        }
      }
    })
  },

  /**
   * 获取标记列表
   */
  getMyMarker(){
    const db=wx.cloud.database()
    const that=this
    const {_openid}=this.data
    // 获取我的标记和审核中的标记
    db.collection('coordinates').where({
      _openid,
    })
    .get({
      success(res){
        const markerlist=res.data
        const mymarkerlist = markerlist.filter(n => n.check)
        const mycheckingmarkerlist = markerlist.filter(n => !n.check)
        that.setData({
          mymarkerlist,
          mycheckingmarkerlist
        })
      }
    })

    // 获取我的收藏
    db.collection('user').where({
      _openid
    })
      .get({
        success(res) {
          const mylikelist = res.data[0].like
          that.setData({
            mylikelist,
            userid: res.data[0]._id
          })
        }
      })
  },

  /**
   * 获取待审核标记
   */
  getToCheck(){
    const db=wx.cloud.database()
    const that=this
    db.collection('superuser').get({
      success(res){
        let superlist = res.data[0].superlist
        if (superlist.indexOf(that.data._openid)!=-1){
          console.log('super')
          that.setData({
            issuper: true
          })
          // 获取待审核的标记
          db.collection('coordinates').where({
            check: false
          }).get({
            success(res){
              console.log('gettocheck')
              that.setData({
                tochecklist: res.data
              })
            }
          })

        }
        else{
          console.log('not superuser')
        }
      },
      fail(e){
        console.log(e)
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const that=this
    await wx.cloud.callFunction({
      name: 'login'
    }).then(function (res) {
      that.setData({
        _openid: res.result.openid
      })
    })
    this.getMyMarker()
    this.getToCheck()
    this.setData({
      avatarurl: options.avatarurl,
      wdheg: options.wdheg
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