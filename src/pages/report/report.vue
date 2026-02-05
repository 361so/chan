<template>
  <view class="container">
    <view class="location-card card">
      <view class="title">当前位置</view>
      <view class="address" @click="refreshLocation">
        <text class="uni-icon uni-icon-location"></text>
        {{ locationStore.address }}
      </view>
      <button size="mini" type="default" @click="refreshLocation">刷新定位</button>
    </view>

    <view class="type-card card">
      <view class="title">举报类型</view>
      <radio-group @change="handleTypeChange" class="type-group">
        <label class="type-item" v-for="(item, index) in reportTypes" :key="index">
          <radio :value="item.value" :checked="item.value === reportType" color="#007aff" />
          <text>{{ item.label }}</text>
        </label>
      </radio-group>
    </view>

    <view class="upload-card card">
      <view class="title">上传证据 (照片或视频，至少1个)</view>
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

    <button class="submit-btn btn-primary" :loading="submitting" @click="submitReport">立即上报</button>
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
const reportType = ref('env') // 默认环境卫生

const reportTypes = [
  { label: '环境卫生', value: 'env' },
  { label: '交通秩序', value: 'traffic' },
  { label: '公共设施', value: 'facility' }
]

onMounted(() => {
  locationStore.updateLocation()
})

const refreshLocation = () => {
  locationStore.updateLocation()
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
      uni.showToast({ title: '上报成功，等待审核', icon: 'success' })
      mediaList.value = []
      description.value = ''
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.showToast({ title: res.msg || '上报失败', icon: 'none' })
    }
  } catch (e) {
    console.error('Report failed', e)
    uni.showToast({ title: '上报失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
.location-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .address {
    font-size: 14px;
    color: #666;
    flex: 1;
    margin-right: 10px;
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
