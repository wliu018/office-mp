<template>
  <view class="tab-bar animate__pulse">
    <view
      v-for="(item, index) in tabList"
      :key="index"
      class="tab-item"
      :class="{ active: currentTab === index }"
      @click="switchTab(index, item.path)"
    >
      <image :src="currentTab === index ? item.iconActive : item.icon" class="tab-icon" />
      <!-- <text>{{ item.text }}</text> -->
    </view>
  </view>
</template>

<script>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'

export default {
  data() {
    return {
      currentTab: 0,
      tabList: [
        {
          text: '首页',
          path: '/pages/index/index',
          icon: '/static/icon/tabbar/home.png',
          iconActive: '/static/icon/tabbar/home.png',
        },
        {
          text: '扫码',
          path: '/pages/index/index',
          icon: '/static/icon/tabbar/scan.png',
          iconActive: '/static/icon/tabbar/scan.png',
        },
        {
          text: '我的',
          path: '/pages/me/me',
          icon: '/static/icon/tabbar/mine.png',
          iconActive: '/static/icon/tabbar/mine.png',
        },
      ],
    }
  },
  methods: {
    switchTab(index, path) {
      wx.vibrateShort({ type: 'heavy' })
      this.hasLogin().then(async () => {
        this.currentTab = index
        if (index === 0) {
          this.$emit('reload')
        }
        else if (index === 1) {
          this.scanCode()
          this.tabbar = false
        }
        else if (index === 2) {
          uni.navigateTo({
            url: path,
          })
        }
      })
    },
    scanCode() {
      wx.scanCode({
        success: (res) => {
          console.log('二维码内容', res)
          uni.navigateTo({
            url: `${res.path ? res.path : '/pages/index/index'}`,
          })
        },
        fail: (err) => {
          console.error(err)
          // 处理扫码失败的情况
          // uni.$u.toast("扫码失败");
        },
      })
    },
    hasLogin() {
      return new Promise((resolve, reject) => {
        const openId = useUserStore().openId
        console.log('openId', openId)
        console.log('storeToRefs', openId, openId.value === '')
        if (!openId) {
          this.$parent.open()
          reject(new Error('用户未登录'))
        }
        resolve()
      })
    },
  },
}
</script>

<style>
.tab-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 30px;
  z-index: 999;
  width: calc(100vw - 60px);
  height: 58px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-radius: 999px;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  background1: url(data:image/png;base64,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)
    no-repeat center center;
  background: linear-gradient(98deg, rgba(19, 102, 236, 0.5) 2%, rgba(110, 38, 234, 0.5) 95%);
}

.tab-item {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.tab-item.active {
  color: #007aff;
}

.tab-icon {
  width: 24px;
  height: 24px;
}

.animate__bounce {
  animation-duration: 1s;
  animation-delay: 0.3s;
  animation-repeat: 1;
  animation-name: bounce;
  transform-origin: center bottom;
}

.animate__pulse {
  animation-duration: 1s;
  animation-delay: 0.8s;
  animation-repeat: 1;
  animation-name: pulse;
  transform-origin: center bottom;
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scaleX(1);
  }

  50% {
    transform: translateX(-50%) scale3d(1.05, 1.05, 1.05);
  }

  to {
    transform: translateX(-50%) scaleX(1);
  }
}

@keyframes bounce {
  0%,
  20%,
  53%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translateX(-50%) translateZ(0);
  }

  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(-50%, -30px, 0) scaleY(1.1);
  }

  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(-50%, -15px, 0) scaleY(1.05);
  }

  80% {
    transform: translateX(-50%) translateZ(0) scaleY(0.95);
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  90% {
    transform: translate3d(-50%, -4px, 0) scaleY(1.02);
  }
}
</style>
