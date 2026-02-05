<template>
  <view class="container">
    <view class="list" v-if="list.length > 0">
      <view class="item" v-for="(item, index) in list" :key="index">
        <view class="header-row">
          <view class="type-tag" :class="item.type">{{ getTypeLabel(item.type) }}</view>
          <view class="status-tag" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</view>
        </view>
        
        <view class="row-1">
          <view class="desc">{{ item.description || '无描述' }}</view>
          <view class="time">{{ formatDate(item.createTime) }}</view>
        </view>
        
        <view class="row-2">
          <scroll-view scroll-x="true" class="img-scroll">
            <view class="img-list">
              <block v-for="(media, i) in getMediaList(item)" :key="i">
                <image 
                  v-if="media.type === 'image'"
                  :src="media.url" 
                  mode="aspectFill" 
                  class="thumb"
                  @click="previewMedia(item, i)"
                ></image>
                <video 
                  v-else
                  :src="media.url"
                  class="thumb"
                  @click="previewMedia(item, i)"
                ></video>
              </block>
            </view>
          </scroll-view>
        </view>
        
        <view class="row-3">
          <view class="location">
            <text class="uni-icon uni-icon-location"></text>
            {{ item.address || '未知地点' }}
          </view>
        </view>
        
        <view class="audit-info" v-if="item.status !== '0'">
          <text>审核人: 管理员</text>
          <text v-if="item.auditTime">时间: {{ formatDate(item.auditTime) }}</text>
          <text v-if="item.remark">备注: {{ item.remark }}</text>
        </view>

        <view class="actions" v-if="item.status === '0'">
          <button size="mini" type="warn" class="btn reject" @click="handleAudit(item, '2')">驳回</button>
          <button size="mini" type="primary" class="btn approve" @click="handleAudit(item, '1')">通过(+{{ getTypePoints(item.type) }}分)</button>
        </view>
      </view>
    </view>
    <view class="empty" v-else>
      <text>暂无记录</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const list = ref([])

const getList = async () => {
  try {
    uni.showLoading({ title: '加载中' })
    const res = await request({
      url: '/admin/report/list',
      method: 'GET'
    })
    if (res.code === 200) {
      list.value = res.rows
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '获取列表失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const getTypeLabel = (type) => {
  const map = {
    'env': '环境卫生',
    'traffic': '交通秩序',
    'facility': '公共设施'
  }
  return map[type] || '其他'
}

const getTypePoints = (type) => {
  const map = {
    'env': 10,
    'traffic': 15,
    'facility': 20
  }
  return map[type] || 10
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

const handleAudit = (item, status) => {
  const points = getTypePoints(item.type)
  let content = status === '1' ? `确认审核通过并奖励用户 ${points} 积分？` : '确认驳回该上报？'
  let placeholder = status === '2' ? '请输入驳回理由' : '请输入备注(可选)'
  
  uni.showModal({
    title: '审核确认',
    content: content,
    editable: true,
    placeholderText: placeholder,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '提交中' })
          const auditRes = await request({
            url: '/admin/report/audit',
            method: 'POST',
            data: {
              id: item._id, // Cloud DB use _id
              status: status,
              remark: res.content || '',
              points: status === '1' ? points : 0
            }
          })
          
          uni.hideLoading()
          if (auditRes.code === 200) {
            uni.showToast({ title: '操作成功' })
            getList() // Refresh list
          } else {
            uni.showToast({ title: auditRes.msg || '操作失败', icon: 'none' })
          }
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '操作异常', icon: 'none' })
        }
      }
    }
  })
}

const previewMedia = (item, current) => {
  const mediaList = getMediaList(item)
  const media = mediaList[current]
  
  if (media.type === 'image') {
    const urls = mediaList.filter(m => m.type === 'image').map(m => m.url)
    uni.previewImage({
      urls,
      current: media.url
    })
  }
  // Video is handled by video component click (play)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

onShow(() => {
  getList()
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 10px;
}

.item {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  
  .header-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
    
    .type-tag {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e0e0e0;
      color: #666;
      
      &.env { background: #e1f5fe; color: #0288d1; }
      &.traffic { background: #fff3e0; color: #f57c00; }
      &.facility { background: #f3e5f5; color: #7b1fa2; }
    }
    
    .status-tag {
      font-size: 12px;
      font-weight: bold;
      
      &.pending { color: #ff9800; }
      &.success { color: #4caf50; }
      &.reject { color: #f44336; }
    }
  }
  
  .row-1 {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    
    .desc {
      font-weight: bold;
      font-size: 16px;
      flex: 1;
    }
    .time {
      font-size: 12px;
      color: #999;
      margin-left: 10px;
    }
  }
  
  .row-2 {
    margin-bottom: 10px;
    .img-scroll {
      white-space: nowrap;
      .img-list {
        display: flex;
        .thumb {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          margin-right: 8px;
          background: #000;
        }
      }
    }
  }
  
  .row-3 {
    margin-bottom: 15px;
    .location {
      font-size: 12px;
      color: #666;
    }
  }
  
  .audit-info {
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #666;
    display: flex;
    flex-direction: column;
    
    text {
      margin-bottom: 4px;
    }
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #eee;
    padding-top: 10px;
    
    .btn {
      margin-left: 10px;
      margin-right: 0;
    }
  }
}

.empty {
  text-align: center;
  margin-top: 50px;
  color: #999;
}
</style>