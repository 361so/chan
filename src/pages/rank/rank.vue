<template>
  <view class="container">
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'week' }" 
        @click="changeTab('week')"
      >周榜</view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'month' }" 
        @click="changeTab('month')"
      >月榜</view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'total' }" 
        @click="changeTab('total')"
      >总榜</view>
    </view>

    <view class="rank-list card">
      <view class="rank-header">
        <text class="col-rank">排名</text>
        <text class="col-user">用户</text>
        <text class="col-score">积分</text>
      </view>
      <view class="rank-item" v-for="(item, index) in rankList" :key="index">
        <text class="col-rank">
          <text v-if="index < 3" class="badge" :class="'top-' + (index + 1)">{{ index + 1 }}</text>
          <text v-else>{{ index + 1 }}</text>
        </text>
        <view class="col-user user-info">
          <image :src="item.avatar" class="avatar"></image>
          <text class="name">{{ item.name }}</text>
        </view>
        <text class="col-score">{{ item.score }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getRankList } from '../../api/rank'

const currentTab = ref('week')

const rankList = ref([])

const loadRankList = async () => {
  try {
    const res = await getRankList(currentTab.value)
    if (res.code === 200) {
      rankList.value = res.rows.map(item => ({
        name: item.nickName || '未命名',
        score: item.points || 0,
        avatar: item.avatarUrl || '/static/images/icon.png'
      }))
    }
  } catch (e) {
    console.error(e)
  }
}

const changeTab = (tab) => {
  currentTab.value = tab
  loadRankList()
}

onShow(() => {
  loadRankList()
})
</script>

<style lang="scss">
.tabs {
  display: flex;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    color: #666;
    &.active {
      color: $uni-color-primary;
      font-weight: bold;
      border-bottom: 2px solid $uni-color-primary;
    }
  }
}

.rank-list {
  padding: 0;
  
  .rank-header, .rank-item {
    display: flex;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #eee;
  }
  
  .rank-header {
    background: #f9f9f9;
    font-weight: bold;
    color: #999;
    font-size: 12px;
  }
  
  .col-rank { width: 15%; text-align: center; }
  .col-user { flex: 1; padding-left: 10px; }
  .col-score { width: 20%; text-align: right; color: $uni-color-warning; font-weight: bold; }
  
  .user-info {
    display: flex;
    align-items: center;
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-right: 8px;
    }
  }
  
  .badge {
    display: inline-block;
    width: 20px;
    height: 20px;
    line-height: 20px;
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
    
    &.top-1 { background-color: #ffd700; }
    &.top-2 { background-color: #c0c0c0; }
    &.top-3 { background-color: #cd7f32; }
  }
}
</style>
