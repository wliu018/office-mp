<script setup>
defineProps({
  weather: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="weather-card">
    <image v-if="weather.icon" class="weather-icon" :src="`/static/images/weather/W${weather.icon}.png`" mode="aspectFit" />
    <wd-icon v-else class="weather-icon weather-icon-fallback" name="cloud" size="16px" color="#666" />
    <span v-if="weather.city" class="weather-city">{{ weather.city }}</span>
    <span v-if="weather.temp !== ''" class="weather-temp">{{ weather.temp }}°</span>
    <span>{{ weather.condition }}</span>
  </div>
</template>

<style scoped lang="scss">
.weather-card {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  height: 25px;
  margin: 2px 24px 2px auto;
  color: #666;
  font-size: 12px;
}

.weather-city {
  max-width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  filter: drop-shadow(1px 0 0 rgba(0, 0, 0, 0.35)) drop-shadow(-1px 0 0 rgba(0, 0, 0, 0.35))
    drop-shadow(0 1px 0 rgba(0, 0, 0, 0.35)) drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.35));
}

.weather-icon-fallback {
  filter: none;
}

.weather-temp {
  color: #333;
  font-size: 15px;
  font-weight: 700;
}
</style>
