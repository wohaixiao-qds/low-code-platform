import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/PageList.vue') },
    { path: '/designer/:id', component: () => import('@/views/DesignerPage.vue') },
    { path: '/render/:id', component: () => import('@/views/RenderView.vue') },
  ],
})
