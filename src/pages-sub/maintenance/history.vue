<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="流程列表"
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
      <view class="section-title">
        {{ filterTitle }}
      </view>
      <view v-if="!loading && workflows.length === 0" class="empty-state">
        暂无流程
      </view>
      <view v-for="item in workflows" :key="item.id" class="workflow-card" @click="openWorkOrder(item.id)">
        <view class="card-title">
          <view class="card-title-left">
            <text class="card-project-name">{{ item.projectName || '-' }}</text>
            <text class="card-id">#{{ item.id }}</text>
          </view>
          <text class="status">{{ item.currentNodeName || item.currentNodeId || '-' }}</text>
        </view>
        <view class="card-detail">
          <text class="card-detail-label">处理结果</text>
          <text class="card-detail-value" :class="{ 'solution-result-badge': item.lastSolutionResult }">
            {{ item.lastSolutionResult || '处理中' }}
          </text>
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
import { computed, inject, ref } from 'vue'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

const navBarConfig = inject('navBarConfig')
const openId = useUserStore().openId
const loading = ref(true)
const workflows = ref([])
const filter = ref('all')

const filterTitle = computed(() => ({
  pending: '待处理流程',
  processed: '已处理流程',
  all: '全部流程',
}[filter.value] || '全部流程'))

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '流程列表',
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
    if (filter.value === 'pending') {
      workflows.value = await withLastSolutionResult(await othersApi.workflowInstanceListByOpenId(openId) || [])
    }
    else if (filter.value === 'processed') {
      workflows.value = await withLastSolutionResult(await othersApi.workflowInstanceProcessedListByOpenId(openId) || [])
    }
    else {
      const [pending, processed] = await Promise.all([
        othersApi.workflowInstanceListByOpenId(openId),
        othersApi.workflowInstanceProcessedListByOpenId(openId),
      ])
      workflows.value = await withLastSolutionResult([...(pending || []), ...(processed || [])])
    }
  }
  catch (error) {
    workflows.value = []
    uni.showToast({ title: error?.message || '流程列表加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

async function withLastSolutionResult(items) {
  return Promise.all(items.map(async (item) => {
    try {
      const solutionResults = (await othersApi.workflowInstanceRuntime(item.id))?.form?.solutionResults || []
      const solutionResult = solutionResults[solutionResults.length - 1]?.solutionResult
      return { ...item, lastSolutionResult: formatSolutionResult(solutionResult) }
    }
    catch {
      return item
    }
  }))
}

function formatSolutionResult(value) {
  if (Number(value) === 1)
    return '已恢复，保持观察'
  if (Number(value) === 2)
    return '未恢复，另行安排'
  return ''
}

function openWorkOrder(instanceId) {
  uni.navigateTo({ url: `/pages-sub/maintenance/maintenance?instanceId=${instanceId}` })
}

onLoad((options) => {
  filter.value = ['pending', 'processed', 'all'].includes(options?.filter) ? options.filter : 'all'
})

onShow(async () => {
  await uni.$onLaunched
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
@import './scss/list.scss';

.solution-result-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 2px;
  background: #fff7e6;
  color: #f57f00 !important;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  width: fit-content;
}
</style>
