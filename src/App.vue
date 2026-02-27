<script>
import { useUserStore } from '@/store/modules/user'
import { checkUpdate } from '@/utils/update'

export default {
  onLaunch: function () {
    console.log('App Launch')
    
    // 检查更新
    checkUpdate()
    
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-2gknmgzd611e80b4',
        traceUser: true,
      })
    }
    
    const userStore = useUserStore()
    userStore.init()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style lang="scss">
/* 每个页面公共css */
/* #ifndef APP-NVUE */
@import '@/static/custom.scss';
// 设置整个项目的背景色
page {
	background-color: #f5f5f5;
}
/* #endif */
</style>
