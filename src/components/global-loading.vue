<template>
  <div v-if="show" class="loading-silkroad">
    <div class="inner">
      <div>
        <image
          class="loading-image" mode="heightFix"
          src="/static/images/loading/b_logo.svg" alt="logo-1"
        />
      </div>
      <span class="span-loading" />
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
.loading-silkroad {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.98);
  z-index: 999;
}
.loading-silkroad > .inner {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}
.loading-silkroad .loading-image {
  height: 45px;
  width: auto;
  margin-bottom: 15px;
}
.loading-silkroad .span-loading {
  position: relative;
  display: block;
  width: 100%;
  height: 1px;
  margin: 0 auto;
  overflow: hidden;
}

.loading-silkroad .span-loading:before {
  background: transparent;
  left: 0;
}

.loading-silkroad .span-loading:after,
.loading-silkroad .span-loading:before {
  content: '';
  width: 100%;
  height: 1px;
  position: absolute;
  bottom: 0;
}

.loading-silkroad .span-loading:after {
  background: #99999999;
  background: linear-gradient(115deg, #3d7dfe 8.4%, #6a59fe 52.29%, #9142ff 93.72%);
  left: -100%;
  animation: loading-silkroad 1s cubic-bezier(0.77, 0, 0.175, 1) infinite 0.2s;
  animation-fill-mode: both;
}

@keyframes loading-silkroad {
  0% {
    left: -100%;
  }

  to {
    left: 100%;
  }
}
</style>
