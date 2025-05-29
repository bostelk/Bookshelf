<template>
  <h1 class="text-2xl font-bold">Shelfs</h1>
  <p class="text-gray-500">Search books in your collection</p>
  <br />
  <input type="text" placeholder="..." class="bg-gray-100 rounded" style="width: 250px" />
  &nbsp;<button class="bg-black hover:bg-white border-1 hover:text-black text-white px-2 rounded">
    Search
  </button>
  <br />
  <br />
  <div class="mb-4" v-for="shelf of shelfs">
    <h2 class="font-bold">{{ shelf.title }}</h2>
    <img
      :src="shelf.image"
    />
  </div>
  <br />
</template>
<script setup lang="ts">
import { shelfs } from '../user';
</script>
