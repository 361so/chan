<template>
  <view class="container">
    <view class="user-card">
      <view class="avatar-container" @click="changeAvatar">
        <image 
          class="avatar" 
          :src="(userStore.userInfo && userStore.userInfo.avatarUrl) || '/static/images/icon.png'" 
          mode="aspectFill"
        />
      </view>
      <view class="info">
        <view v-if="userStore.isLoggedIn" class="name" @click="changeNickName">{{ (userStore.userInfo && userStore.userInfo.nickName) || '铲屎官' }}</view>
        <view v-else class="name" @click="handleLogin">点击登录</view>
        <view v-if="userStore.isLoggedIn" class="points">积分：{{ userStore.points || 0 }}</view>
      </view>
    </view>

    <view class="stats-card card" v-if="userStore.isLoggedIn">
      <view class="stat-item">
        <view class="num">{{ userStore.points }}</view>
        <view class="label">当前积分</view>
      </view>
      <view class="stat-item" @click="navigateTo('history')">
        <view class="num">{{ userStore.reportCount }}</view>
        <view class="label">累计上报</view>
      </view>
      <view class="stat-item">
        <view class="num">{{ userStore.weeklyRank }}</view>
        <view class="label">本周排名</view>
      </view>
    </view>

    <view class="menu-list card">
      <view class="menu-item" @click="navigateTo('record')">
        <text>积分记录</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateTo('shop')">
        <text>积分兑换</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/user/about')">
        <text>关于我们</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/user/privacy')">
        <text>用户隐私及服务内容</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" v-if="isAdmin" @click="navigateTo('admin')">
        <text>管理员审核</text>
        <text class="arrow">›</text>
      </view>
      <button class="menu-item share-btn" open-type="share">
        <text>分享给好友</text>
        <text class="arrow">›</text>
      </button>
    </view>
    
    <button v-if="userStore.isLoggedIn" class="logout-btn" @click="handleLogout">退出登录</button>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/modules/user'
import { computed } from 'vue'
import { request, uploadFile } from '@/utils/request'

const userStore = useUserStore()

// Share config
// Removed specific share config to use global mixin, or keep as override if needed. 
// For now, removing to let global mixin take over, OR we can keep it if we want dynamic title with points.
// User asked for "add to ALL pages", which implies a default.
// But this page has specific data (points) we might want to share. 
// Let's comment it out to test the global mixin first, or keep it. 
// Actually, global mixin is "default", component level is "override". 
// Let's keep this one as it is more specific and better for the user page.
// But wait, the user said "Give all pages...". 
// I will keep the specific one here as it's better, but I'll remove the import of onShare... to avoid duplication if I decide to rely on mixin. 
// However, mixin in Vue 3 + <script setup> is tricky. 
// Let's rely on the mixin I just added to main.js. 
// If I remove these, the mixin should work. 
// BUT, Composition API `onShareAppMessage` might not be affected by Options API `mixin`.
// Let's removing the Composition API hooks here to see if the Mixin works.

const isAdmin = computed(() => {
  return userStore.userInfo && userStore.userInfo.role === 'admin'
})

const handleLogin = async () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}

const changeAvatar = () => {
  if (!userStore.isLoggedIn) {
    handleLogin()
    return
  }
  
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const filePath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...' })
      
      // Upload to cloud storage
      uploadFile(filePath).then(url => {
        // Update user profile
        updateUserInfo({ avatarUrl: url })
      }).catch(err => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      })
    }
  })
}

const changeNickName = () => {
  if (!userStore.isLoggedIn) return
  
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '请输入新昵称',
    content: userStore.userInfo.nickName,
    success: (res) => {
      if (res.confirm && res.content) {
        updateUserInfo({ nickName: res.content })
      }
    }
  })
}

const updateUserInfo = async (data) => {
  uni.showLoading({ title: '更新中...' })
  try {
    // Call cloud function to update
    await request({
      url: '/user/update',
      method: 'POST',
      data: data
    })
    
    // Update local store
    userStore.updateProfile(data)
    uni.hideLoading()
    uni.showToast({ title: '更新成功' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const navigateTo = (path) => {
  if (path === 'shop') {
     uni.showToast({ title: '功能开发中...', icon: 'none' })
     return
  }
  
  if (path === 'record') {
    path = '/pages/user/record'
  }
  
  if (path === 'history') {
    path = '/pages/user/history'
  }
  
  if (path === 'admin') {
    path = '/pages/admin/audit'
  }
  
  uni.navigateTo({
    url: path
  })
}
</script>

<style lang="scss">
.user-card {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(to right, $uni-color-primary, $uni-color-success);
  color: #fff;
  border-radius: 0 0 20px 20px;
  margin-bottom: 20px;
  
  .avatar-container {
    margin-right: 15px;
    
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid #fff;
      background: #eee;
    }
  }
  
  .info {
    flex: 1;
    
    .name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .points {
      font-size: 12px;
      opacity: 0.9;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 10px;
      display: inline-block;
    }
  }
}

.user-header {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(to right, $uni-color-primary, $uni-color-success);
  color: #fff;
  
  .info {
    display: flex;
    align-items: center;
    width: 100%;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid #fff;
    margin-right: 15px;
    background: #eee;
    
    &.placeholder {
      background: rgba(255,255,255,0.3);
    }
  }
  
  .nickname {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .desc, .id {
    font-size: 12px;
    opacity: 0.8;
  }
}

.stats-card {
  display: flex;
  justify-content: space-around;
  text-align: center;
  
  .num {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  .label {
    font-size: 12px;
    color: #999;
  }
}

.menu-list {
  padding: 0 15px;
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    color: #333;
    
    &:last-child {
      border-bottom: none;
    }
    
    .arrow {
      color: #ccc;
    }
  }
  
  .share-btn {
    background-color: #fff;
    line-height: normal;
    text-align: left;
    border-radius: 0;
    margin: 0;
    padding: 15px 0;
    width: 100%;
    
    &::after {
      border: none;
    }
  }
}

.logout-btn {
  margin-top: 20px;
  background: #fff;
  color: $uni-color-error;
}
</style>
