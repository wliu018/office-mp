<script setup>
import { useDialog } from '@wot-ui/ui'
import { computed, inject, reactive, ref } from 'vue'
import { fileTransferApi } from '@/api/file-transfer-api'
import { simpleLoginApi } from '@/api/login/simple-login-api'
import { othersApi } from '@/api/others-api'
import CustomTabBar from '@/components/CustomTabBar.vue'
import globalLoading from '@/components/global-loading.vue'
import WeatherCard from '@/components/weather-card.vue'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
    enablePullDownRefresh: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4', // 基础库最低版本
    sdkVersionEnd: '15.255.255', // 填最大值
  },
})

onShareAppMessage((res) => {
  return {
    title: '丝路办公助手',
    path: 'pages/index/index',
    imageUrl1: '/static/images/index/ad2.png',
  }
})
const globalLoadingShow = ref(false)
let isFileTransferScan = false
let handledFileTransferScene = ''
const showMeetingReservation = false
const navBarConfig = inject('navBarConfig', { customNavBarHeight: 0 })
const weather = ref(null)
const homeHeaderContentTop = ref(navBarConfig.statusBarHeight + navBarConfig.navBarHeight / 2)

const defaultCustomRouteConfig = {
  opaque: false,
  maintainState: true,
  transitionDuration: 300,
  reverseTransitionDuration: 300,
  barrierColor: 'rgba(0, 0, 0, 0.4)',
  barrierDismissible: true,
  barrierLabel: '',
  canTransitionTo: true,
  canTransitionFrom: true,
  allowEnterRouteSnapshotting: true,
  allowExitRouteSnapshotting: true,
  fullscreenDrag: true,
  popGestureDirection: 'horizontal', // vertical, horizontal, both
}

// 轮播图数据
const swiperList = ref([
  '/static/images/index/ad2.jpg',
])

// 当前轮播图索引
const current = ref(0)

// 处理轮播图点击
function handleClick(index) {
  console.log('轮播图点击:', index)
}

// 处理轮播图切换
function onChange(e) {
  current.value = e.detail.current
}

console.log('index/index 首页打印了')

//
const rootParams = reactive({ type: 'fade', duration: 350, closedElevation: 0, closedBorderRadius: 8, openElevation: 0, openBorderRadius: 18 })

// ---------------------- 生命周期函数 ------------------------
const surplusTicket = ref(0)
const maintenancePending = ref(0)
const employeeCertificationPending = ref(0)
const ticketRecord = ref([])
const reserveList = ref([])
const employeeCertificationAdminOpenIds = new Set([
  'opWlq1_L2wQaia7p93MM9-QcAiOg',
  'opWlq14br_ZPuThxqgIAVUAWT4wI',
  'opWlq16rZlGEdv9GJJOC82icsHbk',
])
const userStore = useUserStore()
const dialog = useDialog('file-transfer')
const canViewEmployeeCertification = computed(() => employeeCertificationAdminOpenIds.has(userStore.openId))

onShow(async () => {
  await uni.$onLaunched
  handleFileTransferScene(wx.getEnterOptionsSync?.()?.query?.scene)
  loadWeather()
  othersApi.surplusTicket().then((res) => {
    surplusTicket.value = res
    console.log('剩余票数:', res)
  })
  othersApi.workflowInstanceStatisticsByOpenId(useUserStore().openId).then((res) => {
    maintenancePending.value = res?.pending || 0
  }).catch(() => {
    maintenancePending.value = 0
  })
  if (canViewEmployeeCertification.value) {
    simpleLoginApi.employeeCertificationPage().then((res) => {
      const records = res?.records || []
      employeeCertificationPending.value = records.filter(item => item?.status === '未认证' || item?.status === '待认证' || Number(item?.type) === 1).length
    }).catch(() => {
      employeeCertificationPending.value = 0
    })
  }
  else {
    employeeCertificationPending.value = 0
  }
  othersApi.getTicketRecord({ openId: useUserStore().openId }).then((res) => {
    ticketRecord.value = res
    console.log('票数记录:', res)
  })
  othersApi.getReserveList({ openId: useUserStore().openId }).then((res) => {
    reserveList.value = res
    console.log('预约列表:', res)
  })
})

async function loadWeather() {
  weather.value = null
  try {
    const setting = await new Promise((resolve, reject) => {
      uni.getSetting({ success: resolve, fail: reject })
    })
    if (setting.authSetting?.['scope.userLocation'] !== true)
      return

    let location
    try {
      location = await getWeatherLocation()
    }
    catch (error) {
      console.warn('[天气] 地址获取失败，使用上海市', error)
      location = { city: '上海市', district: '' }
    }
    if (location.city !== '上海市')
      location = { city: '上海市', district: '' }

    weather.value = await othersApi.weatherCondition(location)
  }
  catch (error) {
    console.error('[天气] 后端请求失败', error)
  }
}

function getWeatherLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: ({ latitude, longitude }) => {
        wx.request({
          url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=DR2BZ-TXMEV-WTNPD-5TVTY-CKXM2-QYFUW`,
          success: ({ data }) => {
            const address = data?.result?.address_component
            if (data?.status === 0 && address?.city) {
              resolve({ city: address.city, district: address.district || '' })
              return
            }
            reject(new Error(data?.message || '地址解析失败'))
          },
          fail: reject,
        })
      },
      fail: reject,
    })
  })
}

async function authorizeFileTransfer(scene) {
  let msg = '成功'
  try {
    await userStore.silentLogin()
    await fileTransferApi.authorize(scene)
  }
  catch (error) {
    const message = error?.data?.msg || error?.data?.message || error?.message || '网络异常，请稍后重试'
    if (/过期|已使用/.test(message)) {
      msg = '已过期'
    }
    else if (/仅员工认证已通过|认证未通过|未认证/.test(message)) {
      msg = '未认证'
    }
    else {
      msg = '失败'
    }
    toast.error(msg)
  }
  // const exitMiniProgram = () => uni.exitMiniProgram()
  // dialog.confirm({ title: msg, msg: '扫码成功' }).then(exitMiniProgram, exitMiniProgram)
}

function handleFileTransferScene(rawScene) {
  let scene = ''
  try {
    scene = decodeURIComponent(rawScene || '')
  }
  catch {}
  if (!/^ft[\w-]{30}$/.test(scene) || scene === handledFileTransferScene)
    return false
  handledFileTransferScene = scene
  isFileTransferScan = true
  authorizeFileTransfer(scene)
  return true
}

onLoad((options) => {
  const menuButton = uni.getMenuButtonBoundingClientRect?.()
  if (menuButton?.height)
    homeHeaderContentTop.value = menuButton.top + menuButton.height / 2
  handleFileTransferScene(options?.scene)
  console.log('测试 uni API 自动引入: onLoad')
})
onMounted(async () => {
  if (!isFileTransferScan)
    await reloadHomePage()
})

async function reloadHomePage() {
  console.log('reloadHomePage')
  globalLoadingShow.value = true
  await new Promise(resolve => setTimeout(() => resolve(), 1800))
  globalLoadingShow.value = false
}

onPullDownRefresh(() => {
  console.log('下拉刷新')
  setTimeout(() => {
    uni.stopPullDownRefresh()
  }, 300)
})

// ------------ 业务逻辑 ------------
function navigateWithZoom(url) {
  wx.navigateTo({
    url,
    routeType: 'wx://zoom',
  })
}

function appointment() {
  navigateWithZoom('/pages/reserve/reserve')
}

function project() {
  wx.navigateTo({
    url: `/pages-sub/project/project`,
  })
}

function parkingCoupon(item) {
  wx.navigateTo({
    url: `/pages/parking/parking`,
    routeType: 'wx://zoom',
  })
}

function maintenance() {
  navigateWithZoom('/pages-sub/maintenance/list')
}

function employeeCertification() {
  navigateWithZoom('/pages-sub/employee-certification/list')
}

function checkCoupon(item) {
  wx.navigateTo({
    url: `/pages/parking/checking?code=${item.code}&openId=${useUserStore().openId}`,
    routeType: 'wx://zoom',
  })
}

function feedback() {
  wx.navigateTo({
    url: `/pages/feedback/feedback`,
    routeType: 'wx://upwards',
  })
}

function voiceChat() {
  wx.navigateTo({
    url: `/pages-sub/voice-chat/voice-chat`,
    routeType: 'wx://zoom',
  })
}

function moreDetails(type) {
  let url = ''
  if (type === 1) {
    url = `/pages-sub/details/reserveList`
  }
  else if (type === 2) {
    url = `/pages-sub/details/parkingList`
  }
  wx.navigateTo({
    url,
  })
}

const CustomRotue = {
  BottomSheet: 'wx://bottom-sheet',
  Upwards: 'wx://upwards',
  FadeUpwards: 'wx://fade-upwards',
  Zoom: 'wx://zoom',
  Modal: 'wx://modal',
  Cupertino: 'wx://cupertino',
  CupertinoModal: 'wx://cupertino-modal',
  CupertinoModalInside: 'wx://cupertino-modal-inside',
  ModalNavigation: 'wx://modal-navigation',
}
const list1 = reactive([
  {
    id: 0,
    routeType: CustomRotue.BottomSheet,
    disableDrag: 1,
    content: 'BottomSheet',
  },
  {
    id: 1,
    routeType: CustomRotue.Upwards,
    nextRouteType: CustomRotue.Upwards,
    content: 'Upwards',
    fullscreen: 1,
  },
  {
    id: 2,
    routeType: CustomRotue.FadeUpwards,
    nextRouteType: CustomRotue.FadeUpwards,
    fullscreen: 1,
    content: 'Fade Upwards',
  },
  {
    id: 3,
    routeType: CustomRotue.Zoom,
    nextRouteType: CustomRotue.Zoom,
    fullscreen: 1,
    content: 'Zoom',
  },
  {
    id: 4,
    routeType: CustomRotue.Modal,
    nextRouteType: CustomRotue.ModalNavigation,
    content: 'Modal with navigation',
  },
  // {
  //   id: 5,
  //   routeType: CustomRotue.Cupertino,
  //   nextRouteType: CustomRotue.Cupertino,
  //   fullscreen: 1,
  //   content: 'Cupertino (iOS default)'
  // },
  {
    id: 6,
    routeType: CustomRotue.CupertinoModal,
    nextRouteType: CustomRotue.CupertinoModalInside,
    content: 'Cupertino Modal inside modal',
  },
  {
    id: 7,
    routeType: CustomRotue.CupertinoModal,
    nextRouteType: CustomRotue.ModalNavigation,
    fullscreen: 1,
    content: 'Cupertino Modal with navigation',
  },
])
const routeType = reactive(['wx://bottom-sheet', 'wx://upwards', 'wx://zoom', 'wx://cupertino-modal', 'wx://cupertino-modal-inside', 'wx://modal-navigation', 'wx://modal'])

function go2details(i) {
  let params = {
    id: 3,
    routeType: 'wx://zoom',
    nextRouteType: 'wx://zoom',
    fullscreen: 1,
    content: 'Zoom',
  }
  params = {
    id: 3,
    routeType: 'wx://cupertino-modal',
    nextRouteType: 'wx://cupertino-modal',
    fullscreen: 1,
    content: 'Zoom',
  }
  params = {
    id: 3,
    routeType: 'wx://cupertino-modal-inside',
    nextRouteType: 'wx://cupertino-modal-inside',
    fullscreen: 1,
    content: 'Zoom',
  }
  params = {
    id: 3,
    routeType: routeType[i],
    nextRouteType: routeType[i],
    fullscreen: 1,
    content: 'Zoom',
  }
  wx.navigateTo({
    url: `/pages/reserve/reserve`,
    routeType: params.routeType,
    routeConfig: defaultCustomRouteConfig,
  })
}
</script>

<template>
  <div class="content-wrapper home-page min-h-[100vh] flex flex-col items-center">
    <view class="home-header" :style="`height: ${navBarConfig.customNavBarHeight}px;`">
      <image class="home-header-logo" :style="{ top: `${homeHeaderContentTop}px` }" src="/static/images/loading/b_logo.svg" mode="heightFix" />
      <view v-if="weather" class="home-header-weather" :style="{ top: `${homeHeaderContentTop}px` }">
        <WeatherCard :weather="weather" />
      </view>
    </view>
    <swiper
      :current="current" style="width: 100vw; height: 30vh;"
      :autoplay="true" :interval="2500" :circular="false"
      :indicator-dots="false" indicator-color="rgba(255, 255, 255, 0.4)"
      layout-type1="tinder"
      indicator-active-color="rgba(255, 255, 255, 0.9)" @change="onChange" @click="handleClick"
    >
      <swiper-item v-for="(item, index) in swiperList" :key="index">
        <div class="relative h-full w-full">
          <image :src="item" mode="aspectFill" style="width: 100%; height: 100%" />
          <div v-if="index === 1" class="absolute inset-0 z-1 h-full w-full flex items-center justify-center">
            <div class="text-bold text-center text-[30px] text-white" />
          </div>
        </div>
      </swiper-item>
    </swiper>

    <!-- 菜单 -->
    <div class="menu-wrapper">
      <div v-if="showMeetingReservation" class="menu-item" @tap="appointment">
        <image src="/static/images/index/meeting-1.png" class="shadow-blur" mode="widthFix" />
        <div class="menu-name">
          会议室预订
        </div>
      </div>

      <open-container
        :closed-elevation="rootParams.closedElevation"
        :closed-border-radius="rootParams.closedBorderRadius"
        :open-elevation="rootParams.openElevation"
        :open-border-radius="rootParams.openBorderRadius"
        :transition-type="rootParams.type"
        :transition-duration="rootParams.duration"
        @tap="project"
      >
        <div class="menu-item shadow-blur">
          <image src="/static/images/index/project-2.png" mode="widthFix" />
          <div class="menu-name">
            项目检索
          </div>
        </div>
      </open-container>

      <div class="menu-item" @tap="maintenance">
        <wd-badge :value="maintenancePending" show-zero>
          <image src="/static/images/index/signIn-3.png" mode="widthFix" />
        </wd-badge>
        <div class="menu-name">
          项目维保
        </div>
      </div>
      <div v-if="canViewEmployeeCertification" class="menu-item" @tap="employeeCertification">
        <wd-badge :value="employeeCertificationPending" show-zero>
          <image src="/static/images/index/meeting-1.png" class="shadow-blur" mode="widthFix" />
        </wd-badge>
        <div class="menu-name">
          认证申请
        </div>
      </div>
      <div class="menu-item" @tap="feedback">
        <image src="/static/images/index/feedback-icon-4.png" mode="widthFix" />
        <div class="menu-name">
          意见建议
        </div>
      </div>
      <!-- <div class="menu-item" @tap="voiceChat">
        <wd-icon name="microphone" size="52px" color="#6366f1" />
        <div class="menu-name">
          语音助手
        </div>
      </div>
    </div> -->
      <!-- 底部导航栏 -->
      <!-- <div class="middle-banner-wrapper shadow-blur" @click="go2details">
      <image src="/static/images/index/middle-banner.png" mode="widthFix" />
    </div> -->
      <!-- <div class="flex flex-row flex-wrap">
      <div
        v-for="(i, index) in routeType"
        :key="index"
        class="mb-1 mr-5" @click="go2details(index)"
      >
        <wd-badge value="9:00">
          <wd-button :round="false" size="small" custom-class="btn-custom-class">
            {{ `1${index}` }}
          </wd-button>
        </wd-badge>
      </div>
    </div> -->
      <scroll-view :scroll-y="true" :enable-back-to-top="true" style="height: calc(100vh - 30vh - 102px);">
        <div style="padding-bottom: calc(10vh + 2vh);" class="index-content-wrapper">
          <div v-if="showMeetingReservation" class="section-wrapper box-border">
            <div class="section-title font-bold">
              会议室预订记录
              <div class="more flex flex-row items-center" @tap="moreDetails(1)">
                查看更多<wd-icon name="arrow-right" />
              </div>
            </div>
            <div class="reserve-record-wrapper">
              <template v-if="reserveList.length > 0">
                <div v-for="(item, index) in reserveList" :key="index" class="rr-item">
                  <div class="rr-item-title flex items-center gap-1 truncate">
                    <wd-icon name="chat1" color="#999" size="16px" />
                    <div>{{ item.topic }}</div>
                  </div>
                  <div class="rr-item-other">
                    <div class="rr-item-other-room">
                      {{ item.room_name }}
                    </div>
                    <div class="rr-item-other-time">
                      {{ item.reservation_time_slot }}
                    </div>
                  </div>
                </div>
              </template>
              <wd-empty v-else icon="no-content" tip="暂无内容" />
            </div>
          </div>
          <div v-if="showMeetingReservation" class="section-wrapper box-border">
            <div class="section-title font-bold">
              停车券领取记录
              <div class="more flex flex-row items-center" @tap="moreDetails(2)">
                查看更多<wd-icon name="arrow-right" />
              </div>
            </div>
            <template v-if="ticketRecord.length > 0">
              <wd-cell-group v-for="(item, index) in ticketRecord" :key="index" border custom-style="width: 100%;">
                <wd-cell :title="`${item.license_plate_number}`" is-link @tap="checkCoupon(item)">
                  {{ item.create_time }}
                </wd-cell>
              </wd-cell-group>
            </template>
            <wd-empty v-else icon="no-content" tip="暂无内容" />
          </div>
        </div>
      </scroll-view>
      <globalLoading :show="globalLoadingShow" />
      <CustomTabBar v-if="!globalLoadingShow" @reload="reloadHomePage" @file-transfer-scan="handleFileTransferScene" />
    </div>
  </div>
</template>

<style>
.wd-swiper-item {
  width: 100%;
  height: 100%;
}
page {
  background:
    linear-gradient(158deg, #fffced 17.46%, rgba(255, 252, 237, 0) 87.82%), linear-gradient(0deg, #ebfbff, #ebfbff),
    linear-gradient(102deg, #f0f6ff 35.5%, #eeebff 78.79%);
}
.wd-cell__wrapper {
}
</style>

<style lang="scss" scoped>
@use './scss/index.scss';
</style>
