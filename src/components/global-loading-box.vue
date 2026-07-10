<template>
  <div v-show="show" class="loader-wrapper pointer-events-none fixed inset-0 z-5000 h-100vh w-100vw flex items-center justify-center bg-[rgba(255,255,255,0.5)]">
    <div class="loader">
      <div class="shadow" />
      <div class="box" />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: false,
    default: false,
  },
})
</script>

<style scoped lang="scss">
.loader-wrapper {
  backdrop-filter: blur(4px);
}
.loader {
  position: absolute;
  top: calc(50% - 20px);
  left: calc(50% - 20px);
}

.box {
  width: 40px;
  height: 40px;
  background: linear-gradient(270deg, rgba(43, 64, 253, 0.36) 0%, rgba(150, 106, 255, 0.36) 100%);
  background: rgba(67, 67, 67, 0.7);
  animation: animate 0.5s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 3px;
}

.shadow {
  width: 40px;
  height: 5px;
  background: #000;
  opacity: 0.1;
  position: absolute;
  top: 49px;
  left: 0;
  border-radius: 50%;
  animation: shadow 0.5s linear infinite;
}
@keyframes shadow {
  50% {
    transform: scale(1.2, 1);
  }
}
@keyframes loader {
  0% {
    left: -100px;
  }
  100% {
    left: 110%;
  }
}
@keyframes animate {
  17% {
    border-bottom-right-radius: 3px;
  }
  25% {
    transform: translateY(9px) rotate(22.5deg);
  }
  50% {
    transform: translateY(18px) scale(1, 0.9) rotate(45deg);
    border-bottom-right-radius: 40px;
  }
  75% {
    transform: translateY(9px) rotate(67.5deg);
  }
  100% {
    transform: translateY(0) rotate(90deg);
  }
}
</style>
