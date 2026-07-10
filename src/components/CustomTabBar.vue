<template>
  <view class="tab-bar-wrapper">
    <image src="/static/icon/tabbar/tabbar-bg.png" class="tabbar-bg" />
    <view class="scan-btn" @click="switchTab(1, '')">
      <!-- <wd-icon name="scan" size="28px" color="#bfbfbf" /> -->
      <image src="/static/icon/tabbar/scan.png" class="tab-icon-scan" />
    </view>
    <view class="tab-bar animate__pulse">
      <view
        v-for="(item, index) in tabList"
        :key="index"
        class="tab-item"
        :class="{ active: currentTab === index }"
        :style="`${index === 1 ? 'visibility: hidden;pointer-events: none;' : ''}`"
        @click="switchTab(index, item.path)"
      >
        <image :src="currentTab === index ? item.iconActive : item.icon" class="tab-icon" />
      <!-- <text>{{ item.text }}</text> -->
      </view>
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
      console.log(123)
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
            url: `/${res.path}`,
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

<style scoped lang="scss">
.scan-btn {
  width: 9vh;
  height: 9vh;
  position: absolute;
  z-index: 999;
  top: 0;
  left: 50%;
  transform: translate(-50%, -60%);
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: rgba(0, 0, 0, 0.1) 0px -2px 10px 0px;
  border-radius: 50%;
}
.tab-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100vw;
  height: 10vh;
  image.tabbar-bg {
    width: 100%;
    height: 100%;
    vertical-align: middle;
    z-index: 1;
  }
}
.tab-bar {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
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

.tab-icon-scan {
  width: 26px;
  height: 26px;
}

.animate__bounce {
  animation-duration: 1s;
  animation-delay: 0.1s;
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
    transform: scaleX(1);
  }

  50% {
    transform: scale3d(1.05, 1.05, 1.05);
  }

  to {
    transform: scaleX(1);
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
