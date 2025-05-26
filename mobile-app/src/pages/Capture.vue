<template>
  <div class="flex flex-col items-center justify-center h-full px-4">
    <h1 class="text-2xl font-bold mb-4">Capture Page</h1>

    <input
      v-if="!processedImage"
      type="file"
      accept="image/*"
      @change="handleFileChange"
      class="mb-4 border bg-gray-300 p-2 rounded cursor-pointer"
    />

    <div v-if="loading" class="flex flex-col items-center mt-4">
      <svg
        class="animate-spin h-8 w-8 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <p class="mt-2 text-gray-500">Processing image...</p>
    </div>

    <div v-if="processedImage" class="mt-6">
      <h2 class="text-lg font-semibold mb-2">Processed Image:</h2>
      <img :src="processedImage" alt="Processed" class="max-w-xs rounded border" />
      <div v-if="processedImage" class="mt-6 flex flex-col items-center">
        <div class="flex space-x-4">
          <button
            @click="addToShelf"
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add to Shelf
          </button>
          <button @click="reset" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const processedImage = ref<string | null>(null)

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  loading.value = true
  processedImage.value = null

  const reader = new FileReader()
  reader.onload = async () => {
    if (typeof reader.result === 'string') {
      const image = new Image()
      image.onload = async () => {
        processedImage.value = await onPostProcess(image)
        loading.value = false
      }
      image.src = reader.result
    }
  }
  reader.readAsDataURL(file)
}

// Placeholder function to tint image blue using canvas
const onPostProcess = async (image: HTMLImageElement): Promise<string> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (canvas && ctx) {
    canvas.width = image.width
    canvas.height = image.height

    // Draw image first
    ctx.drawImage(image, 0, 0)

    // Apply a blue tint overlay
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)' // semi-transparent blue
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Return base64 image
    return canvas.toDataURL('image/png')
  } else {
    return ''
  }
}

const addToShelf = () => {
  // Placeholder for functionality to add the processed image to a shelf
  alert('Image added to shelf!')
}

const reset = () => {
  processedImage.value = null
  loading.value = false
}
</script>
