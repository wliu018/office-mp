<template>
  <canvas
    :id="canvasId"
    type="2d"
    :style="{ position: 'absolute', top: `${top}px`, left: '0', width: `${width}px`, height: `${height}px` }"
    @touchstart="emitTouch"
    @touchmove="emitTouch"
    @touchend="emitTouch"
    @touchcancel="emitTouch"
  />
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted } from 'vue'

const props = defineProps({ width: Number, height: Number, top: { type: Number, default: 0 }, pixelRatio: Number })
const emit = defineEmits(['onInit', 'onTouchEvent'])
const instance = getCurrentInstance()
const canvasId = `f6-canvas-${instance.uid}`

function normalizeTouch(touch) {
  touch.clientX = touch.x
  touch.clientY = touch.y
  touch.pageX = touch.x
  touch.pageY = touch.y
}

function emitTouch(event) {
  ;[...(event.touches || []), ...(event.changedTouches || [])].forEach(normalizeTouch)
  emit('onTouchEvent', event)
}

onMounted(async () => {
  await nextTick()
  uni.createSelectorQuery().in(instance.proxy).select(`#${canvasId}`).fields({ node: true, size: true }).exec((result) => {
    const canvas = result?.[0]?.node
    if (!canvas)
      return
    const pixelRatio = Math.max(1, Math.ceil(props.pixelRatio || 1))
    canvas.width = props.width * pixelRatio
    canvas.height = props.height * pixelRatio
    emit('onInit', { ctx: canvas.getContext('2d'), canvas, renderer: 'mini-native' })
  })
})
</script>
