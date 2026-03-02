<template>
  <view class="container">
    <view class="detail-card">
      <view class="user-info">
        <image class="avatar" :src="detail.avatarUrl || '/static/images/icon.png'" mode="aspectFill"></image>
        <view class="info">
          <text class="name">{{ detail.nickName || '微信用户' }}</text>
          <text class="time">{{ formatDate(detail.createTime) }}</text>
        </view>
        <view class="tag" :class="detail.type">{{ getTypeLabel(detail.type) }}</view>
      </view>

      <view class="content">
        <text class="desc">{{ detail.description || '发现一处文明微光...' }}</text>
      </view>

      <view class="media-area" v-if="getMediaList(detail).length > 0">
        <swiper class="media-swiper" indicator-dots autoplay :interval="5000" :duration="500">
          <swiper-item v-for="(media, i) in getMediaList(detail)" :key="i">
            <image 
              v-if="media.type === 'image'"
              :src="media.url" 
              mode="aspectFill" 
              class="media-img"
              @click="previewImage(detail, i)"
            ></image>
            <video 
              v-else
              :src="media.url"
              class="media-img"
              controls
            ></video>
          </swiper-item>
        </swiper>
      </view>

      <!-- 地图展示位置 -->
      <view class="map-container" v-if="detail.latitude && detail.longitude">
        <map 
          class="map"
          :latitude="detail.latitude" 
          :longitude="detail.longitude"
          :markers="markers"
          :scale="16"
          :enable-scroll="false"
          :enable-zoom="false"
          @tap="openLocation"
        ></map>
        <view class="address-bar" @tap="openLocation">
          <text class="uni-icon uni-icon-location"></text>
          {{ detail.address }}
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="action-btn share" open-type="share">
        <text class="action-icon">⤴</text> 转发
      </button>
      <view class="action-btn like" @click="handleLike" :class="{ liked: isLiked }">
        <text class="action-icon">{{ isLiked ? '♥' : '♡' }}</text> {{ likeCount }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { likeReport } from '@/api/report'
import { useUserStore } from '@/store/modules/user'

const detail = ref({})
const isLiked = ref(false)
const likeCount = ref(0)
const markers = ref([])
const shareImageUrl = ref('') // 用于存储预下载的本地分享图路径
const userStore = useUserStore()

const getMediaList = (item) => {
  if (item.media && Array.isArray(item.media)) {
    return item.media
  }
  if (item.images) {
    return item.images.split(',').map(url => ({ type: 'image', url }))
  }
  return []
}

onLoad(async (options) => {
  if (options.id) {
    await getDetail(options.id)
  }
})

const getDetail = async (id) => {
  try {
    uni.showLoading({ title: '加载中' })
    // 调用云函数新增的详情接口
    const res = await request({
      url: '/system/report/detail/' + id,
      method: 'GET'
    })
    
    if (res.code === 200) {
      detail.value = res.data
      likeCount.value = detail.value.likes || 0
      isLiked.value = detail.value.isLiked || false
      
      if (detail.value.latitude && detail.value.longitude) {
        markers.value = [{
          id: 1,
          latitude: detail.value.latitude,
          longitude: detail.value.longitude,
          iconPath: '/static/tabbar/report_active.png',
          width: 30,
          height: 30
        }]
      }
      
      // 预下载分享图片
      preloadShareImage()
    } else {
        uni.showToast({ title: res.msg || '未找到该信息', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const preloadShareImage = () => {
  const mediaList = getMediaList(detail.value)
  if (mediaList.length > 0 && mediaList[0].url && mediaList[0].type === 'image') {
    const url = mediaList[0].url
    // 如果是网络图片，尝试下载
    if (url.startsWith('http')) {
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            shareImageUrl.value = res.tempFilePath
            console.log('Share image preloaded:', res.tempFilePath)
          }
        },
        fail: (err) => {
          console.error('Preload share image failed:', err)
          // 下载失败则回退到使用网络URL
          shareImageUrl.value = url
        }
      })
    } else {
      shareImageUrl.value = url
    }
  } else {
    shareImageUrl.value = '/static/logo.png'
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  try {
    const res = await likeReport({
      id: detail.value._id,
      isLike: !isLiked.value
    })
    
    if (res.code === 200) {
      isLiked.value = !isLiked.value
      likeCount.value = isLiked.value ? likeCount.value + 1 : likeCount.value - 1
      uni.showToast({ title: isLiked.value ? '点赞成功' : '取消点赞', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const openLocation = () => {
  uni.openLocation({
    latitude: parseFloat(detail.value.latitude),
    longitude: parseFloat(detail.value.longitude),
    name: detail.value.address,
    address: detail.value.address
  })
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

const getTypeLabel = (type) => {
  const map = {
    'beauty': '城市美景',
    'behavior': '文明行为',
    'public': '公益行动'
  }
  return map[type] || '其他'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onShareAppMessage((res) => {
  console.log('Preparing share content...')
  
  // 获取第一张图片作为分享图
  const mediaList = getMediaList(detail.value)
  let imageUrl = ''
  
  // 优先使用预下载的本地图片路径（如果是本地临时文件）
  // 或者使用 mediaList 中的网络URL
  if (shareImageUrl.value) {
    imageUrl = shareImageUrl.value
  } else if (mediaList.length > 0 && mediaList[0].url) {
    imageUrl = mediaList[0].url
  }
  
  console.log('Original Image URL:', imageUrl)
  
  // 生成分享标题
  let title = '城市微光 - 发现身边的美好'
  if (detail.value.description) {
    const desc = detail.value.description.substring(0, 30)
    title = `${desc}${detail.value.description.length > 30 ? '...' : ''}`
  }

  console.log('Share Title:', title)
  console.log('Share Image URL:', imageUrl || '/static/logo.png')

  return {
    title: title,
    path: `/pages/feed/detail?id=${detail.value._id}`,
    imageUrl: imageUrl || '/static/logo.png'
  }
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #fff;
  padding:0 0 60px 0;
}

.detail-card {
  padding: 20px;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    
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
      &.beauty {background: #fff2e8;color: #fa8c16;}
      &.behavior {background: #e6f7ff;color: #1890ff;}
      &.public {background: #f6ffed;color: #52c41a;}
    }
  }
  
  .content {
    margin-bottom: 15px;
    .desc {
      font-size: 16px;
      color: #333;
      line-height: 1.6;
    }
  }
  
  .media-area {
    margin-bottom: 20px;
    .media-swiper {
      width: 100%;
      height: 300px;
      
      .media-img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: #f0f0f0;
      }
    }
  }
  
  .map-container {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 20px;
    border: 1px solid #eee;
    
    .map {
      width: 100%;
      height: 200px;
    }
    
    .address-bar {
      padding: 10px;
      background: #f8f8f8;
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      
      .uni-icon {
        margin-right: 5px;
        color: $uni-color-primary;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: #fff;
  display: flex;
  border-top: 1px solid #eee;
  z-index: 100;
  
  .action-btn {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #666;
    background: transparent;
    border: none;
    border-radius: 0;
    
    &:after {
      border: none;
    }
    
    .action-icon {
      margin-right: 5px;
      font-size: 18px;
    }
    
    &.share {
      border-right: 1px solid #eee;
    }
    
    &.liked {
      color: $uni-color-primary;
    }
  }
}
</style>