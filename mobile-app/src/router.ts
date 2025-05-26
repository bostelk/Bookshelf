import { createRouter, createWebHistory } from 'vue-router'
import Capture from './pages/Capture.vue'
import Shelf from './pages/Shelf.vue'

const routes = [
  { path: '/', redirect: '/capture' },
  { path: '/capture', component: Capture },
  { path: '/shelf', component: Shelf },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
