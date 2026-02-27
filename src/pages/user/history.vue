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
          <view class="row-3" v-if="getMediaList(item).length > 0">
            <scroll-view scroll-x="true" class="img-scroll">
              <view class="img-list">
                <block v-for="(media, i) in getMediaList(item)" :key="i">
                  <image 
                    v-if="media.type === 'image'"
                    :src="media.url" 
                    mode="aspectFill" 
                    class="thumb"
                    @click.stop="previewImage(item, i)"
                  ></image>
                  <video 
                    v-else
                    :src="media.url"
                    class="thumb"
                    @click.stop
                  ></video>
                </block>
              </view>
            </scroll-view>
          </view>
          <view class="row-4">
            <text class="remark" v-if="item.remark && item.status == '2'">驳回原因: {{ item.remark }}</text>
            <view class="actions" v-if="item.status === '0'">
              <button size="mini" type="warn" class="btn-delete" @click.stop="handleDelete(item)">删除</button>
            </view>
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

const showDetail = (item) => {
  if (item.status === '2' && item.remark) {
    uni.showModal({
      title: '驳回详情',
      content: '驳回原因：' + item.remark,
      showCancel: false
    })
  }
}

const handleDelete = (item) => {
  uni.showModal({
    title: '删除确认',
    content: '确定要删除这条待审核记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中' })
          const delRes = await request({
            url: '/system/report/delete',
            method: 'POST',
            data: {
              id: item._id
            }
          })
          
          if (delRes.code === 200) {
            userStore.decrementReportCount() // Update local store
            uni.showToast({ title: '删除成功' })
            getHistoryList() // 刷新列表
          } else {
            uni.showToast({ title: delRes.msg || '删除失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '删除异常', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
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
  padding: 0;
  
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 20px;
        
        .remark {
          font-size: 12px;
          color: #f5222d;
          flex: 1;
        }
        
        .actions {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            
            .btn-delete {
                margin: 0;
                font-size: 12px;
                padding: 0 15px;
                line-height: 2;
                background-color: #ff4d4f;
                color: #fff;
            }
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
