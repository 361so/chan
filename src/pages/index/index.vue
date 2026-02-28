<template>
  <view class="container map-page">
    <map 
      id="map" 
      class="map-view"
      :latitude="locationStore.latitude" 
      :longitude="locationStore.longitude"
      :markers="markers"
      :scale="16"
      show-location
      @markertap="handleMarkerTap"
    >
      <cover-view class="reset-location" @click="resetLocation">
        <cover-image class="icon" src="/static/images/dingwei.png"></cover-image>
      </cover-view>
    </map>
    
    <!-- 详情弹窗 - 放在map外面避免被cover-view遮挡 -->
    <view class="marker-popup" v-if="currentMarker" @click.stop>
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">{{ getTypeLabel(currentMarker.type) }}</text>
          <text class="close-btn" @click="closePopup">×</text>
        </view>
        <swiper class="popup-swiper" v-if="getMediaList(currentMarker).length > 0" indicator-dots>
          <swiper-item v-for="(media, i) in getMediaList(currentMarker)" :key="i">
            <image 
              v-if="media.type === 'image'"
              :src="media.url" 
              mode="aspectFill" 
              class="popup-img"
              @click="previewPopupImage(currentMarker, i)"
            ></image>
            <video 
              v-else
              :src="media.url"
              class="popup-img"
            ></video>
          </swiper-item>
        </swiper>
        <view class="popup-desc">{{ currentMarker.description || '无描述' }}</view>
        <view class="popup-footer">
          <text class="popup-time">{{ formatDate(currentMarker.createTime) }}</text>
          <text class="popup-status" :class="getStatusClass(currentMarker.status)">{{ getStatusText(currentMarker.status) }}</text>
        </view>
      </view>
    </view>

    <view class="action-area">
      <view class="location-info" v-if="locationStore.address">
        <text class="uni-icon uni-icon-location"></text>
        当前位置: {{ locationStore.address }}
      </view>
      <button class="scoop-btn" hover-class="btn-hover" @click="goToReport">
        <text class="btn-text">随手拍</text>
        <text class="btn-sub">发现美好 立即打卡</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useLocationStore } from '@/store/modules/location'
import { listReport } from '@/api/report'

const locationStore = useLocationStore()

// Markers data
const markers = ref([])
const currentMarker = ref(null)

onMounted(async () => {
  try {
    await locationStore.updateLocation()
    fetchMarkers()
  } catch (e) {
    console.error('Location error:', e)
  }
})

const fetchMarkers = async () => {
  try {
    // 仅获取审核通过的数据 (status=1)
    const res = await listReport({ status: '1' })
    if (res.code === 200) {
      markers.value = res.rows
        .map(item => {
          // Cloud DB returns _id, convert to number id if possible or use a hash
          // Map component requires number for id
          // Simple hash from string id
          let numId = 0;
          if (item._id) {
             for (let i = 0; i < item._id.length; i++) {
               numId = ((numId << 5) - numId) + item._id.charCodeAt(i);
               numId |= 0; // Convert to 32bit integer
             }
          }
          
          return {
            id: Math.abs(numId), // Ensure positive ID
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            iconPath: item.status === '1' ? '/static/tabbar/report_active.png' : '/static/tabbar/report.png',
            width: 30,
            height: 30,
            // Store original item data for popup
            originalData: item
          }
        })
        .filter(marker => {
          // Filter out invalid coordinates
          return !isNaN(marker.latitude) && 
                 !isNaN(marker.longitude) && 
                 marker.latitude >= -90 && marker.latitude <= 90 &&
                 marker.longitude >= -180 && marker.longitude <= 180;
        });
    }
  } catch (e) {
    console.error('Fetch markers failed:', e)
  }
}

const handleMarkerTap = (e) => {
  const markerId = e.detail.markerId
  const marker = markers.value.find(m => m.id === markerId)
  if (marker) {
    currentMarker.value = marker.originalData
  }
}

const closePopup = () => {
  currentMarker.value = null
}

const getTypeLabel = (type) => {
  const map = {
    'beauty': '城市美景',
    'behavior': '文明行为',
    'public': '公益行动'
  }
  return map[type] || '其他'
}

const getStatusText = (status) => {
  const map = {
    '0': '待审核',
    '1': '已通过',
    '2': '已驳回'
  }
  return map[status] || '未知'
}

const getStatusClass = (status) => {
  const map = {
    '0': 'pending',
    '1': 'success',
    '2': 'reject'
  }
  return map[status] || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
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

const previewPopupImage = (item, current) => {
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

const goToReport = () => {
  uni.navigateTo({
    url: '/pages/report/report'
  })
}

const resetLocation = () => {
  const mapCtx = uni.createMapContext('map')
  mapCtx.moveToLocation()
  locationStore.updateLocation()
}

onShareAppMessage((res) => {
  return {
    title: '城市微光 - 记录城市温度，让美好被看见',
    path: '/pages/index/index',
    imageUrl: '/static/logo.png'
  }
})

onShareTimeline((res) => {
  return {
    title: '城市微光 - 记录城市温度，让美好被看见',
    query: ''
  }
})
</script>

<style lang="scss">
.map-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  // #ifdef H5
  height: calc(100vh - 50px); // Subtract tabbar height for H5 if needed, or just 100vh
  // #endif
  padding: 0; // Override default container padding
  overflow: hidden;
}

.map-view {
  flex: 1;
  width: 100%;
  position: relative;
}

.reset-location {
  position: absolute;
  bottom: 40px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;

  .icon {
    width: 28px;
    height: 28px;
  }
}

.action-area {
  background: #fff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  padding-bottom: 40px;
  // #ifdef H5
  padding-bottom: 80px; // Extra padding for H5 tabbar overlap
  // #endif
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  position: relative;
  z-index: 10;
  margin-top: -20px; // Overlap map slightly
}

.location-info {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  
  text {
    margin-right: 5px;
  }
}

.scoop-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, $uni-color-primary, $uni-color-success);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 5px 15px rgba(60, 197, 31, 0.4);
  border: 5px solid rgba(255,255,255,0.3);
  
  &.btn-hover {
    transform: scale(0.95);
    opacity: 0.9;
  }
  
  .btn-text {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .btn-sub {
    font-size: 12px;
    opacity: 0.9;
  }
}

.marker-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  
  .popup-content {
    width: 80%;
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .popup-title {
        font-weight: bold;
        font-size: 16px;
      }
      
      .close-btn {
        font-size: 24px;
        color: #999;
        line-height: 1;
        padding: 0 5px;
      }
    }
    
    .popup-swiper {
      width: 100%;
      height: 200px;
      margin-bottom: 10px;
      
      .popup-img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: #f0f0f0;
      }
    }
    
    .popup-desc {
      font-size: 14px;
      color: #333;
      margin-bottom: 10px;
      line-height: 1.5;
      max-height: 60px;
      overflow-y: auto;
    }
    
    .popup-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      border-top: 1px solid #eee;
      padding-top: 10px;
      
      .popup-time {
        color: #999;
      }
      
      .popup-status {
        font-weight: bold;
        &.pending { color: #ff9800; }
        &.success { color: #4caf50; }
        &.reject { color: #f44336; }
      }
    }
  }
}
</style>
