import { createRouter, createWebHistory } from 'vue-router';
import InventoryPage from '../pages/InventoryPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/inventory',
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryPage,
    },
  ],
});

export default router;
