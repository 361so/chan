export default {
  onLoad() {
    // 开启分享菜单
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },
  onShareAppMessage(res) {
    return {
      title: '发现身边不文明行为，一起铲一铲！',
      path: '/pages/index/index',
      imageUrl: '/static/logo.png'
    }
  },
  onShareTimeline(res) {
    return {
      title: '发现身边不文明行为，一起铲一铲！',
      query: ''
    }
  }
}