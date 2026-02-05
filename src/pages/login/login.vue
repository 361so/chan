<template>
  <view class="container login-page">
    <view class="logo-box">
      <image src="/static/logo.png" mode="widthFix" class="logo"></image>
      <!-- <text class="title">铲泡屎</text> -->
    </view>
    <view class="login-type-box">
      <button type="primary" class="login-btn" @click="doWechatLogin">微信一键登录</button>
    </view>
    
    <button type="default" class="cancel-btn" @click="goBack">暂不登录</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const doWechatLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' })
    await userStore.login()
    uni.hideLoading()
    uni.showToast({ title: '登录成功' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    uni.hideLoading()
    console.error(e)
    uni.showToast({ title: '登录失败: ' + (e.message || e), icon: 'none' })
  }
}

const goBack = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss">
.login-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 0 40px;
}

.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  
  .logo {
    width: 80px;
    height: 80px;
    margin-bottom: 10px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    color: $uni-color-primary;
  }
}

.login-type-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.form-box {
  .input-group {
    width: 100%;
    margin-bottom: 15px;
    
    .input {
      width: 100%;
      height: 45px;
      background: #f5f5f5;
      border-radius: 45px;
      padding: 0 20px;
      box-sizing: border-box;
      font-size: 14px;
    }
  }
  
  .captcha-group {
    display: flex;
    align-items: center;
    
    .input {
      flex: 1;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    .captcha-img {
      width: 100px;
      height: 45px;
      border-top-right-radius: 45px;
      border-bottom-right-radius: 45px;
    }
  }
}

.switch-type {
  font-size: 14px;
  color: $uni-color-primary;
  margin-top: 15px;
  text-decoration: underline;
}

.register-link {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.login-btn {
  width: 100%;
  border-radius: 40px;
  height: 45px;
  line-height: 45px;
  font-size: 16px;
}

.cancel-btn {
  width: 100%;
  border-radius: 40px;
  background: transparent;
  border: 1px solid #ccc;
  color: #999;
  height: 45px;
  line-height: 45px;
  font-size: 16px;
}
</style>
