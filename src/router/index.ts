import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome/',
      component: () => import('@/activities/WelcomeActivity.vue'),
    },
    {
      path: '/',
      redirect: '/welcome/',
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/activities/NotFoundActivity.vue'),
    },
    {
      path: '/about/',
      component: () => import('@/activities/AboutActivity.vue'),
    },
    {
      path: '/settings/',
      component: () => import('@/activities/SettingsActivity.vue'),
    },
    {
      path: '/Senadina/',
      component: () => import('@/activities/SenadinaActivity.vue'),
    },
    {
      path: '/take-photo/',
      component: () => import('@/activities/TakePhotoActivity.vue'),
    },
  ],
})

export default router
