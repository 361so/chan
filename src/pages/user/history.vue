<template>
  <view class="container">
    <view class="list-container">
      <view class="list" v-if="historyList.length > 0">
        <view class="item" v-for="(item, index) in historyList" :key="index" @click="showDetail(item)">
          <view class="row-1">
            <view class="desc">{{ item.description || '无描述' }}</view>
            <view class="status" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status) }}
            </view>
          </view>
          <view class="row-2">
            <view class="time">{{ formatDate(item.createTime) }}</view>
          </view>
          <view class="row-3" v-if="item.images">
            <scroll-view scroll-x="true" class="img-scroll">
              <view class="img-list">
                <image 
                  v-for="(img, i) in item.images.split(',')" 
                  :key="i" 
                  :src="img" 
                  mode="aspectFill" 
                  class="thumb"
                  @click.stop="previewImage(item.images.split(','), i)"
                ></image>
              </view>
            </scroll-view>
          </view>
          <view class="row-4" v-if="item.remark && item.status == '2'">
            <text class="remark">驳回原因: {{ item.remark }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>
        <image src="/static/images/empty.png" mode="aspectFit"></image>
        <text>暂无上报记录</text>
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
const historyList = ref([])

const getHistoryList = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const res = await request({
      url: '/system/report/list',
      method: 'GET',
      data: {
        openid: userStore.userInfo.openid, // 确保查自己的
        pageNum: 1,
        pageSize: 50,
        orderByColumn: 'createTime',
        isAsc: 'desc'
      }
    })
    if (res.code === 200) {
      historyList.value = res.rows
    }
  } catch (e) {
    console.error(e)
  } finally {
    uni.hideLoading()
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

const previewImage = (urls, current) => {
  uni.previewImage({
    urls,
    current
  })
}

const showDetail = (item) => {
  if (item.status === '2' && item.remark) {
    uni.showModal({
      title: '驳回详情',
      content: '驳回原因：' + item.remark,
      showCancel: false
    })
  } else {
    // 可以添加查看通过详情或其他逻辑
    const statusText = getStatusText(item.status)
    uni.showToast({
      title: '当前状态：' + statusText,
      icon: 'none'
    })
  }
}

onShow(() => {
  if (userStore.isLoggedIn) {
    getHistoryList()
  }
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-top: 10px;
}

.list-container {
  padding: 0 15px;
  
  .list {
    .item {
      background: #fff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      
      .row-1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .desc {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 10px;
        }
        
        .status {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          
          &.pending {
            background-color: #e6f7ff;
            color: #1890ff;
          }
          &.success {
            background-color: #f6ffed;
            color: #52c41a;
          }
          &.reject {
            background-color: #fff1f0;
            color: #f5222d;
          }
        }
      }
      
      .row-2 {
        margin-bottom: 10px;
        .time {
          font-size: 12px;
          color: #999;
        }
      }
      
      .row-3 {
        .img-scroll {
          width: 100%;
          white-space: nowrap;
          
          .img-list {
            display: flex;
            
            .thumb {
              width: 80px;
              height: 80px;
              border-radius: 4px;
              margin-right: 10px;
              flex-shrink: 0;
            }
          }
        }
      }
      
      .row-4 {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #f5f5f5;
        
        .remark {
          font-size: 12px;
          color: #f5222d;
        }
      }
    }
  }
  
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 50px;
    
    image {
      width: 120px;
      height: 120px;
      margin-bottom: 15px;
    }
    
    text {
      color: #999;
      font-size: 14px;
    }
  }
}
</style>
