<template>
  <view class="container">
    <view class="user-card">
      <view class="avatar-container" @click="!userStore.isLoggedIn && handleLogin()">
        <image 
          class="avatar" 
          :src="(userStore.userInfo && userStore.userInfo.avatarUrl) || '/static/images/icon.png'" 
          mode="aspectFill"
        />
      </view>
      <view class="info">
        <view v-if="userStore.isLoggedIn" class="name">{{ (userStore.userInfo && userStore.userInfo.nickName) || '铲屎官' }}</view>
        <view v-else class="name" @click="handleLogin">点击登录</view>
        <view v-if="userStore.isLoggedIn" class="points">积分：{{ userStore.points || 0 }}</view>
      </view>
    </view>

    <view class="stats-card card" v-if="userStore.isLoggedIn">
      <view class="stat-item">
        <view class="num">{{ userStore.points }}</view>
        <view class="label">当前积分</view>
      </view>
      <view class="stat-item">
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
    </view>
    
    <button v-if="userStore.isLoggedIn" class="logout-btn" @click="handleLogout">退出登录</button>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

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
  uni.chooseImage({
    count: 1,
    success: (res) => {
      // Mock upload and update
      userStore.updateProfile({ avatarUrl: res.tempFilePaths[0] })
    }
  })
}

const navigateTo = (path) => {
  if (path === 'shop') {
     uni.showToast({ title: '功能开发中...', icon: 'none' })
     return
  }
  
  if (path === 'record') {
    path = '/pages/user/record'
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
}

.logout-btn {
  margin-top: 20px;
  background: #fff;
  color: $uni-color-error;
}
</style>
