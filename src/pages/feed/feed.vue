<template>
  <view class="container">
    <!-- 头部背景 -->
    <view class="header-bg">
      <view class="bg-circle c1"></view>
      <view class="bg-circle c2"></view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-wrap">
      <view class="tab-bar">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'new' }" 
          @click="switchTab('new')"
        >
          <text class="tab-name">最新</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'hot' }" 
          @click="switchTab('hot')"
        >
          <text class="tab-name">热门</text>
        </view>
        <view class="tab-slider" :style="{ left: currentTab === 'new' ? '25%' : '75%' }"></view>
      </view>
    </view>

    <!-- 内容列表 -->
    <view class="content-section">
      <!-- 加载中 -->
      <view class="loading-box" v-if="loading && list.length === 0">
        <view class="spinner"></view>
      </view>

      <!-- 空状态 -->
      <view class="empty-box" v-else-if="list.length === 0">
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-img"></image>
        <text class="empty-text">暂无内容</text>
        <text class="empty-tip">成为第一个分享的人吧</text>
      </view>

      <!-- 列表 -->
      <view class="feed-list" v-else>
        <view 
          class="feed-card" 
          v-for="(item, index) in list" 
          :key="index" 
          @click="goToDetail(item)"
        >
          <!-- 用户信息 -->
          <view class="card-header">
            <image class="avatar" :src="item.avatarUrl || '/static/images/icon.png'" mode="aspectFill"></image>
            <view class="user-meta">
              <text class="user-name">{{ item.nickName || '微信用户' }}</text>
              <text class="post-time">{{ formatDate(item.createTime) }}</text>
            </view>
            <view class="type-tag" :class="item.type">{{ getTypeLabel(item.type) }}</view>
          </view>

          <!-- 内容描述 -->
          <view class="card-content" v-if="item.description">
            <text class="desc-text">{{ item.description }}</text>
          </view>

          <!-- 图片/视频 -->
          <view class="media-wrap" v-if="getMediaList(item).length > 0">
            <scroll-view scroll-x class="media-scroll" @click.stop>
              <view class="media-list">
                <view 
                  class="media-item" 
                  v-for="(media, i) in getMediaList(item)" 
                  :key="i"
                  @click="previewImage(item, i)"
                >
                  <image 
                    v-if="media.type === 'image'"
                    :src="media.url" 
                    mode="aspectFill" 
                    class="media-img"
                  ></image>
                  <video 
                    v-else
                    :src="media.url"
                    class="media-video"
                    :controls="false"
                    object-fit="cover"
                  ></video>
                  <!-- 视频播放图标 -->
                  <view class="play-icon" v-if="media.type === 'video'">
                    <view class="play-triangle"></view>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>


        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="list.length > 0">
          <text v-if="loading">加载中...</text>
          <text v-else-if="list.length >= total">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const currentTab = ref('new')
const list = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const switchTab = (tab) => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  pageNum.value = 1
  list.value = []
  getList()
}

