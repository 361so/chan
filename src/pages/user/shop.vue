<template>
  <view class="container">
    <!-- 积分头部 -->
    <view class="header">
      <view class="points-card">
        <view class="points-bg">
          <view class="circle circle-1"></view>
          <view class="circle circle-2"></view>
        </view>
        <view class="points-content">
          <view class="points-icon">
            <text class="icon">💎</text>
          </view>
          <view class="points-info">
            <text class="label">我的积分</text>
            <text class="num">{{ formatPoints((userStore.userInfo && userStore.userInfo.points) || 0) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 勋章兑换区 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title">
          <text class="title-icon">🏆</text>
          <text class="title-text">勋章兑换</text>
        </view>
        <text class="section-desc">兑换勋章，展示个性</text>
      </view>
      
      <view class="product-grid">
        <view 
          class="product-card" 
          v-for="(item, index) in productList" 
          :key="index"
          :class="{ owned: isOwned(item.id), disabled: !canRedeem(item) }"
        >
          <!-- 已拥有角标 -->
          <view class="owned-badge" v-if="isOwned(item.id)">
            <text class="owned-text">已拥有</text>
          </view>
          
          <!-- 勋章图标 -->
          <view class="badge-box">
            <image 
              :src="item.image || '/static/badges/' + item.id + '.png'" 
              class="badge-img"
              mode="aspectFit"
            ></image>
            <view class="shine"></view>
          </view>
          
          <!-- 勋章信息 -->
          <view class="product-info">
            <text class="name">{{ item.name }}</text>
            <text class="desc">{{ item.description }}</text>
          </view>
          
          <!-- 价格和按钮 -->
          <view class="product-footer">
            <view class="price-box">
              <text class="price-icon">💎</text>
              <text class="price-num">{{ item.price }}</text>
            </view>
            <button 
              class="redeem-btn"
              :class="{ 
                'btn-owned': isOwned(item.id), 
                'btn-can': canRedeem(item),
                'btn-cant': !canRedeem(item) && !isOwned(item.id)
              }"
              :disabled="isOwned(item.id) || !canRedeem(item)"
              @click="handleRedeem(item)"
            >
              {{ getBtnText(item) }}
            </button>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="productList.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无商品</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { request } from '@/utils/request'

const userStore = useUserStore()
const productList = ref([])

// 格式化积分，超过10000显示为1w+
const formatPoints = (points) => {
  if (points >= 10000) {
    return (points / 10000).toFixed(1) + 'w'
  }
  return points
}

// 获取渐变色
const getGradient = (color) => {
  if (!color) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
}

// 判断是否可兑换
const canRedeem = (item) => {
  if (!userStore.isLoggedIn) return false
  const points = (userStore.userInfo && userStore.userInfo.points) || 0
  return points >= item.price
}

// 获取按钮文字
const getBtnText = (item) => {
  if (isOwned(item.id)) return '已拥有'
  if (!userStore.isLoggedIn) return '去登录'
  const points = (userStore.userInfo && userStore.userInfo.points) || 0
  if (points < item.price) return '积分不足'
  return '立即兑换'
}

const getProductList = async () => {
  try {
    const res = await request({
      url: '/shop/list',
      method: 'GET'
    })
    if (res.code === 200) {
      productList.value = res.rows
    }
  } catch (e) {
    console.error(e)
  }
}

const isOwned = (productId) => {
  const badges = (userStore.userInfo && userStore.userInfo.badges) || []
  return badges.includes(productId)
}

const handleRedeem = (item) => {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  
  if (isOwned(item.id)) return
  
  const points = (userStore.userInfo && userStore.userInfo.points) || 0
  if (points < item.price) {
    uni.showToast({ title: '积分不足', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '兑换确认',
    content: `确定消耗 ${item.price} 积分兑换「${item.name}」吗？`,
    confirmColor: '#ff6b6b',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '兑换中...' })
        try {
          const redeemRes = await request({
            url: '/shop/redeem',
            method: 'POST',
            data: { productId: item.id }
          })
          
          if (redeemRes.code === 200) {
            uni.showToast({ title: '兑换成功', icon: 'success' })
            userStore.getUserInfo()
          } else {
            uni.showToast({ title: redeemRes.msg || '兑换失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '兑换异常', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

onShow(() => {
  getProductList()
  if (userStore.isLoggedIn) {
    userStore.getUserInfo()
  }
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff5f5 0%, #f8f8f8 30%, #f8f8f8 100%);
  padding-bottom: 30px;
}

// 积分头部
.header {
  padding: 20px;
  
  .points-card {
    position: relative;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa5a5 100%);
    border-radius: 20px;
    padding: 25px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
    
    .points-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      
      .circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        
        &.circle-1 {
          width: 150px;
          height: 150px;
          top: -50px;
          right: -30px;
        }
        
        &.circle-2 {
          width: 80px;
          height: 80px;
          bottom: -20px;
          left: 20px;
        }
      }
    }
    
    .points-content {
      position: relative;
      display: flex;
      align-items: center;
      z-index: 1;
      
      .points-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        backdrop-filter: blur(10px);
        
        .icon {
          font-size: 32px;
        }
      }
      
      .points-info {
        .label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          display: block;
          margin-bottom: 5px;
        }
        
        .num {
          font-size: 36px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}

// 区域标题
.section {
  padding: 0 15px;
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 0 5px;
    
    .section-title {
      display: flex;
      align-items: center;
      
      .title-icon {
        font-size: 20px;
        margin-right: 8px;
      }
      
      .title-text {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
    }
    
    .section-desc {
      font-size: 12px;
      color: #999;
    }
  }
}

// 商品网格
.product-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -6px;
}

.product-card {
  position: relative;
  width: calc(50% - 12px);
  margin: 6px;
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.owned {
    .badge-box {
      opacity: 0.7;
    }
  }
  
  &.disabled:not(.owned) {
    .badge-box {
      filter: grayscale(0.5);
    }
  }
  
  // 已拥有角标
  .owned-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(135deg, #52c41a, #73d13d);
    border-radius: 0 16px 0 12px;
    padding: 4px 10px;
    
    .owned-text {
      font-size: 10px;
      color: #fff;
      font-weight: bold;
    }
  }
  
  // 勋章图标
  .badge-box {
    position: relative;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    flex-shrink: 0;
    overflow: hidden;
    
    .badge-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }
    
    .shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 40%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 60%
      );
      animation: shine 2.5s infinite;
      pointer-events: none;
    }
  }
  
  // 商品信息
  .product-info {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
    overflow: hidden;
    
    .name {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .desc {
      font-size: 11px;
      color: #999;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  // 底部价格和按钮
  .product-footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .price-box {
      display: flex;
      align-items: center;
      
      .price-icon {
        font-size: 12px;
        margin-right: 2px;
      }
      
      .price-num {
        font-size: 16px;
        font-weight: bold;
        color: #ff6b6b;
      }
    }
    
    .redeem-btn {
      margin: 0;
      padding: 0 10px;
      min-width: 60px;
      height: 28px;
      line-height: 28px;
      font-size: 11px;
      border-radius: 14px;
      border: none;
      font-weight: 500;
      transition: all 0.3s;
      white-space: nowrap;
      
      &::after {
        border: none;
      }
      
      &.btn-owned {
        background: #f0f0f0;
        color: #999;
      }
      
      &.btn-can {
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: #fff;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        
        &:active {
          transform: scale(0.95);
          box-shadow: 0 2px 6px rgba(255, 107, 107, 0.2);
        }
      }
      
      &.btn-cant {
        background: #f5f5f5;
        color: #bbb;
      }
    }
  }
}

// 闪光动画
@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  
  .empty-icon {
    font-size: 60px;
    margin-bottom: 10px;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 14px;
    color: #999;
  }
}


</style>