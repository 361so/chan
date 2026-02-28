<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-section" @click="changeAvatar">
        <image 
          class="avatar" 
          :src="(userStore.userInfo && userStore.userInfo.avatarUrl) || '/static/images/icon.png'" 
          mode="aspectFill"
        />
        <view class="camera-icon" v-if="userStore.isLoggedIn">
          <view class="camera-inner"></view>
        </view>
      </view>
      
      <view class="info-section">
        <view v-if="userStore.isLoggedIn" class="name-wrap" @click="changeNickName">
          <text class="user-name">{{ (userStore.userInfo && userStore.userInfo.nickName) || '用户' }}</text>
          <view class="edit-dot"></view>
        </view>
        <view v-else class="login-text" @click="handleLogin">点击登录账号</view>
        
        <view v-if="userStore.isLoggedIn" class="points-tag">
          <text class="diamond-emoji">💎</text>
          <text class="points-num">{{ formatPoints(userStore.points || 0) }}</text>
        </view>
      </view>
    </view>

    <!-- 勋章展示 -->
    <view class="badge-section" v-if="userStore.isLoggedIn && userStore.userInfo && userStore.userInfo.badges && userStore.userInfo.badges.length > 0">
      <view class="section-header">
        <text class="section-title">我的勋章</text>
        <text class="section-count">{{ userStore.userInfo.badges.length }} 个</text>
      </view>
      <view class="badge-list">
        <view v-for="(badge, index) in userStore.userInfo.badges.slice(0, 6)" :key="badge" class="badge-item">
          <image :src="'/static/badges/' + badge + '.png'" mode="aspectFit" class="badge-img"></image>
        </view>
        <view v-if="userStore.userInfo.badges.length > 6" class="badge-more">
          <text>+{{ userStore.userInfo.badges.length - 6 }}</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-title">功能服务</view>
      
      <view class="menu-list">
        <view class="menu-item" @click="navigateTo('record')">
          <view class="icon-wrap icon-record">
            <view class="icon-chart"></view>
          </view>
          <text class="item-name">积分记录</text>
          <view class="arrow-right"></view>
        </view>
        
        <view class="menu-item" @click="navigateTo('shop')">
          <view class="icon-wrap icon-shop">
            <view class="icon-gift"></view>
          </view>
          <text class="item-name">积分兑换</text>
          <view class="arrow-right"></view>
        </view>
        
        <view class="menu-item" @click="navigateTo('history')">
          <view class="icon-wrap icon-history">
            <view class="icon-file"></view>
          </view>
          <text class="item-name">我的上报</text>
          <view class="arrow-right"></view>
        </view>
      </view>
    </view>

    <!-- 其他服务 -->
    <view class="menu-section">
      <view class="menu-title">其他</view>
      
      <view class="menu-list">
        <view class="menu-item" @click="navigateTo('/pages/user/about')">
          <view class="icon-wrap icon-about">
            <view class="icon-info"></view>
          </view>
          <text class="item-name">关于我们</text>
          <view class="arrow-right"></view>
        </view>
        
        <view class="menu-item" @click="navigateTo('/pages/user/privacy')">
          <view class="icon-wrap icon-privacy">
            <view class="icon-shield"></view>
          </view>
          <text class="item-name">隐私协议</text>
          <view class="arrow-right"></view>
        </view>
        
        <button class="menu-item share-btn" open-type="share">
          <view class="icon-wrap icon-share">
            <view class="icon-share-icon"></view>
          </view>
          <text class="item-name">分享给好友</text>
          <view class="arrow-right"></view>
        </button>
        
        <view class="menu-item" v-if="isAdmin" @click="navigateTo('admin')">
          <view class="icon-wrap icon-admin">
            <view class="icon-setting"></view>
          </view>
          <text class="item-name">管理后台</text>
          <view class="tag-admin">管理</view>
          <view class="arrow-right"></view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-wrap" v-if="userStore.isLoggedIn">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
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

const formatPoints = (points) => {
  if (!points) return '0'
  if (points >= 10000) return (points / 10000).toFixed(1) + 'w'
  return points.toString()
}

const isAdmin = computed(() => {
  return userStore.userInfo && userStore.userInfo.role === 'admin'
})

const handleLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmColor: '#ff6b6b',
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
        let checkPath = filePath
        const fs = uni.getFileSystemManager()
        const fileInfo = await new Promise((resolve, reject) => {
          fs.getFileInfo({ filePath: checkPath, success: resolve, fail: reject })
        })
        
        if (fileInfo.size > 1024 * 1024) {
          const compressRes = await new Promise((resolve, reject) => {
            uni.compressImage({ src: checkPath, quality: 60, success: resolve, fail: reject })
          })
          checkPath = compressRes.tempFilePath
        }
        
        const base64 = fs.readFileSync(checkPath, 'base64')
        
        const checkRes = await wx.cloud.callFunction({
          name: 'checkContent',
          data: { type: 'image', imageBase64: base64 }
        })
        
        if (checkRes.result.code !== 200) {
          uni.hideLoading()
          uni.showToast({ title: '头像包含违规内容', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '上传中...' })
        const url = await uploadFile(filePath)
        updateUserInfo({ avatarUrl: url })
        
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '操作失败', icon: 'none' })
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
        
        if (newName.length < 2 || newName.length > 12) {
          uni.showToast({ title: '昵称长度需在 2-12 字之间', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '检测中...' })
        
        try {
          const checkRes = await wx.cloud.callFunction({
            name: 'checkContent',
            data: { type: 'text', content: newName }
          })
          
          if (checkRes.result.code !== 200) {
            uni.hideLoading()
            uni.showToast({ title: '昵称包含违规内容', icon: 'none' })
            return
          }
          
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
    await request({ url: '/user/update', method: 'POST', data: data })
    userStore.updateProfile(data)
    uni.hideLoading()
    uni.showToast({ title: '更新成功' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const navigateTo = (path) => {
  if (path === 'record') path = '/pages/user/record'
  if (path === 'shop') path = '/pages/user/shop'
  if (path === 'history') path = '/pages/user/history'
  if (path === 'admin') path = '/pages/admin/audit'
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss">
page {
  background: #f8f9fa;
}

.container {
  padding: 16px;
  padding-bottom: 40px;
}

// 用户卡片
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 28px 24px;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
}

.avatar-section {
  position: relative;
  margin-right: 18px;
  z-index: 1;
  
  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #f0f0f0;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .camera-icon {
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    
    .camera-inner {
      width: 10px;
      height: 8px;
      border: 2px solid #667eea;
      border-radius: 2px;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: -3px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 2px;
        background: #667eea;
        border-radius: 1px;
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 3px;
        height: 3px;
        background: #667eea;
        border-radius: 50%;
      }
    }
  }
}

.info-section {
  flex: 1;
  z-index: 1;
  
  .name-wrap {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .user-name {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin-right: 8px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .edit-dot {
      width: 6px;
      height: 6px;
      background: #ffd700;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
    }
  }
  
  .login-text {
    font-size: 18px;
    color: #fff;
    font-weight: 600;
    padding: 4px 0;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  .points-tag {
    display: inline-flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 8px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .diamond-emoji {
      font-size: 14px;
      margin-right: 6px;
      line-height: 1;
    }
    
    .points-num {
      font-size: 15px;
      color: #fff;
      font-weight: 600;
      line-height: 1;
    }
  }
}

// 勋章区域
.badge-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }
  
  .section-count {
    font-size: 13px;
    color: #999;
  }
}

.badge-list {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .badge-item {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f8f9fa;
    padding: 3px;
    
    .badge-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
  }
  
  .badge-more {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    text {
      font-size: 12px;
      color: #999;
      font-weight: 500;
    }
  }
}

// 菜单区域
.menu-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px 0;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.menu-title {
  font-size: 13px;
  color: #999;
  padding: 0 20px 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 4px;
}

.menu-list {
  .menu-item {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    position: relative;
    
    &:active {
      background: #fafafa;
    }
    
    &.share-btn {
      background: transparent;
      margin: 0;
      padding: 14px 20px;
      width: 100%;
      box-sizing: border-box;
      border-radius: 0;
      line-height: normal;
      text-align: left;
      
      &::after {
        border: none;
      }
    }
  }
}

.icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  
  &.icon-record { background: #e6f7ff; }
  &.icon-shop { background: #f6ffed; }
  &.icon-history { background: #fff7e6; }
  &.icon-about { background: #f0f5ff; }
  &.icon-privacy { background: #f9f0ff; }
  &.icon-share { background: #fff0f6; }
  &.icon-admin { background: #fff2e8; }
}

// 图标用 CSS 绘制
.icon-chart {
  width: 16px;
  height: 14px;
  border-left: 2px solid #1890ff;
  border-bottom: 2px solid #1890ff;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 2px;
    width: 3px;
    height: 6px;
    background: #1890ff;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 8px;
    width: 3px;
    height: 10px;
    background: #1890ff;
  }
}

.icon-gift {
  width: 16px;
  height: 14px;
  border: 2px solid #52c41a;
  border-radius: 2px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 4px;
    border: 2px solid #52c41a;
    border-bottom: none;
    border-radius: 2px 2px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: calc(100% + 2px);
    background: #52c41a;
  }
}

.icon-file {
  width: 14px;
  height: 16px;
  border: 2px solid #fa8c16;
  border-radius: 2px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 5px;
    height: 5px;
    border-left: 2px solid #fa8c16;
    border-bottom: 2px solid #fa8c16;
  }
}

.icon-info {
  width: 16px;
  height: 16px;
  border: 2px solid #2f54eb;
  border-radius: 50%;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 2px;
    background: #2f54eb;
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 5px;
    background: #2f54eb;
  }
}

.icon-shield {
  width: 14px;
  height: 16px;
  border: 2px solid #722ed1;
  border-radius: 0 0 7px 7px;
  border-top: none;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -2px;
    right: -2px;
    height: 7px;
    border: 2px solid #722ed1;
    border-bottom: none;
    border-radius: 7px 7px 0 0;
  }
}

.icon-share-icon {
  width: 14px;
  height: 14px;
  border: 2px solid #eb2f96;
  border-radius: 50%;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: #eb2f96;
    border-radius: 50%;
  }
}

.icon-setting {
  width: 16px;
    height: 16px;
  border: 2px solid #fa541c;
  border-radius: 50%;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: #fa541c;
    border-radius: 50%;
  }
}

.item-name {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.tag-admin {
  font-size: 11px;
  color: #fff;
  background: #ff6b6b;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
}

.arrow-right {
  width: 8px;
  height: 8px;
  border-top: 2px solid #ccc;
  border-right: 2px solid #ccc;
  transform: rotate(45deg);
}

// 退出登录
.logout-wrap {
  margin-top: 24px;
}

.logout-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: #fff;
  border-radius: 12px;
  font-size: 15px;
  color: #ff6b6b;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  
  &:active {
    background: #fafafa;
  }
  
  &::after {
    border: none;
  }
}

</style>
