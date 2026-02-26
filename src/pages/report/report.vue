<template>
  <view class="container">
    <view class="location-card card">
      <view class="header-row">
        <view class="title">当前位置</view>
        <button size="mini" type="default" @click="chooseLocation">选择位置</button>
      </view>
      <view class="address" @click="chooseLocation">
        <text class="uni-icon uni-icon-location"></text>
        {{ locationStore.address || '点击选择位置' }}
      </view>
    </view>

    <view class="type-card card">
      <view class="title">打卡类型</view>
      <radio-group @change="handleTypeChange" class="type-group">
        <label class="type-item" v-for="(item, index) in reportTypes" :key="index">
          <radio :value="item.value" :checked="item.value === reportType" color="#007aff" />
          <text>{{ item.label }}</text>
        </label>
      </radio-group>
    </view>

    <view class="upload-card card">
      <view class="title">上传照片 (至少1张)</view>
      <view class="media-list">
        <view class="media-item" v-for="(item, index) in mediaList" :key="index">
          <image v-if="item.type === 'image'" :src="item.path" mode="aspectFill" @click="previewMedia(index)"></image>
          <video v-else :src="item.path" class="video-preview"></video>
          <view class="delete" @click="deleteMedia(index)">x</view>
        </view>
        <view class="add-btn" v-if="mediaList.length < 3" @click="chooseMedia">
          <text>+</text>
        </view>
      </view>
    </view>

    <view class="desc-card card">
      <view class="title">描述说明</view>
      <textarea v-model="description" placeholder="请输入描述信息..." class="desc-input" />
    </view>

    <button class="submit-btn btn-primary" :loading="submitting" @click="submitReport">立即打卡</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLocationStore } from '@/store/modules/location'
import { useUserStore } from '@/store/modules/user'
import { addReport } from '@/api/report'
import { uploadFile } from '@/utils/request'

const locationStore = useLocationStore()
const userStore = useUserStore()

const mediaList = ref([]) // { type: 'image' | 'video', path: '' }
const description = ref('')
const submitting = ref(false)
const reportType = ref('beauty') // 默认社区美景

const reportTypes = [
  { label: '社区美景', value: 'beauty' },
  { label: '文明行为', value: 'behavior' },
  { label: '公益行动', value: 'public' }
]

onMounted(() => {
  locationStore.updateLocation()
})

const refreshLocation = () => {
  locationStore.updateLocation()
}

const chooseLocation = () => {
  uni.chooseLocation({
    success: (res) => {
      // 更新 store 中的位置信息
      locationStore.setAddress(res.address + (res.name ? ` (${res.name})` : ''))
      locationStore.setLatitude(res.latitude)
      locationStore.setLongitude(res.longitude)
    },
    fail: (err) => {
      console.error('选择位置失败', err)
      // 如果选择失败，尝试自动定位
      if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
         locationStore.updateLocation()
      }
    }
  })
}

const handleTypeChange = (e) => {
  reportType.value = e.detail.value
}

const chooseMedia = () => {
  uni.chooseMedia({
    count: 3 - mediaList.value.length,
    mediaType: ['image', 'video'],
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    camera: 'back',
    success: (res) => {
      const newFiles = res.tempFiles.map(file => ({
        type: file.fileType || (file.tempFilePath.endsWith('.mp4') ? 'video' : 'image'), // simple check
        path: file.tempFilePath
      }))
      mediaList.value = [...mediaList.value, ...newFiles]
    }
  })
}

const deleteMedia = (index) => {
  mediaList.value.splice(index, 1)
}

const previewMedia = (index) => {
  const item = mediaList.value[index]
  if (item.type === 'image') {
    const images = mediaList.value.filter(m => m.type === 'image').map(m => m.path)
    uni.previewImage({
      urls: images,
      current: item.path
    })
  }
}

const submitReport = async () => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/user/user' }), 1500)
    return
  }
  
  if (mediaList.value.length < 1) {
    uni.showToast({ title: '请上传至少1个证据(照片或视频)', icon: 'none' })
    return
  }
  
  submitting.value = true
  
  try {
    // 1. Upload media
    const uploadedFiles = []
    for (const item of mediaList.value) {
      try {
        const url = await uploadFile(item.path)
        uploadedFiles.push({
          type: item.type,
          url: url
        })
      } catch (e) {
        console.error('Upload failed', e)
        uni.showToast({ title: '文件上传失败', icon: 'none' })
        submitting.value = false
        return
      }
    }

    // 2. Submit report
    const reportData = {
      description: description.value,
      media: uploadedFiles, // Store as array of objects
      images: uploadedFiles.filter(f => f.type === 'image').map(f => f.url).join(','), // Backwards compatibility
      type: reportType.value,
      latitude: locationStore.latitude,
      longitude: locationStore.longitude,
      address: locationStore.address,
      status: '0' // 0=Pending, 1=Approved, 2=Rejected
    }

    const res = await addReport(reportData)
    if (res.code === 200) {
      uni.showToast({ title: '打卡成功，等待审核', icon: 'success' })
      mediaList.value = []
      description.value = ''
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.showToast({ title: res.msg || '打卡失败', icon: 'none' })
    }
  } catch (e) {
    console.error('Report failed', e)
    uni.showToast({ title: '打卡失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
.location-card {
  display: flex;
  flex-direction: column;
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
    }
    
    button {
      margin: 0; // Remove default margin
    }
  }

  .address {
    font-size: 14px;
    color: #333;
    background: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    
    .uni-icon {
      margin-right: 5px;
      color: #007aff;
    }
  }
}

.type-card {
  .type-group {
    display: flex;
    flex-wrap: wrap;
    .type-item {
      margin-right: 20px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      font-size: 14px;
    }
  }
}

.media-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
  
  .media-item {
    width: 30%;
    height: 80px;
    margin-right: 3%;
    margin-bottom: 10px;
    position: relative;
    
    image, .video-preview {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      background: #000;
    }
    
    .delete {
      position: absolute;
      top: -5px;
      right: -5px;
      background: red;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      text-align: center;
      line-height: 18px;
      font-size: 12px;
      z-index: 10;
    }
  }
  
  .add-btn {
    width: 30%;
    height: 80px;
    border: 1px dashed #ccc;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    color: #ccc;
    border-radius: 4px;
  }
}

.desc-input {
  width: 100%;
  height: 80px;
  font-size: 14px;
  margin-top: 10px;
  border: 1px solid #eee;
  padding: 5px;
  border-radius: 4px;
}

.submit-btn {
  margin-top: 30px;
}
</style>