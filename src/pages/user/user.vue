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
import { onShow } from '@dcloudio/uni-app'
import { request, uploadFile } from '@/utils/request'

const userStore = useUserStore()

onShow(() => {
  if (userStore.isLoggedIn) {
    userStore.getUserInfo()
  }
})

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
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      uni.showLoading({ title: '处理中...' })
      
      try {
        // 1. 检查图片安全
        // 检查图片大小，如果超过 1MB 则压缩
        let checkPath = filePath
        const fileInfo = await new Promise((resolve, reject) => {
            uni.getFileInfo({
                filePath: checkPath,
                success: resolve,
                fail: reject
            })
        })
        
        if (fileInfo.size > 1024 * 1024) {
            const compressRes = await new Promise((resolve, reject) => {
                uni.compressImage({
                    src: checkPath,
                    quality: 60,
                    success: resolve,
                    fail: reject
                })
            })
            checkPath = compressRes.tempFilePath
        }
        
        const fs = uni.getFileSystemManager()
        const base64 = fs.readFileSync(checkPath, 'base64')
        
        const checkRes = await wx.cloud.callFunction({
            name: 'checkContent',
            data: {
                type: 'image',
                imageBase64: base64
            }
        })
        
        if (checkRes.result.code !== 200) {
            uni.hideLoading()
            uni.showToast({ title: '头像包含违规内容', icon: 'none' })
            return
        }
        
        // 2. 上传图片
        uni.showLoading({ title: '上传中...' })
        const url = await uploadFile(filePath) // 上传原图或压缩图均可，这里传原图
        
        // 3. 更新用户信息
        updateUserInfo({ avatarUrl: url })
        
      } catch (e) {
        uni.hideLoading()
        console.error(e)
        if (e.message && e.message.includes('FUNCTION_NOT_FOUND')) {
             uni.showToast({ title: '请先部署云函数 checkContent', icon: 'none' })
        } else {
             uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
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
    success: async (res) => {
      if (res.confirm && res.content) {
        const newName = res.content.trim()
        
        // 长度限制
        if (newName.length < 2 || newName.length > 12) {
            uni.showToast({ title: '昵称长度需在 2-12 字之间', icon: 'none' })
            return
        }
        
        uni.showLoading({ title: '检测中...' })
        
        try {
            // 内容安全检测
            const checkRes = await wx.cloud.callFunction({
                name: 'checkContent',
                data: {
                    type: 'text',
                    content: newName
                }
            })
            
            if (checkRes.result.code !== 200) {
                uni.hideLoading()
                uni.showToast({ title: '昵称包含违规内容', icon: 'none' })
                return
            }
            
            // 更新
            updateUserInfo({ nickName: newName })
            
        } catch(e) {
            uni.hideLoading()
            uni.showToast({ title: '检测失败', icon: 'none' })
        }
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
