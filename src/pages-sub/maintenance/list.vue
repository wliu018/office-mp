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
      <wd-button block custom-style="margin-bottom: 16px; background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%);" @click="createWorkOrder">
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
          <text>流程 #{{ item.id }}</text>
          <text class="status">{{ item.status || '-' }}</text>
        </view>
        <view class="card-row">
          业务类型：{{ item.bizType || '-' }}
        </view>
        <view class="card-row">
          当前节点：{{ item.currentNodeName || item.currentNodeId || '-' }}
        </view>
        <view class="card-row">
          当前处理人：{{ item.currentHandlerName || '-' }}
        </view>
        <view class="card-row">
          创建时间：{{ item.createTime || '-' }}
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
          <text>流程 #{{ item.id }}</text>
          <text class="status">{{ item.status || '-' }}</text>
        </view>
        <view class="card-row">
          业务类型：{{ item.bizType || '-' }}
        </view>
        <view class="card-row">
          当前节点：{{ item.currentNodeName || item.currentNodeId || '-' }}
        </view>
        <view class="card-row">
          当前处理人：{{ item.currentHandlerName || '-' }}
        </view>
        <view class="card-row">
          创建时间：{{ item.createTime || '-' }}
        </view>
      </view>
    </view>
  </scroll-view>
  <loadingBox :show="loading" />
</template>

<script setup>
import { inject, ref } from 'vue'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

const navBarConfig = inject('navBarConfig')
const openId = useUserStore().openId
const loading = ref(true)
const workflows = ref([])
const processedWorkflows = ref([])

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
    const [pending, processed] = await Promise.all([
      othersApi.workflowInstanceListByOpenId(openId),
      othersApi.workflowInstanceProcessedListByOpenId(openId),
    ])
    workflows.value = pending || []
    processedWorkflows.value = processed || []
  }
  catch (error) {
    workflows.value = []
    processedWorkflows.value = []
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
