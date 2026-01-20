<template>
  <view class="container login-page">
    <view class="logo-box">
      <image src="/static/logo.png" mode="widthFix" class="logo"></image>
      <text class="title">注册账号</text>
    </view>

    <view class="login-type-box form-box">
      <view class="input-group">
        <input class="input" type="text" v-model="form.username" placeholder="请输入账号" />
      </view>
      <view class="input-group">
        <input class="input" type="password" v-model="form.password" placeholder="请输入密码" />
      </view>
      <view class="input-group">
        <input class="input" type="password" v-model="form.confirmPassword" placeholder="请再次输入密码" />
      </view>
      <view class="input-group captcha-group">
        <input class="input" type="text" v-model="form.code" placeholder="请输入验证码" />
        <image :src="captchaUrl" class="captcha-img" @click="getCaptcha" mode="widthFix"></image>
      </view>
      <button type="primary" class="login-btn" @click="handleRegister">注册</button>
      <view class="register-link" @click="goLogin">已有账号？去登录</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { request } from '@/utils/request'

const captchaUrl = ref('')
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: ''
})

onMounted(() => {
  getCaptcha()
})

const getCaptcha = async () => {
  try {
    const res = await request({ url: '/captchaImage', method: 'GET' })
    if (res.code === 200) {
      captchaUrl.value = 'data:image/gif;base64,' + res.img
      form.uuid = res.uuid
    }
  } catch (e) {
    console.error(e)
  }
}

const handleRegister = async () => {
  if (!form.username || !form.password || !form.confirmPassword || !form.code) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  
  if (form.password !== form.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '注册中...' })
    const res = await request({
      url: '/register',
      method: 'POST',
      data: {
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        code: form.code,
        uuid: form.uuid
      }
    })
    
    uni.hideLoading()
    
    if (res.code === 200) {
      uni.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.msg, icon: 'none' })
      getCaptcha()
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: typeof e === 'string' ? e : '注册失败', icon: 'none' })
    getCaptcha()
  }
}

const goLogin = () => {
  uni.navigateBack()
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

.register-link {
  font-size: 14px;
  color: $uni-color-primary;
  margin-top: 15px;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  border-radius: 40px;
  height: 45px;
  line-height: 45px;
  font-size: 16px;
}
</style>