const getList = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    const res = await request({
      url: '/system/report/list',
      method: 'GET',
      data: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        status: '1',
        orderByColumn: currentTab.value === 'new' ? 'createTime' : 'likes',
        isAsc: 'desc'
      }
    })
    
    if (res.code === 200) {
      if (pageNum.value === 1) {
        list.value = res.rows
      } else {
        list.value = [...list.value, ...res.rows]
      }
      total.value = res.total
      
      list.value.forEach(item => {
        if (item.likes === undefined) item.likes = Math.floor(Math.random() * 20)
        if (item.isLiked === undefined) item.isLiked = false
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const getTypeLabel = (type) => {
  const map = {
    'beauty': '城市美景',
    'behavior': '文明行为',
    'public': '公益行动'
  }
  return map[type] || '其他'
}

const getMediaList = (item) => {
  if (item.media && Array.isArray(item.media)) {
    return item.media
  }
  if (item.images) {
    return item.images.split(',').map(url => ({ type: 'image', url }))
  }
  return []
}

const previewImage = (item, current) => {
  const mediaList = getMediaList(item)
  const media = mediaList[current]
  if (media.type === 'image') {
    const urls = mediaList.filter(m => m.type === 'image').map(m => m.url)
    uni.previewImage({
      urls,
      current: media.url
    })
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/feed/detail?id=${item._id || item.id}`
  })
}

onShow(() => {
  if (list.value.length === 0) {
    getList()
  }
})

onPullDownRefresh(() => {
  pageNum.value = 1
  getList()
})

onReachBottom(() => {
  if (list.value.length < total.value) {
    pageNum.value++
    getList()
  }
})

onShareAppMessage((res) => {
  if (res.from === 'button') {
    const item = res.target.dataset.item
    return {
      title: item.description || `我发现了一个${getTypeLabel(item.type)}，快来看看！`,
      path: '/pages/feed/feed',
      imageUrl: getMediaList(item)[0]?.url || '/static/logo.png'
    }
  }
  return {
    title: '城市微光 - 发现身边的美好',
    path: '/pages/feed/feed'
  }
})

onShareTimeline(() => {
  return {
    title: '城市微光 - 发现身边的美好',
    query: ''
  }
})
</script>

<style lang="scss">
page {
  background: #f5f6fa;
}

.container {
  min-height: 100vh;
}

// 头部背景
.header-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
  
  .bg-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    
    &.c1 {
      width: 180px;
      height: 180px;
      top: -60px;
      right: -60px;
    }
    
    &.c2 {
      width: 100px;
      height: 100px;
      bottom: 20px;
      left: -30px;
    }
  }
}

// Tab 切换
.tab-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 5px;
}

.tab-bar {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 3px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    border-radius: 8px;
    position: relative;
    z-index: 1;
    transition: all 0.3s;
    
    &.active {
      .tab-name {
        color: #667eea;
        font-weight: 600;
      }
    }
    
    .tab-name {
      font-size: 15px;
      color: #999;
      transition: all 0.3s;
    }
  }
  
  .tab-slider {
    position: absolute;
    top: 3px;
    bottom: 3px;
    width: 45%;
    background: #f0f5ff;
    border-radius: 8px;
    transform: translateX(-50%);
    transition: left 0.3s ease;
  }
}

// 内容区域
.content-section {
  position: relative;
  z-index: 1;
  padding: 0 5px 20px;
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
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// 空状态
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  
  .empty-img {
    width: 120px;
    height: 120px;
    opacity: 0.5;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 16px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .empty-tip {
    font-size: 13px;
    color: #999;
  }
}

// 列表
.feed-list {
  .feed-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    
    &:active {
      background: #fafafa;
    }
  }
}

// 卡片头部
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    background: #f0f0f0;
  }
  
  .user-meta {
    flex: 1;
    
    .user-name {
      font-size: 15px;
      font-weight: 500;
      color: #333;
      display: block;
    }
    
    .post-time {
      font-size: 12px;
      color: #999;
      display: block;
      margin-top: 2px;
    }
  }
  
  .type-tag {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 12px;
    font-weight: 500;
    
    &.beauty {background: #fff2e8;color: #fa8c16;}
    &.behavior {background: #e6f7ff;color: #1890ff;}
    &.public {background: #f6ffed;color: #52c41a;}
  }
}

// 卡片内容
.card-content {
  margin-bottom: 12px;
  
  .desc-text {
    font-size: 14px;
    color: #333;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// 媒体区域
.media-wrap {
  margin-bottom: 12px;
  margin-left: -16px;
  margin-right: -16px;
  
  .media-scroll {
    white-space: nowrap;
    
    .media-list {
      display: flex;
      padding: 0 16px;
    }
    
    .media-item {
      position: relative;
      flex-shrink: 0;
      margin-right: 8px;
      border-radius: 8px;
      overflow: hidden;
      
      &:last-child {
        margin-right: 0;
      }
      
      .media-img, .media-video {
        width: 160px;
        height: 120px;
        background: #f0f0f0;
      }
      
      .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .play-triangle {
          width: 0;
          height: 0;
          border-left: 12px solid #fff;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          margin-left: 3px;
        }
      }
    }
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: #999;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
