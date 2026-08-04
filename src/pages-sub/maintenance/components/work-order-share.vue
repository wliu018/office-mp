<template>
  <view class="work-order-share">
    <wd-button type="primary" custom-class="share-work-order-button" custom-style="background: #05f;" :loading="generating" @click="previewShareImage">
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
  finishInfo: { type: Object, default: null },
  finishPhotos: { type: Array, default: () => [] },
  workOrderId: { type: [String, Number], default: '' },
  createdAt: { type: String, default: '' },
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

function drawImageAspectFit(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height)
  const imageWidth = image.width * scale
  const imageHeight = image.height * scale
  ctx.drawImage(image, x + (width - imageWidth) / 2, y + (height - imageHeight) / 2, imageWidth, imageHeight)
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

function render(ctx, draw, onsitePhotoImagesByGroup, finishPhotoImages) {
  let y = padding
  const lineHeight = 36
  const textAreaLineHeight = 42
  const textAreaPaddingX = 40
  const textAreaPaddingTop = 48
  const textAreaPaddingBottom = 28
  const textAreaContentWidth = contentWidth - 48 - textAreaPaddingX * 2
  const cardGap = 24
  const shareGroups = props.historyGroups
    .map(group => ({ ...group, solutionResults: (group.solutionResults || []).filter(isShareableResult) }))
    .filter(group => group.nodeCode === 'ONSITE_ARRIVE' || group.solutionResults.length)

  function text(lines, x, top, color, shouldDraw) {
    if (shouldDraw) {
      ctx.fillStyle = color
      lines.forEach((line, index) => ctx.fillText(line, x, top + index * lineHeight))
    }
    return lines.length * lineHeight
  }

  function textArea(lines, shouldDraw) {
    const areaHeight = textAreaPaddingTop + (lines.length - 1) * textAreaLineHeight + textAreaPaddingBottom
    if (shouldDraw) {
      roundedRect(ctx, padding + 24, y, contentWidth - 48, areaHeight, 12)
      ctx.fillStyle = '#F7F8FC'
      ctx.fill()
      ctx.fillStyle = '#4D586B'
      lines.forEach((line, index) => ctx.fillText(line, padding + 24 + textAreaPaddingX, y + textAreaPaddingTop + index * textAreaLineHeight))
    }
    y += areaHeight
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

  function maintenancePhotos(images, shouldDraw) {
    if (!images.length)
      return
    const photoSize = (contentWidth - 72) / 2
    y += 20
    images.forEach((image, index) => {
      const x = padding + 24 + (index % 2) * (photoSize + 24)
      if (shouldDraw)
        drawImageAspectFit(ctx, image, x, y, photoSize, photoSize)
      if (index % 2 === 1 || index === images.length - 1)
        y += photoSize + 18
    })
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
    ctx.font = 'bold 34px sans-serif'
    ctx.fillText(`${props.form.projectName || '-'} - 维保单`, padding + 28, y + 54)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
    ctx.font = '20px sans-serif'
    ctx.fillText(`创建时间：${formatTime(props.createdAt)}`, padding + 28, y + 96)
    ctx.fillText(`分享时间：${shareTime.value || '-'}`, padding + 28, y + 128)
  }
  y += 194

  card('工单信息', (shouldDraw) => {
    const fields = [
      ['维保单编号', props.workOrderId],
      ['项目', props.form.projectName],
      ['联系人', props.form.contactName],
      ['联系电话', props.form.contactPhone],
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
    const lines = wrapText(ctx, props.form.faultDescription, textAreaContentWidth)
    textArea(lines, shouldDraw)
  }, '#5468F2')

  let onsiteIndex = 0
  shareGroups.forEach((group) => {
    if (group.nodeCode === 'ONSITE_ARRIVE') {
      const onsitePhotoImages = onsitePhotoImagesByGroup[onsiteIndex++] || []
      const title = Number(group.roundNo) > 1 ? `维保上门（第${group.roundNo}轮）` : '维保上门'
      card(title, (shouldDraw) => {
        if (shouldDraw) {
          ctx.fillStyle = '#4D586B'
          ctx.font = '24px sans-serif'
          ctx.fillText(`维保人：${group.handlerUserName || '-'}`, padding + 24, y + 24)
          ctx.fillText(`维保时间：${formatTime(group.createTime)}`, padding + 24, y + 58)
          if (onsitePhotoImages.length) {
            ctx.fillStyle = '#35415A'
            ctx.font = 'bold 26px sans-serif'
            ctx.fillText('维保前照片', padding + 24, y + 108)
          }
        }
        y += onsitePhotoImages.length ? 128 : 78
        maintenancePhotos(onsitePhotoImages, shouldDraw)
      }, '#36BD69')
      return
    }
    card((group.label || '流程节点').replace(/（第\d+轮）$/, ''), (shouldDraw) => {
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
          if (group.key === props.finishInfo?.key) {
            if (shouldDraw) {
              ctx.fillStyle = '#4D586B'
              ctx.font = '24px sans-serif'
              ctx.fillText(`维保人：${props.finishInfo.handlerUserName || '-'}`, padding + 24, y + 24)
              ctx.fillText(`维保时间：${formatTime(props.finishInfo.createTime)}`, padding + 24, y + 58)
            }
            y += 78
          }
          if (shouldDraw) {
            ctx.fillStyle = '#35415A'
            ctx.font = 'bold 26px sans-serif'
            ctx.fillText('处理备注', padding + 24, y + 24)
          }
          y += 44
          ctx.font = '26px sans-serif'
          const lines = wrapText(ctx, item.solutionRemark, textAreaContentWidth)
          textArea(lines, shouldDraw)
          if (group.key === props.finishInfo?.key && finishPhotoImages.length) {
            maintenancePhotos(finishPhotoImages, shouldDraw)
          }
        }
      })
    }, '#8B5CF6')
  })

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
    const onsiteGroups = props.historyGroups.filter(group => group.nodeCode === 'ONSITE_ARRIVE')
    const onsitePhotoImagesByGroup = await Promise.all(onsiteGroups.map(async group => (
      await Promise.all((group.files || []).map(file => loadImage(canvasInstance, file.url))).then(images => images.filter(Boolean))
    )))
    const finishPhotoImages = (
      await Promise.all(props.finishPhotos.map(source => loadImage(canvasInstance, source)))
    ).filter(Boolean)
    const pixelRatio = Math.min(3, Math.max(1, uni.getSystemInfoSync().pixelRatio || 1))
    const height = Math.ceil(render(ctx, false, onsitePhotoImagesByGroup, finishPhotoImages))
    canvasInstance.width = width * pixelRatio
    canvasInstance.height = height * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)
    render(ctx, true, onsitePhotoImagesByGroup, finishPhotoImages)
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
