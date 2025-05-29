<template>
  <div class="">
    <h1 class="text-2xl font-bold">Scan your books</h1>
    <p class="text-gray-500">Scan and create your own personal digital library.</p>
    <br />
    <button
      class="bg-black hover:bg-white border-1 hover:text-black text-white font-bold py-2 px-4 rounded"
      @click="showPicker"
    >
      Scan
    </button>
  </div>
  <div class="flex flex-col items-center justify-center h-full px-4">
    <input
      v-if="!processedImage"
      ref="camera-file-picker"
      class="hidden"
      type="file"
      accept="image/*"
      capture="environment"
      @change="handleFileChange"
    />

    <div v-if="loading" class="flex flex-col items-center mt-4">
      <svg
        class="animate-spin h-8 w-8 text-black"
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
            class="bg-black hover:bg-white border-1 hover:text-black text-white font-bold py-2 px-4 rounded"
          >
            Add to Shelf
          </button>
          <button
            @click="reset"
            class="bg-black hover:bg-white border-1 hover:text-black text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

const loading = ref(false)
const processedImage = ref<string | null>(null)
const cameraFilePicker = useTemplateRef('camera-file-picker')
const router = useRouter()

const showPicker = () => {
  cameraFilePicker.value?.showPicker()
}
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

type ImageData = {
  width: number
  height: number
  data: Uint8ClampedArray<ArrayBufferLike>
}

// Placeholder function to tint image blue using canvas
const onPostProcess = async (image: HTMLImageElement): Promise<string> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (canvas && ctx) {
    // Todo: maintain aspect ratio
    canvas.width = 640
    canvas.height = 640

    const imageData = getImageData(ctx, image)

    const response = await fetch(
      (import.meta.env.MODE == 'development' ? '/public/' : '/') + 'onnx/spine.onnx',
    )
    const modelData = await response.arrayBuffer()
    const cpuSession = await runModelUtils.createModelCpu(modelData)
    const session = cpuSession

    await runModelUtils.warmupModel(session, [1, 3, imageSize, imageSize])

    const inputTensor = preprocess(imageData)

    const [outputTensor, inferenceTime] = await runModelUtils.runModel(session, inputTensor)

    await postprocess(ctx, outputTensor, inferenceTime)

    // Return base64 image
    return canvas.toDataURL('image/png')
  } else {
    return ''
  }
}

const addToShelf = () => {
  const newShelf = {title: "My Shelf", image:""};
  newShelf.image = processedImage.value
  shelfs.value.push(newShelf)
  router.push('/shelf')
}

const reset = () => {
  processedImage.value = null
  loading.value = false
}

import ndarray from 'ndarray'
import ops from 'ndarray-ops'
import { runModelUtils, yolo, yoloTransforms } from '../utils/index'
import { Tensor } from 'onnxruntime-web/webgl'
import { EmitFlags } from 'typescript'
import { shelfs } from '../user'

const imageSize = 640 // 416

function preprocess(image: ImageData): Tensor {
  const { data, width, height } = image
  // data processing
  // rbga
  // python bgr
  const dataTensor = ndarray(new Float32Array(data), [width, height, 4])
  const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [1, 3, width, height])

  ops.assign(dataProcessedTensor.pick(0, 0, null, null), dataTensor.pick(null, null, 0))
  ops.assign(dataProcessedTensor.pick(0, 1, null, null), dataTensor.pick(null, null, 1))
  ops.assign(dataProcessedTensor.pick(0, 2, null, null), dataTensor.pick(null, null, 2))

  ops.mulseq(dataProcessedTensor, 1 / 255)

  const tensor = new Tensor('float32', new Float32Array(width * height * 3), [1, 3, width, height])
  ;(tensor.data as Float32Array).set(dataProcessedTensor.data)

  return tensor
}

async function postprocess(ctx: CanvasRenderingContext2D, tensor: Tensor, inferenceTime: number) {
  try {
    const originalOutput = new Tensor('float32', tensor.data as Float32Array, [1, 11, 8400])

    // [1, 11, 8400] to [1, 8400, 11]
    const outputTensor = yoloTransforms.transpose(originalOutput, [0, 2, 1])

    // postprocessing
    const boxes = await yolo.postprocess(outputTensor)
    boxes.forEach((box) => {
      const { top, left, bottom, right, classProb, className } = box
      console.log(`${top} ${left} ${bottom} ${right} ${classProb} ${className}`)
      ctx.beginPath()
      ctx.rect(left, top, right - left, bottom - top)
      ctx.strokeStyle = 'blue'
      ctx.lineWidth = 4
      ctx.stroke()
    })
  } catch (e) {
    console.error(e)
    alert('Model is not valid!')
  }
}

function getImageData(ctx: CanvasRenderingContext2D, image: HTMLImageElement): ImageData {
  ctx.drawImage(image, 0, 0, imageSize, imageSize)
  const imageData = ctx.getImageData(0, 0, imageSize, imageSize)
  return {
    data: imageData.data,
    width: imageSize,
    height: imageSize,
  }
}
</script>
