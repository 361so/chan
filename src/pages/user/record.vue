<template>
  <view class="container">
    <view class="header">
      <view class="total-score">
        <text class="num">{{ userStore.points }}</text>
        <text class="label">当前积分</text>
      </view>
    </view>
    
    <view class="list-container">
      <view class="list-title">积分明细</view>
      <view class="list" v-if="recordList.length > 0">
        <view class="item" v-for="(item, index) in recordList" :key="index">
          <view class="left">
            <view class="type">{{ item.description || '上报获得' }}</view>
            <view class="time">{{ formatDate(item.createTime) }}</view>
          </view>
          <view class="right">
            <text class="score add" v-if="item.status === '1'">+10</text>
            <text class="score pending" v-else-if="item.status === '2'">已驳回</text>
            <text class="score pending" v-else>审核中</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>
        <image src="/static/images/empty.png" mode="aspectFit"></image>
        <text>暂无积分记录</text>
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
const recordList = ref([])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getRecordList = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    // 获取全部记录，不筛选 status
    const res = await request({
      url: '/system/report/list',
      method: 'GET',
      data: {
        openid: userStore.userInfo.openid, // 显式传递 openid 确保查自己的
        pageNum: 1,
        pageSize: 20
      }
    })
    if (res.code === 200) {
      recordList.value = res.rows
    }
  } catch (e) {
    console.error(e)
  } finally {
    uni.hideLoading()
  }
}

onShow(() => {
  if (userStore.isLoggedIn) {
    getRecordList()
  }
})
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.header {
  background: linear-gradient(to right, $uni-color-primary, $uni-color-success);
  padding: 30px 20px;
  color: #fff;
  
  .total-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .num {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .label {
      font-size: 14px;
      opacity: 0.9;
    }
  }
}

.list-container {
  margin-top: -20px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  min-height: calc(100vh - 150px);
  
  .list-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid $uni-color-primary;
  }
  
  .list {
    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .left {
        .type {
          font-size: 15px;
          color: #333;
          margin-bottom: 5px;
        }
        .time {
          font-size: 12px;
          color: #999;
        }
      }
      
      .right {
        .score {
          font-size: 18px;
          font-weight: bold;
          
          &.add {
            color: $uni-color-warning;
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
