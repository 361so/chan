import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

export function useGlobalShare(options = {}) {
  const defaultShare = {
    title: '城市微光 - 记录城市温度，让美好被看见',
    path: '/pages/index/index',
    imageUrl: '/static/logo.png',
    ...options
  }

  onShareAppMessage(() => {
    return {
      title: defaultShare.title,
      path: defaultShare.path,
      imageUrl: defaultShare.imageUrl
    }
  })

  onShareTimeline(() => {
    return {
      title: defaultShare.title,
      query: ''
    }
  })
}

export default useGlobalShare