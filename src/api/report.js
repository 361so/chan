import { request } from '@/utils/request'

export function listReport(query) {
  return request({
    url: '/system/report/list',
    method: 'GET',
    params: query
  })
}

export function addReport(data) {
  return request({
    url: '/system/report',
    method: 'POST',
    data: data
  })
}

export function likeReport(data) {
  return request({
    url: '/system/report/like',
    method: 'POST',
    data: data
  })
}

export function getReportDetail(id) {
  return request({
    url: '/system/report/detail/' + id,
    method: 'GET'
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
