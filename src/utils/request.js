// api.js
// export const baseURL = 'http://39.108.87.172/prod-api'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    // Show loading
    if (!options.hideLoading) {
      uni.showLoading({ title: '加载中...' })
    }

    wx.cloud.callFunction({
      name: 'api',
      data: {
        url: options.url,
        method: options.method || 'GET',
        data: options.data || {},
        token: uni.getStorageSync('token') // Pass token if needed
      },
      success: (res) => {
        if (!options.hideLoading) {
          uni.hideLoading()
        }
        // Cloud function should return { code: 200, ... }
        if (res.result && res.result.code === 200) {
          resolve(res.result)
        } else {
          // Handle specific errors if needed
          reject(res.result || res)
        }
      },
      fail: (err) => {
        if (!options.hideLoading) {
          uni.hideLoading()
        }
        console.error('Cloud function call failed', err)
        reject(err)
      }
    })
  })
}

export const uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const ext = filePath.match(/\.[^.]+?$/)?.[0] || '.jpg';
    const cloudPath = 'uploads/' + Date.now() + '-' + Math.random().toString(36).slice(-6) + ext;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        // Get temp file URL for immediate display/use
        wx.cloud.getTempFileURL({
          fileList: [res.fileID],
          success: tempRes => {
            if (tempRes.fileList && tempRes.fileList[0].tempFileURL) {
               resolve(tempRes.fileList[0].tempFileURL)
            } else {
               resolve(res.fileID) // Fallback to fileID
            }
          },
          fail: () => {
             resolve(res.fileID)
          }
        })
      },
      fail: (err) => {
        console.error('Cloud upload failed', err)
        reject(err)
      }
    })
  })
}
