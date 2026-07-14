<template>
  <view class="work-order-share">
    <wd-button type="primary" custom-class="share-work-order-button" :loading="generating" @click="previewShareImage">
      分享工单
    </wd-button>
    <canvas :id="canvasId" type="2d" class="share-canvas" />
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, ref } from 'vue'

const props = defineProps({
  form: { type: Object, default: () => ({}) },
  historyGroups: { type: Array, default: () => [] },
  createdAt: { type: String, default: '' },
  miniappCode: { type: String, default: '' },
})

const instance = getCurrentInstance()
const canvasId = `work-order-share-${instance.uid}`
const generating = ref(false)
const width = 750
const padding = 32
const contentWidth = width - padding * 2
const shareTime = ref('')
let canvas

function loadImage(canvasInstance, source) {
  if (!source)
    return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = canvasInstance.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = source
  })
}

function getCanvas() {
  if (canvas)
    return Promise.resolve(canvas)
  return new Promise((resolve, reject) => {
    uni.createSelectorQuery().in(instance.proxy).select(`#${canvasId}`).fields({ node: true }).exec((result) => {
      canvas = result?.[0]?.node
      if (canvas)
        resolve(canvas)
      else
        reject(new Error('canvas unavailable'))
    })
  })
}

function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapText(ctx, value, maxWidth) {
  const lines = []
  String(value || '-').split('\n').forEach((paragraph) => {
    let line = ''
    for (const char of paragraph || '-') {
      if (ctx.measureText(line + char).width > maxWidth && line) {
        lines.push(line)
        line = char
      }
      else {
        line += char
      }
    }
    if (line)
      lines.push(line)
  })
  return lines
}

function isShareableResult(item) {
  return Number(item?.solutionResult) === 1
    || Number(item?.solutionResult) === 2
    || Boolean(String(item?.solutionRemark || '').trim())
}

