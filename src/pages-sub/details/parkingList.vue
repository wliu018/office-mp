<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="领取列表"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="true" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
      <view
        class="container relative box-border p-[20px]"
      >
        <div class="section-title mb-[10px] text-[15px] text-[#333]">
          停车券领取记录
        </div>
        <template v-if="ticketRecord.length > 0">
          <div>
            <wd-cell-group v-for="(item, index) in ticketRecord" :key="index" border custom-style="width: calc(100%-40px);margin-bottom: 10px;">
              <wd-cell :title="`${item.license_plate_number}`" is-link @tap="checkCoupon(item)">
                {{ item.create_time }}
              </wd-cell>
            </wd-cell-group>
          </div>
        </template>
        <wd-status-tip v-else image="content" tip="暂无内容" />
      </view>
    </scroll-view>
  </div>
  <wd-toast />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import dayjs from 'dayjs'
import { inject, nextTick, onMounted, reactive, ref } from 'vue'
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

const ticketRecord = ref([])

onShow(async () => {
  await uni.$onLaunched
})

onLoad(() => {
  console.log('测试 uni API 自动引入: onLoad')
})
onMounted(async () => {
  othersApi.getTop50TicketRecord({ openId: useUserStore().openId }).then((res) => {
    wdLoading.value = false
    ticketRecord.value = res
    console.log('票数记录:', res)
  })
})

function checkCoupon(item) {
  wx.navigateTo({
    url: `/pages/parking/checking?code=${item.code}&openId=${useUserStore().openId}`,
    routeType: 'wx://zoom',
  })
}

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '领取列表',
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
@import './scss/parkingList.scss';
</style>
