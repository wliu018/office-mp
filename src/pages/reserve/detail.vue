<script setup>
definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '今日预订详情',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4', // 基础库最低版本
    sdkVersionEnd: '15.255.255', // 填最大值，表示无版本限制
  },
})

const titleHeight = ref(0)
const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
const sysInfo = uni.getSystemInfoSync()
const navBarHeight = menuButtonInfo.top + menuButtonInfo.height + (sysInfo.statusBarHeight - menuButtonInfo.top) * 2
titleHeight.value = navBarHeight
</script>

<template>
  <div style="height: 0;">
    <wd-navbar placeholder left-arrow safe-area-inset-top fixed title="预订明细" @click-left="uni.navigateBack()" />
  </div>
  <div :style="`height: ${titleHeight}px;`" />
  <div class="relative">
    <scroll-view :enable-back-to-top="true" :style="`height: calc(100vh - ${titleHeight}px);`">
      <view class="container" style="padding-top: 10px;">
        <wd-status-tip image="message" tip="暂无预订信息" />
      </view>
    </scroll-view>
  </div>
</template>

<style scoped lang="scss">

</style>
