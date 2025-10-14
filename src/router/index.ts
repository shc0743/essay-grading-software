import { createRouter, createWebHashHistory } from 'vue-router'
import NotFound from '@/components/NotFound.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome/',
      component: () => import('@/components/Welcome.vue'),
    },
    {
      path: '/',
      redirect: '/welcome/',
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
    {
      path: '/about/',
      component: () => import('@/components/About.vue'),
    },
    {
      path: '/settings/',
      component: () => import('@/components/Settings.vue'),
    },
    {
      path: '/Senadina/',
      component: () => import('@/components/SenadinaActivity.vue'),
    },
  ],
})

export default router
