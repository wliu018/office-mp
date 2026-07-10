<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="预定列表"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view
      :scroll-y="true"
      :enable-back-to-top="true"
      lower-threshold="50"
      :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`" @scrolltolower="onScrollToLower"
    >
      <view
        class="container relative box-border p-[20px]"
      >
        <div class="section-title mb-[10px] text-[15px] text-[#333]">
          会议室预订记录
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
                  {{ item.reservation_date }} {{ item.reservation_time_slot }}
                </div>
              </div>
            </div>
          </template>
          <wd-status-tip v-else image="content" tip="暂无内容" />
        </div>
        <!-- 加载状态提示 -->
        <wd-loadmore
          :state="state"
          loading-text="加载中..."
          more-text="更多"
          no-more-text="没有更多数据了"
          @reload="onScrollToLower"
        />
      </view>
    </scroll-view>
  </div>
  <wd-toast />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import dayjs from 'dayjs'
import { inject, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig')

const apiUrl = import.meta.env.VITE_SERVER_BASEURL

const openId = useUserStore().openId
const toast = useToast()
const globalLoadingShow = ref(false)
const wdLoading = ref(true)

const scrollLoading = ref(false)
const state = ref('')
const num = ref(0)
const max = ref(50)

const reserveList = ref([])

function onScrollToLower() {
  // 加载更多数据
  console.log('加载更多数据')
  if (scrollLoading.value || state.value === 'loading' || state.value === 'finished')
    return
  state.value = 'loading'
  console.log('state.value', state.value)
  scrollLoading.value = true
  setTimeout(() => {
    state.value = ''
    scrollLoading.value = false
  }, 1000)
}

onShow(async () => {
  await uni.$onLaunched
})

onLoad(() => {
  console.log('测试 uni API 自动引入: onLoad')
})
onMounted(async () => {
  othersApi.getTop50ReserveList({ openId }).then((res) => {
    wdLoading.value = false
    reserveList.value = res
    console.log('预约列表:', res)
  })
})

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '预定列表',
  },
})
</script>

<style>
page {
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(
    99deg,
    rgba(255, 91, 145, 0.08) 2%,
    rgba(63, 169, 245, 0.1) 51.48%,
    rgba(58, 175, 246, 0.1) 57.25%,
    rgba(46, 193, 248, 0.1) 65.5%,
    rgba(25, 222, 251, 0.1) 74.57%,
    rgba(0, 255, 255, 0.1) 82.82%
  );

  background:
    linear-gradient(158deg, #fffced 17.46%, rgba(255, 252, 237, 0) 87.82%), linear-gradient(0deg, #ebfbff, #ebfbff),
    linear-gradient(102deg, #f0f6ff 35.5%, #eeebff 78.79%);
}
.wd-textarea__count {
  width: 60px;
  justify-content: flex-end;
}
</style>

<style lang="scss" scoped>
@import './scss/reserveList.scss';
</style>
