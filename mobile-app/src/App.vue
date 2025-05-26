<template>
  <div class="pb-16 h-screen overflow-hidden">
    <RouterView />
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>
