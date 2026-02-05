<template>
  <view class="container">
    <view class="logo-container">
      <image src="/static/logo.png" class="logo"></image>
      <view class="app-name">铲泡屎</view>
      <view class="version">Version {{version || '1.0.0'}}</view>
    </view>
    
    <view class="content">
      <view class="section">
        <view class="title">项目介绍</view>
        <view class="text">
          “铲泡屎”是一款致力于改善城市环境的公益小程序。我们鼓励用户发现并上报城市中的宠物粪便、垃圾等不文明现象。通过用户的共同参与，我们希望能够建立一个更加清洁、文明的城市环境。
        </view>
      </view>
      
      <view class="section">
        <view class="title">联系我们</view>
        <!-- <view class="cell">
          <text class="label">官方网站</text>
          <text class="value">www.chanpaoshi.com</text>
        </view> -->
        <view class="cell">
          <text class="label">客服邮箱</text>
          <text class="value">myw3c@qq.com</text>
        </view>
      </view>
    </view>
    
    <view class="footer">
      <text>Copyright © 2026 铲泡屎 All Rights Reserved</text>
      <text>idea团队: web前端学习营地</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const accountInfo = uni.getAccountInfoSync();
const version = computed(() => {
  return accountInfo.miniProgram.version
})
</script>

<style lang="scss">
.container {
  padding: 20px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  
  .logo {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    margin-bottom: 15px;
  }
  
  .app-name {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  
  .version {
    font-size: 14px;
    color: #999;
  }
}

.content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  
  .section {
    margin-bottom: 25px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 4px solid $uni-color-primary;
    }
    
    .text {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      text-indent: 2em;
    }
    
    .cell {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
      font-size: 14px;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        color: #666;
      }
      
      .value {
        color: #333;
      }
    }
  }
}

.footer {
  text-align: center;
  font-size: 12px;
  color: #ccc;
  padding: 20px 0;
  text{
    margin: 10px auto;
    display: block;
  }
}
</style>
