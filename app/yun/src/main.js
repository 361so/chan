import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'
import share from './utils/share'

export function createApp() {
  const app = createSSRApp(App)
  const store = Pinia.createPinia()
  app.use(store)
  
  // 全局混入分享功能
  app.mixin(share)
  
  return {
    app,
    Pinia
  }
}
