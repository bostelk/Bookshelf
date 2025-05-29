<template>
  <div class="pb-16 h-screen overflow-hidden">
    <div class="px-4">
      <h1 class="text-2xl font-bold mb-1">Bookshelf</h1>
    </div>
    <div
      class="border-gray-200"
      style="border-bottom-style: solid; border-bottom-width: 0.8px"
    ></div>
    <div class="px-4 py-2 h-screen overflow-y-auto pb-25">
      <RouterView />
    </div>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>
