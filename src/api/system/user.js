import { request } from '@/utils/request'

// 获取用户个人信息
export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'GET'
  })
}