function formatTime(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value))
    return value
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime()))
    return '-'
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function render(ctx, draw, miniappCodeImage) {
  let y = padding
  const lineHeight = 36
  const cardGap = 24
  const groups = props.historyGroups
    .map(group => ({ ...group, solutionResults: (group.solutionResults || []).filter(isShareableResult) }))
    .filter(group => group.solutionResults.length)

  function text(lines, x, top, color, shouldDraw) {
    if (shouldDraw) {
      ctx.fillStyle = color
      lines.forEach((line, index) => ctx.fillText(line, x, top + index * lineHeight))
    }
    return lines.length * lineHeight
  }

  function card(title, body, accent) {
    const start = y
    y += 66
    const bodyStart = y
    body(false)
    y += 30
    const end = y
    if (draw) {
      ctx.save()
      ctx.shadowColor = 'rgba(47, 61, 113, 0.12)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 8
      roundedRect(ctx, padding, start, contentWidth, end - start, 20)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()
      roundedRect(ctx, padding, start, 10, end - start, 10)
      ctx.fillStyle = accent
      ctx.fill()
      ctx.font = 'bold 25px sans-serif'
      const pillWidth = Math.max(138, ctx.measureText(title).width + 42)
      roundedRect(ctx, padding + 24, start + 20, pillWidth, 38, 19)
      ctx.fillStyle = `${accent}18`
      ctx.fill()
      ctx.fillStyle = accent
      ctx.fillText(title, padding + 45, start + 47)
      y = bodyStart
      body(true)
      y = end
    }
    y += cardGap
  }

  if (draw) {
    const background = ctx.createLinearGradient(0, 0, width, 900)
    background.addColorStop(0, '#EEF2FF')
    background.addColorStop(0.48, '#F8FAFF')
    background.addColorStop(1, '#F4F7FC')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, 20000)
    const header = ctx.createLinearGradient(0, 0, width, 170)
    header.addColorStop(0, '#3D7DFE')
    header.addColorStop(0.55, '#6A59FE')
    header.addColorStop(1, '#9142FF')
    roundedRect(ctx, padding, y, contentWidth, 170, 24)
    ctx.fillStyle = header
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
    ctx.beginPath()
    ctx.arc(width - 116, y + 36, 66, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 38px sans-serif'
    ctx.fillText('维保工单', padding + 28, y + 54)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
    ctx.font = '20px sans-serif'
    ctx.fillText(`创建时间：${formatTime(props.createdAt)}`, padding + 28, y + 96)
    ctx.fillText(`分享时间：${shareTime.value || '-'}`, padding + 28, y + 128)
  }
  y += 194

  card('工单信息', (shouldDraw) => {
    const fields = [
      ['项目', props.form.projectName],
      ['联系人', props.form.contactName],
      ['联系电话', props.form.contactPhone],
      ['联系人说明', props.form.contactRemark],
    ]
    fields.forEach(([label, value]) => {
      ctx.font = '22px sans-serif'
      const labelWidth = Math.max(102, Math.ceil(ctx.measureText(label).width) + 32)
      const valueX = padding + 24 + labelWidth + 24
      ctx.font = '26px sans-serif'
      const lines = wrapText(ctx, value, padding + contentWidth - valueX)
      if (shouldDraw) {
        roundedRect(ctx, padding + 24, y + 2, labelWidth, 34, 17)
        ctx.fillStyle = '#F0F3FA'
        ctx.fill()
        ctx.fillStyle = '#7B879D'
        ctx.font = '22px sans-serif'
        ctx.fillText(label, padding + 24 + (labelWidth - ctx.measureText(label).width) / 2, y + 25)
        ctx.font = '26px sans-serif'
      }
      text(lines, valueX, y + 25, '#202938', shouldDraw)
      y += Math.max(lineHeight, lines.length * lineHeight) + 14
    })
    if (shouldDraw) {
      ctx.fillStyle = '#35415A'
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText('故障描述', padding + 24, y + 24)
    }
    y += 44
    ctx.font = '26px sans-serif'
    const lines = wrapText(ctx, props.form.faultDescription, contentWidth - 80)
    if (shouldDraw) {
      roundedRect(ctx, padding + 24, y, contentWidth - 48, lines.length * lineHeight + 24, 12)
      ctx.fillStyle = '#F7F8FC'
      ctx.fill()
    }
    text(lines, padding + 40, y + 28, '#4D586B', shouldDraw)
    y += lines.length * lineHeight + 6
  }, '#5468F2')

  groups.forEach((group) => {
    card(group.label || '流程节点', (shouldDraw) => {
      group.solutionResults.forEach((item, index) => {
        if (index)
          y += 18
        if (Number(item.solutionResult) === 1 || Number(item.solutionResult) === 2) {
          const recovered = Number(item.solutionResult) === 1
          const result = item.resultText || (recovered ? '已恢复，保持观察' : '未恢复，另行安排')
          ctx.font = '26px sans-serif'
          const lines = wrapText(ctx, result, contentWidth - 190)
          if (shouldDraw) {
            roundedRect(ctx, padding + 24, y, 112, 36, 18)
            ctx.fillStyle = recovered ? '#E8F8EF' : '#FFF1ED'
            ctx.fill()
            ctx.fillStyle = recovered ? '#1F9D5C' : '#E76A4D'
            ctx.font = '22px sans-serif'
            ctx.fillText('处理结果', padding + 42, y + 26)
            ctx.font = '26px sans-serif'
          }
          text(lines, padding + 154, y + 26, recovered ? '#238453' : '#C4573D', shouldDraw)
          y += Math.max(lineHeight, lines.length * lineHeight) + 14
        }
        if (String(item.solutionRemark || '').trim()) {
          if (shouldDraw) {
            ctx.fillStyle = '#35415A'
            ctx.font = 'bold 26px sans-serif'
            ctx.fillText('处理备注', padding + 24, y + 24)
          }
          y += 44
          ctx.font = '26px sans-serif'
          const lines = wrapText(ctx, item.solutionRemark, contentWidth - 80)
          if (shouldDraw) {
            roundedRect(ctx, padding + 24, y, contentWidth - 48, lines.length * lineHeight + 24, 12)
            ctx.fillStyle = '#F7F8FC'
            ctx.fill()
          }
          text(lines, padding + 40, y + 28, '#4D586B', shouldDraw)
          y += lines.length * lineHeight + 6
        }
      })
    }, '#8B5CF6')
  })

  if (miniappCodeImage) {
    const codeSize = 180
    y += 20
    if (draw) {
      ctx.fillStyle = '#35415A'
      ctx.font = '24px sans-serif'
      const label = '维保工单码'
      ctx.fillText(label, (width - ctx.measureText(label).width) / 2, y + 24)
      ctx.drawImage(miniappCodeImage, (width - codeSize) / 2, y + 46, codeSize, codeSize)
    }
    y += codeSize + 70
  }

  return y - cardGap + padding
}

function exportImage(canvasInstance, pixelRatio, height) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas: canvasInstance,
      fileType: 'jpg',
      quality: 0.9,
      destWidth: width * pixelRatio,
      destHeight: height * pixelRatio,
      success: result => resolve(result.tempFilePath),
      fail: reject,
    })
  })
}

async function previewShareImage() {
  if (generating.value)
    return
  generating.value = true
  try {
    await nextTick()
    shareTime.value = formatTime(new Date())
    const canvasInstance = await getCanvas()
    const ctx = canvasInstance.getContext('2d')
    const miniappCodeImage = await loadImage(canvasInstance, props.miniappCode)
    const pixelRatio = Math.min(3, Math.max(1, uni.getSystemInfoSync().pixelRatio || 1))
    const height = Math.ceil(render(ctx, false, miniappCodeImage))
    canvasInstance.width = width * pixelRatio
    canvasInstance.height = height * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)
    render(ctx, true, miniappCodeImage)
    const path = await exportImage(canvasInstance, pixelRatio, height)
    uni.previewImage({ urls: [path], current: path })
  }
  catch (error) {
    uni.showToast({ title: '图片生成失败，请稍后重试', icon: 'none' })
  }
  finally {
    generating.value = false
  }
}
</script>

<style scoped>
.work-order-share {
  display: flex;
  justify-content: center;
}

.share-canvas {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
}
</style>
