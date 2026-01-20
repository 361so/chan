// api.js
export const baseURL = 'http://39.108.87.172/prod-api'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    // Handle H5 proxy
    let url = options.url
    // #ifdef H5
    if (url.startsWith('/prod-api')) {
       url = url.replace('/prod-api', '')
    }
    // #endif
    
    // If url is not absolute, prepend baseURL
    if (!url.startsWith('http')) {
      url = baseURL + url
    }

    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Authorization': uni.getStorageSync('token') ? 'Bearer ' + uni.getStorageSync('token') : '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export const uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: baseURL + '/common/upload',
      filePath: filePath,
      name: 'file',
      header: {
        Authorization: 'Bearer ' + uni.getStorageSync('token')
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          resolve(data.url)
        } else {
          reject(data.msg)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
