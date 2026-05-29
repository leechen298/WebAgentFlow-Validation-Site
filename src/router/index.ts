import { createRouter, createWebHistory } from 'vue-router';
import IndexPage from '../pages/IndexPage.vue';
import InventoryPage from '../pages/InventoryPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'index',
      component: IndexPage,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryPage,
    },
  ],
});

export default router;
