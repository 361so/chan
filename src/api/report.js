import { request } from '@/utils/request'

// 查询上报列表
export function listReport(query) {
  return request({
    url: '/system/report/list',
    method: 'GET',
    data: query
  })
}

// 新增上报
export function addReport(data) {
  return request({
    url: '/system/report',
    method: 'POST',
    data: data
  })
}

// 获取上报详细
export function getReport(id) {
  return request({
    url: '/system/report/' + id,
    method: 'GET'
  })
}

// 修改上报
export function updateReport(data) {
  return request({
    url: '/system/report',
    method: 'PUT',
    data: data
  })
}

// 删除上报
export function delReport(id) {
  return request({
    url: '/system/report/' + id,
    method: 'DELETE'
  })
}
