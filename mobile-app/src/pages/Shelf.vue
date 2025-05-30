<template>
  <h1 class="text-2xl font-bold">Shelfs</h1>
  <p class="text-gray-500">Search books in your library.</p>
  <br />
  <input
    v-model="searchQuery"
    type="text"
    placeholder="..."
    class="bg-gray-100 rounded"
    style="width: 250px"
  />
  &nbsp;<button
    @click="doSearch"
    class="bg-black hover:bg-white border-1 hover:text-black text-white px-2 rounded"
  >
    Search
  </button>
  &nbsp;<button
    v-if="didSearch"
    @click="reset"
    class="bg-black hover:bg-white border-1 hover:text-black text-white px-2 rounded"
  >
    Reset
  </button>
  <br />
  <br />
  <div v-if="shelfs.length === 0" class="mb-4">
    <p>No books found</p>
  </div>
  <div v-else v-for="shelf of shelfs" :key="shelf.title" class="mb-4">
    <h2 class="font-bold">{{ shelf.title }}</h2>
    <div class="flex items-end">
      <img class="object-none" v-for="image of shelf.images" :src="image" />
    </div>
  </div>
  <br />
</template>
<script setup lang="ts">
import { userShelfs } from '../user'
import { ref, computed } from 'vue'

const searchQuery = ref('')
const searchResults = ref([])
const didSearch = ref(false)

function doSearch() {
  if (!searchQuery.value) {
    return
  }

  const images = []
  const boxes = []
  const books = []

  for (let i = 0; i < userShelfs.value.length; i++) {
    for (let j = 0; j < userShelfs.value[i].books.length; j++) {
      const book = userShelfs.value[i].books[j]
      if (book == searchQuery.value) {
        images.push(shelfs.value[i].images[j])
        boxes.push(shelfs.value[i].boxes[j])
        books.push(shelfs.value[i].books[j])
      }
    }
  }
  searchResults.value = [
    {
      images,
      boxes,
      books,
    },
  ]
  didSearch.value = true
}

function reset() {
  didSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
}

const shelfs = computed(() => {
  return searchResults.value.length > 0 ? searchResults.value : userShelfs.value
})
</script>
