<script setup>
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { navigateToInterceptor } from '@/router/interceptor'
import { useUserStore } from '@/store/user'

onLaunch(async (options) => {
  console.log('App.vue onLaunch', options)
  uni.$onLaunched = new Promise((resolve) => {
    console.log('App Launch', resolve)
    uni.$isResolve = resolve
  })

  const token = useUserStore().token
  console.log('onLaunch -> token', token)
  if (!token) {
    useUserStore().silentLogin()
  }

  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()
  updateManager.onCheckForUpdate((res) => {})
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success(res) {
        if (res.confirm) {
          updateManager.applyUpdate()
        }
      },
    })
  })
  updateManager.onUpdateFailed(() => {
    // 新版本下载失败
  })
  // #endif

  // 完成基础加载
  await uni.$isResolve()
})
onShow((options) => {
  console.log('App.vue onShow', options)
  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
  // #ifdef MP-WEIXIN
  wx.setKeepScreenOn({
    keepScreenOn: true,
    fail() {
      // 如果失败 再进行调用
      wx.setKeepScreenOn({
        keepScreenOn: true,
      })
    },
  })
  // #endif
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style>
page {
  -webkit-overflow-scrolling: touch;
  height: 100%;
  width: 100%;
  font-family: qingke, 'PingFang SC', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  word-break: break-all;
  white-space: normal;
  color: #000;
  font-stretch: expanded;
  font-size: 16px;
}
.auth-button {
  border: 0;
}

.auth-button::after {
  border: none;
}

// #ifdef MP-ALIPAY
.uni-page-head {
  .uni-page-head-close {
    color: #000;
  }
}
// #endif
::-webkit-scrollbar {
  width: 0;
  height: 0;
  color: transparent;
  display: none;
}

.bot-title {
  opacity: 0;
  animation-name: bot-title;
  animation-duration: 0.6s;
  animation-delay: 0.1s;
  animation-fill-mode: forwards;
}

@keyframes bot-title {
  0% {
    opacity: 0;
    transform: translate3d(0, 80px, 0);
  }

  to {
    opacity: 1;
    transform: translateZ(0);
  }
}
.wd-message-custom-class {
  --wot-button-info-bg-color: #e8f3ff;
  --wot-button-primary-bg-color: linear-gradient(115deg, #3d7dfe 8.4%, #6a59fe 52.29%, #9142ff 93.72%);
}
</style>
