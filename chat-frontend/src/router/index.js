import { createRouter, createWebHistory } from "vue-router";
import registerPage from "@/pages/auth/register-page.vue";
import chattingPage from "@/pages/chat/chatting-page.vue";
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      redirect: { name: "register" },
    },
    {
      path: "/register",
      name: "register",
      component: registerPage,
    },
    {
      path: "/",
      name: "chatting",
      component: chattingPage,
    },
  ],
});
