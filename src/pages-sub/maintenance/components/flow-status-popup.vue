<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; overflow: hidden;">
    <view class="flow-popup">
      <view class="flow-popup__stage">
        <f6-canvas
          v-if="visible"
          :width="canvasWidth"
          :height="canvasHeight"
          :pixel-ratio="pixelRatio"
          @on-init="onCanvasInit"
          @on-touch-event="onTouchEvent"
        />
      </view>
    </view>
  </wd-popup>
</template>

<script setup>
import F6 from '@antv/f6'
import { computed, ref, watch } from 'vue'
import F6Canvas from '@/components/f6-canvas.vue'

const props = defineProps({ modelValue: Boolean, runtime: { type: Object, default: () => ({}) } })
const emit = defineEmits(['update:modelValue'])
const visible = ref(false)
const systemInfo = uni.getSystemInfoSync()
const canvasWidth = ref(systemInfo.windowWidth)
const coverHeight = 52
const popupHeight = Math.round(systemInfo.windowHeight * 2 / 3)
const canvasHeight = ref(Math.max(1, popupHeight))
const pixelRatio = ref(systemInfo.pixelRatio || 1)
const graphItems = computed(() => {
  const nodes = [...(props.runtime?.nodes || [])].sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
  const nodesById = new Map(nodes.map(node => [String(node.nodeId || node.id), node]))
  const nodesByCode = new Map(nodes.map(node => [node.nodeCode || node.nodeType, node]))
  const actionNameMap = { START: '启动', ASSIGN: '指派', SUBMIT: '提交', TRANSFER: '转派', PASS: '通过', RETURN: '退回', ARCHIVE: '归档' }
  const archived = props.runtime?.instance?.status === 'ARCHIVED'
  const currentNodeId = String(props.runtime?.instance?.currentNodeId || '')
  const visitedNodeIds = new Set()
  const actionItems = (props.runtime?.actionLogs || []).map((log, index) => {
    const node = nodesById.get(String(log.nodeId)) || nodesByCode.get(log.nodeCode || log.nodeType)
    if (node)
      visitedNodeIds.add(String(node.nodeId || node.id))
    return {
      id: `action-${log.id || index}`,
      label: node?.nodeName || log.nodeName || log.nodeCode || '流程节点',
      action: actionNameMap[log.actionType] || log.actionType || '已执行',
      handler: log.handlerUserName || '已处理',
      time: log.createTime || '暂无处理时间',
      rounds: log.roundNo || 1,
      status: 'done',
    }
  })
  const currentNode = !archived && nodes.find(node => node.current || String(node.nodeId || node.id) === currentNodeId)
  if (currentNode) {
    actionItems.push({
      id: `current-${currentNode.nodeId || currentNode.id}`,
      label: currentNode.nodeName || currentNode.nodeCode || '流程节点',
      action: '当前动作',
      handler: '处理中',
      time: '等待处理',
      rounds: 1,
      status: 'current',
    })
  }
  const pendingItems = nodes
    .filter(node => !visitedNodeIds.has(String(node.nodeId || node.id)) && node !== currentNode)
    .map((node, index) => ({
      id: `pending-${node.nodeId || node.id || index}`,
      label: node.nodeName || node.nodeCode || '流程节点',
      action: '待流转',
      handler: '待处理',
      time: '尚未流转',
      rounds: 1,
      status: 'pending',
    }))
  return [...actionItems, ...pendingItems]
})
let graph
let registered = false
let initialRenderTimer
let edgeAnimationTimer

