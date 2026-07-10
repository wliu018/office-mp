<template>
  <div>
    <wd-navbar
      placeholder left-arrow safe-area-inset-top title="项目检索"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div class="relative">
    <!-- <swiper
      :current="current" style="width: 100vw; height: 200px;"
      :autoplay="true" :interval="3500" :circular="false"
      :indicator-dots="false" indicator-color="rgba(255, 255, 255, 0.4)"
      layout-type1="tinder"
      indicator-active-color="rgba(255, 255, 255, 0.9)"
    >
      <swiper-item v-for="(item, index) in swiperList" :key="index">
        <div class="relative h-full w-full">
          <image :src="item" mode="cover" style="width: 100%; height: 100%" />
        </div>
      </swiper-item>
    </swiper> -->
    <!-- <wd-swiper v-model:current="current" :indicator="{ type: 'dots-bar' }" custom-item-class="!h-full" custom-style="--wot-swiper-radius: 0" :list="swiperList" autoplay /> -->
  </div>
  <div class="pb-10px">
    <div class="box-border" style="--wot-search-input-height: 36px; --wot-search-input-radius: 6px">
      <wd-search custom-class="!h-50px" custom-input-class="search-custom-class !h-36px !line-height-36px" placeholder="请输入项目/编号/市场" cancel-txt="搜索" @clear="getProjectList()" @cancel="searchProject" />
    </div>
  </div>
  <div class="relative">
    <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px - 70px);`">
      <view
        class="container relative bg-[#f8f9fa]"
      >
        <wd-card
          v-for="(item, index) in projectList"
          :key="index"
          custom-class="wd-card-custom-class"
          type="rectangle"
        >
          <template #title>
            <view class="title project-title">
              <view class="flex flex-row items-center justify-between" style="width: 100%;">
                <view class="flex flex-row items-center justify-between" style="color: rgba(0,0,0,0.85); width: 100%;">
                  <view class="flex flex-row items-center pr-1">
                    {{ item.serialNumber }}
                    <wd-icon name="file-copy" color="rgba(0,0,0,0.1)" size="22px" @click="copyText(item.serialNumber)" />
                  </view>

                  <view class="">
                    {{ item.marketing }}
                  </view>
                </view>
              </view>
            </view>
          </template>
          <view class="content">
            <view class="flex flex-row items-center pr-1">
              <span class="project-name"> {{ `${item.projectName}` }}</span>
              <wd-icon name="file-copy" color="rgba(0,0,0,0.1)" size="20px" @click="copyText(item.projectName)" />
            </view>
          </view>
          <!-- <template #footer>
            <view class="flex flex-row items-center">
              <view class="pr-1">
                {{ item.marketing }}
              </view> <wd-icon name="file-copy" color="rgba(0,0,0,0.1)" size="22px" @click="copyText(item.marketing)" />
            </view>
          </template> -->
        </wd-card>
      </view>
    </scroll-view>
  </div>
  <wd-toast />
  <globalLoading :show="globalLoadingShow" />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import dayjs from 'dayjs'
import { inject, nextTick, onMounted, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import globalLoading from '@/components/global-loading.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig')

const openId = useUserStore().openId
const toast = useToast()
const globalLoadingShow = ref(false)
const wdLoading = ref(true)

// 轮播图数据
const swiperList = ref([
  '/pages-sub/static/images/study-1.jpg',
  '/pages-sub/static/images/study-1-1.jpg',
  '/pages-sub/static/images/3-202410161440198281.jpg',
  '/pages-sub/static/images/202411211002593667.jpg',
  '/pages-sub/static/images/2-202410171538317624.jpg',
])

// 当前轮播图索引
const current = ref(0)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '项目检索',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})
// ---------------------
const titleHeight = ref(0)
const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
const sysInfo = uni.getSystemInfoSync()
const navBarHeight = menuButtonInfo.top + menuButtonInfo.height + (sysInfo.statusBarHeight - menuButtonInfo.top) * 2
titleHeight.value = navBarHeight
titleHeight.value = sysInfo.statusBarHeight * 2

const scrollY = ref(true)
const projectList = ref([])
async function getProjectList(keywords = '', loading = true) {
  if (loading)
    wdLoading.value = true
  try {
    const res = await othersApi.projectList({ openId, keywords })
    console.log(res)
    projectList.value = res
    if (loading)
      wdLoading.value = false
  }
  catch (error) {
    toast.error(error.message)
  }
}
function pageInit() {
  getProjectList('')
}
function searchProject(e) {
  wx.vibrateShort({ type: 'heavy' })
  getProjectList(e.value)
}
function copyText(data) {
  wx.vibrateShort({ type: 'light' })
  uni.setClipboardData({ data })
  console.log('复制成功')
}
// ---------------------- 生命周期函数 ------------------------
onShow(async () => {
  await uni.$onLaunched
})
onMounted(() => {
  pageInit()
})
</script>

<style lang="scss" scoped>
@import './scss/project.scss';
</style>

<style>
page {
  background: #f8f9fa;
}
@keyframes slowRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.search-custom-class {
}
</style>
