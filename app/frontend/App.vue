<script>
import { useUserStore } from '@/store/modules/user'

export default {
  onLaunch: function () {
    console.log('App Launch')
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
