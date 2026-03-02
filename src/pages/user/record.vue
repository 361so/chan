<template>
  <view class="container">
    <!-- 积分卡片 -->
    <view class="points-card">
      <view class="points-bg">
        <view class="bg-pattern"></view>
      </view>
      <view class="points-content">
        <view class="points-label">我的积分</view>
        <view class="points-value">
          <text class="currency">💎</text>
          <text class="number">{{ formatPoints(userStore.points) }}</text>
        </view>
        <view class="points-desc">积分可用于兑换勋章</view>
      </view>
      <view class="shop-btn" @click="goToShop">
        <text>去兑换</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-bar">
      <view class="stat-item">
        <view class="stat-value">{{ recordList.length }}</view>
        <view class="stat-label">获取次数</view>
      </view>
      <view class="stat-line"></view>
      <view class="stat-item">
        <view class="stat-value">{{ totalPoints }}</view>
        <view class="stat-label">累计获得</view>
      </view>
      <view class="stat-line"></view>
      <view class="stat-item">
        <view class="stat-value">{{ weekPoints }}</view>
        <view class="stat-label">本周获得</view>
      </view>
    </view>

    <!-- 积分明细 -->
    <view class="section">
      <view class="section-title">
        <text class="title-dot"></text>
        <text class="title-text">积分明细</text>
      </view>

      <!-- 加载中 -->
      <view class="loading-box" v-if="loading">
        <view class="spinner"></view>
      </view>

      <!-- 列表 -->
      <view class="record-list" v-else-if="recordList.length > 0">
        <view 
          class="record-item" 
          v-for="(item, index) in recordList" 
          :key="index"
        >
          <view class="item-left">
            <view class="type-tag" :class="item.type">
              {{ getTypeLabel(item.type) }}
            </view>
            <view class="item-time">{{ formatDate(item.createTime) }}</view>
          </view>
          <view class="item-right">
            <text class="points add">+{{ item.awardedPoints || getTypePoints(item.type) }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-box" v-else>
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-img"></image>
        <text class="empty-text">还没有积分记录</text>
        <text class="empty-tip">上传城市美景或文明行为即可获得积分</text>
        <view class="action-btn" @click="goToReport">
          <text>立即上传</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { request } from '@/utils/request'

const userStore = useUserStore()
const recordList = ref([])
const loading = ref(false)

// 格式化积分
const formatPoints = (points) => {
  if (!points) return '0'
  if (points >= 10000) return (points / 10000).toFixed(1) + 'w'
  return points.toString()
}

// 累计获得
const totalPoints = computed(() => {
  return recordList.value.reduce((sum, item) => {
    return sum + (item.awardedPoints || getTypePoints(item.type))
  }, 0)
})

// 本周获得
const weekPoints = computed(() => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return recordList.value
    .filter(item => new Date(item.createTime) >= weekAgo)
    .reduce((sum, item) => sum + (item.awardedPoints || getTypePoints(item.type)), 0)
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  // 小于1小时
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return mins < 1 ? '刚刚' : `${mins}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getRecordList = async () => {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await request({
      url: '/system/report/list',
      method: 'GET',
      data: {
        openid: userStore.userInfo.openid,
        status: '1',
        pageNum: 1,
        pageSize: 50
      }
    })
    if (res.code === 200) {
      recordList.value = res.rows || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToShop = () => {
  uni.navigateTo({ url: '/pages/user/shop' })
}

const goToReport = () => {
  uni.switchTab({ url: '/pages/report/report' })
}

const getTypeLabel = (type) => {
  const map = {
    'beauty': '城市美景',
    'behavior': '文明行为',
    'public': '公益行动'
  }
  return map[type] || '其他'
}

const getTypePoints = (type) => {
  const map = {
    'beauty': 10,
    'behavior': 15,
    'public': 20
  }
  return map[type] || 10
}

onShow(() => {
  if (userStore.isLoggedIn) {
    getRecordList()
  }
})
</script>

<style lang="scss">
page {
  background: #f5f6fa;
}

.container {
  padding: 16px;
  padding-bottom: 30px;
}

// 积分卡片
.points-card {
  position: relative;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  border-radius: 20px;
  padding: 28px 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.25);
  
  .points-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    
    .bg-pattern {
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 40%);
    }
  }
  
  .points-content {
    position: relative;
    z-index: 1;
    padding-right: 100px;
    
    .points-label {
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      margin-bottom: 8px;
    }
    
    .points-value {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      
      .currency {
        font-size: 24px;
        margin-right: 6px;
      }
      
      .number {
        font-size: 44px;
        font-weight: 700;
        color: #fff;
        letter-spacing: -1px;
      }
    }
    
    .points-desc {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }
  }
  
  .shop-btn {
    position: absolute;
    right: 20px;
    top: 24px;
    background: rgba(255,255,255,0.95);
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #ff6b6b;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 2;
    
    &:active {
      transform: scale(0.95);
    }
    
    .arrow {
      font-size: 16px;
      opacity: 0.8;
    }
  }
}

// 统计栏
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  margin-top: 12px;
  padding: 20px 0;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  
  .stat-item {
    text-align: center;
    flex: 1;
    
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #333;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #999;
    }
  }
  
  .stat-line {
    width: 1px;
    height: 30px;
    background: #eee;
  }
}

// 明细区域
.section {
  margin-top: 20px;
  
  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;
    
    .title-dot {
      width: 4px;
      height: 16px;
      background: linear-gradient(180deg, #ff6b6b, #ff8e53);
      border-radius: 2px;
      margin-right: 8px;
    }
    
    .title-text {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
}

// 加载中
.loading-box {
  display: flex;
  justify-content: center;
  padding: 60px 0;
  
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #f0f0f0;
    border-top-color: #ff6b6b;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// 记录列表
.record-list {
  background: #fff;
  border-radius: 16px;
  padding: 0 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  
  .record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background: #fafafa;
    }
    
    .item-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .type-tag {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        
        &.beauty {
          background: #fff2e8;
          color: #fa8c16;
        }
        
        &.behavior {
          background: #e6f7ff;
          color: #1890ff;
        }
        
        &.public {
          background: #f6ffed;
          color: #52c41a;
        }
      }
      
      .item-time {
        font-size: 13px;
        color: #999;
      }
    }
    
    .item-right {
      .points {
        font-size: 18px;
        font-weight: 600;
        
        &.add {
          color: #ff6b6b;
        }
      }
    }
  }
}

// 空状态
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  
  .empty-img {
    width: 120px;
    height: 120px;
    opacity: 0.6;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 15px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .empty-tip {
    font-size: 13px;
    color: #999;
    margin-bottom: 24px;
  }
  
  .action-btn {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: #fff;
    padding: 12px 32px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(255,107,107,0.3);
    
    &:active {
      transform: scale(0.96);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
