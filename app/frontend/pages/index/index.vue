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
    ></map>

    <view class="action-area">
      <view class="location-info" v-if="locationStore.address">
        <text class="uni-icon uni-icon-location"></text>
        当前位置: {{ locationStore.address }}
      </view>
      <button class="scoop-btn" hover-class="btn-hover" @click="goToReport">
        <text class="btn-text">铲泡屎</text>
        <text class="btn-sub">发现便便 立即上报</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLocationStore } from '@/store/modules/location'
import { listReport } from '@/api/report'

const locationStore = useLocationStore()

// Markers data
const markers = ref([])

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
    const res = await listReport()
    if (res.code === 200) {
      markers.value = res.rows.map(item => ({
        id: item.id,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        title: item.status === '1' ? '已清理' : '待清理',
        // title: '一坨便便',
        iconPath: item.status === '1' ? '/static/tabbar/report_active.png' : '/static/tabbar/report.png',
        // iconPath: '/static/tabbar/report_active.png',
        width: 30,
        height: 30
      }))
    }
  } catch (e) {
    console.error('Fetch markers failed:', e)
  }
}

const goToReport = () => {
  uni.navigateTo({
    url: '/pages/report/report'
  })
}
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
</style>
