<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="维保工单列表"
      style="--wot-navbar-background: transparent; --wot-color-border-light: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <scroll-view
    scroll-y
    :enable-back-to-top="true"
    :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`"
  >
    <view class="page-container">
      <view class="statistics-card">
        <view class="statistics-heading">
          <view class="statistics-title">
            流程统计
          </view>
          <wd-button size="small" custom-class="create-work-order-button" custom-style="border-radius: 6px; background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%); color: #fff; font-size: 13px; font-weight: 600;" @click="createWorkOrder">
            <view class="create-work-order-button-content">
              <wd-icon name="add-circle" color="#fff" size="14px" />
              <text>新建维保单</text>
            </view>
          </wd-button>
        </view>
        <view class="statistics-grid">
          <view class="statistics-item pending" @click="openWorkflowList('pending')">
            <text>待处理</text>
            <text class="statistics-count">{{ statistics.pending }}</text>
          </view>
          <view class="statistics-item processed" @click="openWorkflowList('processed')">
            <text>已处理</text>
            <text class="statistics-count">{{ statistics.processed }}</text>
          </view>
          <view class="statistics-item all" @click="openWorkflowList('all')">
            <text>所有</text>
            <text class="statistics-count">{{ statistics.all }}</text>
          </view>
        </view>
      </view>

      <view class="section-title">
        <wd-icon name="transfer" size="15px" color="#36bd69" /> 当前待处理流程
      </view>
      <view v-if="!loading && workflows.length === 0" class="empty-state">
        暂无待处理维保工单
      </view>
      <view v-for="(item, index) in workflows" :key="item.id" class="workflow-card bot-title" :style="{ animationDelay: `${0.2 + index * 0.1}s` }" @click="openWorkOrder(item.id)">
        <view class="card-title">
          <view class="card-title-left">
            <text class="card-project-name">{{ item.projectName || '-' }}</text>
            <text class="card-id">#{{ item.id }}</text>
          </view>
          <text class="status">{{ item.currentNodeName || item.currentNodeId || '-' }}</text>
        </view>
        <view class="card-detail">
          <text class="card-detail-label">当前处理人</text>
          <text class="card-detail-value">{{ item.currentHandlerName || '-' }}</text>
        </view>
        <view class="card-detail">
          <text class="card-detail-label">创建时间</text>
          <text class="card-detail-value">{{ item.createTime || '-' }}</text>
        </view>
      </view>
    </view>
  </scroll-view>
  <loadingBox :show="loading" />
</template>

<script setup>
import { inject, ref } from 'vue'
import { simpleLoginApi } from '@/api/login/simple-login-api.js'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

const navBarConfig = inject('navBarConfig')
const openId = useUserStore().openId
const loading = ref(true)
const workflows = ref([])
const statistics = ref({ pending: 0, processed: 0, all: 0 })
const canCreateWorkOrder = ref(false)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '维保工单列表',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})

async function loadWorkflows() {
  loading.value = true
  try {
    const [pending, result, isMarketPersonnel] = await Promise.all([
      othersApi.workflowInstanceListByOpenId(openId),
      othersApi.workflowInstanceStatisticsByOpenId(openId),
      simpleLoginApi.isMarketPersonnel({ openId }),
    ])
    workflows.value = pending || []
    statistics.value = result || { pending: 0, processed: 0, all: 0 }
    canCreateWorkOrder.value = isMarketPersonnel
  }
  catch (error) {
    workflows.value = []
    statistics.value = { pending: 0, processed: 0, all: 0 }
    canCreateWorkOrder.value = false
    uni.showToast({ title: error?.message || '流程列表加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function createWorkOrder() {
  if (!canCreateWorkOrder.value) {
    uni.showToast({ title: '仅市场人员可新建维保单', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages-sub/maintenance/maintenance' })
}

function openWorkOrder(instanceId) {
  uni.navigateTo({ url: `/pages-sub/maintenance/maintenance?instanceId=${instanceId}` })
}

function openWorkflowList(filter) {
  navigateWithZoom(`/pages-sub/maintenance/history?filter=${filter}`)
}

function navigateWithZoom(url) {
  wx.navigateTo({ url, routeType: 'wx://zoom' })
}

onShow(async () => {
  await uni.$onLaunched
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
@import './scss/list.scss';
</style>
