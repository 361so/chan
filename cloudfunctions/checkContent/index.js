const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { type, content } = event
  
  try {
    if (type === 'text') {
      // 文本内容安全
      const result = await cloud.openapi.security.msgSecCheck({
        content: content
      })
      
      if (result.errCode === 0) {
        return { code: 200, msg: 'ok' }
      } else if (result.errCode === 87014) {
        return { code: 87014, msg: '内容包含违规信息' }
      } else {
        return { code: 500, msg: '检测失败', err: result }
      }
    } else if (type === 'image') {
      // 图片内容安全 (适配 Base64 方式)
      // 期望参数：imageBase64 (不带前缀的 base64 字符串)
      
      let buffer = null
      
      // 兼容旧逻辑 (fileContent) 和新逻辑 (imageBase64)
      if (event.imageBase64) {
          buffer = Buffer.from(event.imageBase64, 'base64')
      } else if (content) {
          // 之前的逻辑，尝试下载
          const fileContent = content
          if (fileContent.startsWith('cloud://')) {
              const res = await cloud.downloadFile({ fileID: fileContent })
              buffer = res.fileContent
          } else {
              // http 链接在云函数端下载不稳定，建议前端转 base64
              return { code: 400, msg: '建议使用 imageBase64 参数传递图片内容' }
          }
      } else {
          return { code: 400, msg: '缺少图片内容参数' }
      }
      
      try {
          const result = await cloud.openapi.security.imgSecCheck({
            media: {
              contentType: 'image/png', // 通用格式
              value: buffer
            }
          })
          
          if (result.errCode === 0) {
            return { code: 200, msg: 'ok' }
          } else if (result.errCode === 87014) {
            return { code: 87014, msg: '图片包含违规信息' }
          } else {
            return { code: 500, msg: '检测失败', err: result }
          }
      } catch (e) {
          console.error('imgSecCheck failed:', e)
          return { code: 500, msg: '检测服务异常', err: e }
      }
    }
    
    return { code: 400, msg: '未知类型' }
    
  } catch (err) {
    console.error('Check failed:', err)
    // 错误码 87014: 内容含有违法违规内容
    if (err.errCode === 87014) {
      return { code: 87014, msg: '内容包含违规信息' }
    }
    return { code: 500, msg: '检测服务异常', err: err }
  }
}