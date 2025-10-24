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
    {
      path: '/compose/',
      component: () => import('@/activities/CompositionActivity.vue'),
    },
    {
      path: '/grade/',
      component: () => import('@/activities/GradeActivity.vue'),
    },
    {
      path: '/recognite/',
      component: () => import('@/activities/RecognitionActivity.vue'),
    },
    {
      path: '/fs-test/',
      component: () => import('@/activities/FsTestActivity.vue'),
    },
    {
      path: '/settings/prompts',
      component: () => import('@/activities/SettingsActivity$PromptSettings.vue'),
    },
    {
      path: '/settings/providers',
      component: () => import('@/activities/SettingsActivity$ProvidersSettings.vue'),
    },
    {
      path: '/compose/edit/:filename?',
      component: () => import('@/activities/CompositionActivity$EditQuestion.vue'),
    },
    {
      path: '/grade/legacy/',
      component: () => import('@/activities/GradeActivity$GradeLegacy.vue'),
    },
  ],
})

export default router
