import { request } from '@/utils/request'

// 获取积分排行榜
export function getRankList(type) {
  return request({
    url: '/system/user/rank/' + type,
    method: 'GET'
  })
}