function registerWorkflowCard() {
  if (registered)
    return
  registered = true
  F6.registerNode('workflow-card', {
    draw(cfg, group) {
      const [width, height] = cfg.size || [250, 112]
      const color = cfg.status === 'done' ? '#52c41a' : cfg.status === 'current' ? '#3d7dfe' : '#cbd5e1'
      const fill = cfg.status === 'done' ? '#fff' : cfg.status === 'current' ? '#f7faff' : '#fbfcfe'
      const card = group.addShape('rect', { attrs: { x: -width / 2, y: -height / 2, width, height, radius: 10, fill, stroke: color, lineWidth: cfg.status === 'current' ? 2 : 1, lineDash: cfg.status === 'pending' ? [5, 4] : undefined, shadowColor: 'rgba(31, 41, 55, 0.10)', shadowBlur: 10, shadowOffsetY: 4 }, name: 'card' })
      group.addShape('rect', { attrs: { x: -width / 2, y: -height / 2, width: 4, height, radius: [10, 0, 0, 10], fill: color }, name: 'status-bar' })
      group.addShape('text', { attrs: { x: -width / 2 + 16, y: -height / 2 + 20, text: cfg.label, fill: '#1f2937', fontSize: 15, fontWeight: 600, textBaseline: 'middle' }, name: 'title' })
      group.addShape('text', { attrs: { x: -width / 2 + 16, y: -height / 2 + 44, text: cfg.action, fill: color, fontSize: 12, fontWeight: 600, textBaseline: 'middle' }, name: 'action' })
      group.addShape('text', { attrs: { x: width / 2 - 16, y: -height / 2 + 44, text: cfg.handler, fill: '#7b8798', fontSize: 11, textAlign: 'right', textBaseline: 'middle' }, name: 'handler' })
      group.addShape('text', { attrs: { x: -width / 2 + 16, y: -height / 2 + 65, text: `第${cfg.rounds || 1}轮 · ${cfg.time}`, fill: '#98a2b3', fontSize: 11, textBaseline: 'middle' }, name: 'time' })
      group.addShape('rect', { attrs: { x: -width / 2 + 16, y: height / 2 - 30, width: 48, height: 18, radius: 4, fill: cfg.status === 'pending' ? '#f1f5f9' : cfg.status === 'current' ? '#e7f0ff' : '#edf9e9', stroke: cfg.status === 'pending' ? '#e2e8f0' : cfg.status === 'current' ? '#cfe0ff' : '#d5f0cc', lineWidth: 1 }, name: 'tag' })
      group.addShape('text', { attrs: { x: -width / 2 + 40, y: height / 2 - 21, text: cfg.status === 'pending' ? '待流转' : cfg.status === 'current' ? '当前动作' : '已执行', fill: cfg.status === 'pending' ? '#7b8798' : color, fontSize: 10, textAlign: 'center', textBaseline: 'middle' }, name: 'tag-text' })
      return card
    },
  }, 'rect')
}

function getGraphData() {
  const nodeWidth = 250
  const nodeHeight = 112
  const columnGap = 90
  const rowGap = 110
  const leftX = nodeWidth / 2 + 32
  const rightX = leftX + nodeWidth + columnGap
  const items = graphItems.value
  const nodes = items.map((item, index) => {
    const row = Math.floor(index / 2)
    const onLeft = row % 2 === 0 ? index % 2 === 0 : index % 2 !== 0
    return { ...item, type: 'workflow-card', size: [nodeWidth, nodeHeight], x: onLeft ? leftX : rightX, y: nodeHeight / 2 + 32 + row * (nodeHeight + rowGap), anchorPoints: [[0.5, 0], [0.5, 1]] }
  })
  return {
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => {
      const target = nodes[index + 1]
      const flowing = node.status === 'done' && target.status === 'current'
      return {
        id: `edge-${node.id}-${target.id}`,
        source: node.id,
        target: target.id,
        type: 'polyline',
        sourceAnchor: 1,
        targetAnchor: 0,
        flowing,
        style: {
          stroke: target.status === 'done' ? '#52c41a' : target.status === 'current' ? '#3d7dfe' : '#cbd5e1',
          lineWidth: flowing ? 2 : 1.5,
          lineDash: flowing ? [8, 6] : undefined,
          endArrow: { path: F6.Arrow.triangle(6, 8, 0), fill: '#94a3b8' },
        },
      }
    }),
  }
}

function stopEdgeAnimation() {
  clearInterval(edgeAnimationTimer)
  edgeAnimationTimer = undefined
}

