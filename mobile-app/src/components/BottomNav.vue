<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16">
    <RouterLink to="/capture" class="flex flex-col items-center text-sm">
      <CameraIcon :class="[isActive('/capture') ? 'text-blue-500' : 'text-gray-400']" class="h-6 w-6" />
      <span>Capture</span>
    </RouterLink>
    <RouterLink to="/shelf" class="flex flex-col items-center text-sm">
      <BookOpenIcon :class="[isActive('/shelf') ? 'text-blue-500' : 'text-gray-400']" class="h-6 w-6" />
      <span>Shelf</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { CameraIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const isActive = (path) => route.path === path
</script>
