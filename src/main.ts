import { createSSRApp } from 'vue'
import App from './App.vue'
import { requestInterceptor } from './http/interceptor'
import { routeInterceptor } from './router/interceptor'

import store from './store'
import '@/style/index.scss'
import 'virtual:uno.css'

export function createApp() {
  const app = createSSRApp(App)

  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  const navBarHeight = systemInfo.platform === 'ios' ? 44 : 48
  const navBarConfig = {
    statusBarHeight: systemInfo.statusBarHeight,
    navBarHeight,
    customNavBarHeight: systemInfo.statusBarHeight + navBarHeight,
  }
  app.provide('navBarConfig', navBarConfig)

  app.use(store)
  app.use(routeInterceptor)
  app.use(requestInterceptor)

  return {
    app,
  }
}