function startEdgeAnimation() {
  stopEdgeAnimation()
  const flowingEdge = graph?.getEdges?.().find(item => item.getModel?.().flowing)
  if (!flowingEdge)
    return
  const shape = flowingEdge.getKeyShape?.()
  if (!shape)
    return
  let offset = 0
  edgeAnimationTimer = setInterval(() => {
    if (!graph || graph.destroyed) {
      stopEdgeAnimation()
      return
    }
    offset = (offset + 2) % 14
    shape.attr({ lineDash: [8, 6], lineDashOffset: -offset })
    graph.paint()
  }, 120)
}

function drawToolbar() {
  const uiGroup = graph?.get('uiGroup')
  if (!uiGroup)
    return
  uiGroup.clear()
  uiGroup.addShape('rect', { attrs: { x: 0, y: 0, width: canvasWidth.value, height: coverHeight, fill: '#fff' } })
  uiGroup.addShape('line', { attrs: { x1: 0, y1: coverHeight - 1, x2: canvasWidth.value, y2: coverHeight - 1, stroke: '#edf0f5' } })
  const legend = [
    ['#52c41a', '已执行', 16],
    ['#3d7dfe', '当前动作', 78],
    ['#cbd5e1', '待流转', 158],
  ]
  legend.forEach(([color, text, x]) => {
    uiGroup.addShape('circle', { attrs: { x, y: 25, r: 3.5, fill: color } })
    uiGroup.addShape('text', { attrs: { x: x + 10, y: 25, text, fill: '#667085', fontSize: 12, textBaseline: 'middle' } })
  })
  const closeX = canvasWidth.value - 76
  uiGroup.addShape('rect', { attrs: { x: closeX, y: 10, width: 64, height: 32, radius: 16, fill: '#edf4ff' } })
  uiGroup.addShape('text', { attrs: { x: closeX + 32, y: 26, text: '关闭', fill: '#2563eb', fontSize: 14, textAlign: 'center', textBaseline: 'middle' } })
}

function isCloseTouch(event) {
  const touch = event?.changedTouches?.[0] || event?.touches?.[0]
  const x = touch?.x ?? touch?.clientX
  const y = touch?.y ?? touch?.clientY
  return x >= canvasWidth.value - 76 && x <= canvasWidth.value - 12 && y >= 10 && y <= 42
}

function onCanvasInit(event) {
  const { ctx, renderer } = event.detail || event
  if (!ctx)
    return
  registerWorkflowCard()
  graph?.destroy()
  graph = new F6.Graph({
    container: null,
    context: ctx,
    renderer,
    width: canvasWidth.value,
    height: canvasHeight.value,
    pixelRatio: pixelRatio.value,
    fitView: true,
    fitViewPadding: [80, 28, 28, 28],
    modes: {
      default: [
        { type: 'drag-canvas', allowDragOnItem: true, scalableRange: 240 },
        { type: 'zoom-canvas', minZoom: 0.45, maxZoom: 2.5 },
      ],
    },
    defaultEdge: { type: 'polyline' },
  })
  graph.data(getGraphData())
  graph.render()
  drawToolbar()
  startEdgeAnimation()
  clearTimeout(initialRenderTimer)
  initialRenderTimer = setTimeout(() => {
    if (!graph || graph.destroyed)
      return
    graph.refresh()
    graph.fitView(28)
    graph.paint()
  }, 80)
}

function onTouchEvent(event) {
  const touchEvent = event?.detail?.type ? event.detail : event
  if (typeof touchEvent?.type !== 'string')
    return
  if (isCloseTouch(touchEvent)) {
    if (touchEvent.type === 'touchend')
      closeFlowPopup()
    return
  }
  graph?.emitEvent(touchEvent)
}

function closeFlowPopup() {
  visible.value = false
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (value) => {
  visible.value = value
  if (!value) {
    clearTimeout(initialRenderTimer)
    stopEdgeAnimation()
    graph?.destroy()
    graph = undefined
  }
})
watch(visible, value => emit('update:modelValue', value))
</script>

<style lang="scss" scoped>
.flow-popup {
  height: 66.6667vh;
  overflow: hidden;
  border-radius: 24rpx 24rpx 0 0;
  background: #fff;
}
.flow-popup__stage {
  position: relative;
  height: 66.6667vh;
  background-color: #fff;
  background-image: radial-gradient(#d7e4f6 1px, transparent 1px);
  background-size: 16px 16px;
}
</style>
