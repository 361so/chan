<template>
  <view class="container">
    <view class="tabs">
      <view class="tab-item" :class="{ active: currentTab === 'new' }" @click="switchTab('new')">最新</view>
      <view class="tab-item" :class="{ active: currentTab === 'hot' }" @click="switchTab('hot')">热门</view>
    </view>

    <view class="feed-list">
      <view class="feed-item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
        <view class="user-info">
          <image class="avatar" :src="item.avatarUrl || '/static/images/icon.png'" mode="aspectFill"></image>
          <view class="info">
            <text class="name">{{ item.nickName || '微信用户' }}</text>
            <text class="time">{{ formatDate(item.createTime) }}</text>
          </view>
          <view class="tag" :class="item.type">{{ getTypeLabel(item.type) }}</view>
        </view>

        <view class="content">
          <text class="desc">{{ item.description || '发现一处文明微光...' }}</text>
        </view>

        <view class="media-area" v-if="getMediaList(item).length > 0">
          <scroll-view scroll-x class="media-scroll" @click.stop>
            <view class="media-container">
              <block v-for="(media, i) in getMediaList(item)" :key="i">
                <image 
                  v-if="media.type === 'image'"
                  :src="media.url" 
                  mode="aspectFill" 
                  class="media-img"
                  @click="previewImage(item, i)"
                ></image>
                <video 
                  v-else
                  :src="media.url"
                  class="media-img"
                ></video>
              </block>
            </view>
          </scroll-view>
        </view>
      </view>
      
      <view class="empty" v-if="list.length === 0 && !loading">
        <text>暂无内容</text>
      </view>
      
      <view class="loading" v-if="loading">加载中...</view>
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
      url: '/system/report/list', // 使用公共查询接口
      method: 'GET',
      data: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        status: '1', // 只显示审核通过的
        orderByColumn: currentTab.value === 'new' ? 'createTime' : 'likes', // 假设后端支持按点赞排序
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
      
      // 模拟点赞数据 (因为后端可能没存)
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
    'beauty': '社区美景',
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

const handleLike = (item) => {
  // 列表页不再处理点赞
}

const goToDetail = (item) => {
  console.log('Clicked item:', item)
  uni.navigateTo({
    url: `/pages/feed/detail?id=${item._id}`
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
.container {
  min-height: 100vh;
  padding: 0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #eee;
  width: 100%; // Ensure full width
  
  .tab-item {
    flex: 1;
    text-align: center;
    font-size: 16px;
    color: #666;
    position: relative;
    padding-bottom: 5px;
    
    &.active {
      color: $uni-color-primary;
      font-weight: bold;
      
      &:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 3px;
        background: $uni-color-primary;
        border-radius: 2px;
      }
    }
  }
}

.feed-list {
  padding: 20px;
  
  .feed-item {
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
    
    .user-info {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 10px;
      }
      
      .info {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }
        
        .time {
          font-size: 12px;
          color: #999;
        }
      }
      
      .tag {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 10px;
        
        &.beauty { background: #e1f5fe; color: #0288d1; }
        &.behavior { background: #fff3e0; color: #f57c00; }
        &.public { background: #f3e5f5; color: #7b1fa2; }
      }
    }
    
    .content {
      margin-bottom: 10px;
      .desc {
        font-size: 15px;
        color: #333;
        line-height: 1.5;
      }
    }
    
    .media-area {
      margin-bottom: 10px;
      
      .media-scroll {
        white-space: nowrap;
        width: 100%;
        
        .media-container {
          display: flex;
          
          .media-img {
            width: 200px;
            height: 150px;
            border-radius: 8px;
            margin-right: 10px;
            background: #f0f0f0;
            flex-shrink: 0;
            
            &:last-child {
              margin-right: 0;
            }
          }
        }
      }
    }
    
    .location {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      
      .uni-icon {
        margin-right: 4px;
      }
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f5f5f5;
      padding-top: 10px;
      
      .action-btn {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #666;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        line-height: 1.5;
        
        &:after {
          border: none;
        }
        
        .uni-icon {
          margin-right: 5px;
          font-size: 18px;
        }
        
        &.liked {
          color: $uni-color-primary;
        }
      }
    }
  }
}

.empty, .loading {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>