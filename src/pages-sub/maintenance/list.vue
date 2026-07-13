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
        <view class="statistics-title">
          流程统计
        </view>
        <view class="statistics-grid">
          <view class="statistics-item pending">
            <text>待处理</text>
            <text class="statistics-count">{{ statistics.pending }}</text>
          </view>
          <view class="statistics-item processed">
            <text>已处理</text>
            <text class="statistics-count">{{ statistics.processed }}</text>
          </view>
          <view class="statistics-item all">
            <text>所有</text>
            <text class="statistics-count">{{ statistics.all }}</text>
          </view>
        </view>
      </view>

      <wd-button v-if="canCreateWorkOrder" block custom-style="min-height: 46px; margin-bottom: 18px; border-radius: 10px; background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%); font-size: 16px; font-weight: 600;" @click="createWorkOrder">
        新建维保单
      </wd-button>

      <view class="section-title">
        当前待处理流程
      </view>
      <view v-if="!loading && workflows.length === 0" class="empty-state">
        暂无待处理维保工单
      </view>
      <view v-for="item in workflows" :key="item.id" class="workflow-card" @click="openWorkOrder(item.id)">
        <view class="card-title">
          <text class="card-id">#{{ item.id }} {{ item.projectName || '-' }}</text>
          <text class="status">{{ (item.status === 'RUNNING' ? '待处理' : '已处理') }}</text>
        </view>
        <view class="card-node">
          {{ item.currentNodeName || item.currentNodeId || '-' }}
        </view>
        <view class="card-meta">
          <view class="card-meta-item">
            <text>当前处理人</text>
            <text>{{ item.currentHandlerName || '-' }}</text>
          </view>
          <view class="card-meta-item">
            <text>创建时间</text>
            <text>{{ item.createTime || '-' }}</text>
          </view>
        </view>
      </view>

      <view class="section-title section-title-processed">
        已处理流程
      </view>
      <view v-if="!loading && processedWorkflows.length === 0" class="empty-state">
        暂无已处理维保工单
      </view>
      <view v-for="item in processedWorkflows" :key="item.id" class="workflow-card" @click="openWorkOrder(item.id)">
        <view class="card-title">
          <text class="card-id">#{{ item.id }} {{ item.projectName || '-' }}</text>
          <text class="status">{{ (item.status === 'RUNNING' ? '待处理' : '已处理') }}</text>
        </view>
        <view class="card-node">
          {{ item.currentNodeName || item.currentNodeId || '-' }}
        </view>
        <view class="card-meta">
          <view class="card-meta-item">
            <text>当前处理人</text>
            <text>{{ item.currentHandlerName || '-' }}</text>
          </view>
          <view class="card-meta-item">
            <text>创建时间</text>
            <text>{{ item.createTime || '-' }}</text>
          </view>
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
const processedWorkflows = ref([])
const statistics = ref({ pending: 0, processed: 0, all: 0 })
const canCreateWorkOrder = ref(false)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '维保工单列表',
    disableScroll: true,
  },
})

async function loadWorkflows() {
  loading.value = true
  try {
    const [pending, processed, result, isMarketPersonnel] = await Promise.all([
      othersApi.workflowInstanceListByOpenId(openId),
      othersApi.workflowInstanceProcessedListByOpenId(openId),
      othersApi.workflowInstanceStatisticsByOpenId(openId),
      simpleLoginApi.isMarketPersonnel({ openId }),
    ])
    workflows.value = pending || []
    processedWorkflows.value = processed || []
    statistics.value = result || { pending: 0, processed: 0, all: 0 }
    canCreateWorkOrder.value = isMarketPersonnel
  }
  catch (error) {
    workflows.value = []
    processedWorkflows.value = []
    statistics.value = { pending: 0, processed: 0, all: 0 }
    canCreateWorkOrder.value = false
    uni.showToast({ title: error?.message || '流程列表加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function createWorkOrder() {
  uni.navigateTo({ url: '/pages-sub/maintenance/maintenance' })
}

function openWorkOrder(instanceId) {
  uni.navigateTo({ url: `/pages-sub/maintenance/maintenance?instanceId=${instanceId}` })
}

onShow(async () => {
  await uni.$onLaunched
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
@import './scss/list.scss';
</style>
