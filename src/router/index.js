import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Chatroom from "../views/Chatroom.vue";
import Posts from "../views/Posts.vue";
import Moon from "../views/Moon.vue";
import Settings from "../views/Settings.vue";
import PostDetail from "../views/PostDetail.vue";
import Notifications from "../views/Notifications.vue";
import Dashboard from "../views/Dashboard.vue";
import PrivateChat from "../views/PrivateChat.vue";
import UserProfile from "../views/UserProfile.vue";
import Games from "../views/Games.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/",
    name: "Home",
    component: Home,
    children: [
      {
        path: "",
        name: "Dashboard",
        component: Dashboard,
      },
      {
        path: "/chatroom",
        name: "Chatroom",
        component: Chatroom,
      },
      {
        path: "/posts",
        name: "Posts",
        component: Posts,
        meta: {
          keepAlive: true,
        },
      },
      {
        path: "/games",
        name: "Games",
        component: Games,
      },
      {
        path: "/moon",
        name: "Moon",
        component: Moon,
      },
      {
        path: "/settings",
        name: "Settings",
        component: Settings,
      },
      {
        path: "/post/:id",
        name: "PostDetail",
        component: PostDetail,
      },
      {
        path: "/notifications",
        name: "Notifications",
        component: Notifications,
      },
      {
        path: "/private-chat",
        name: "PrivateChat",
        component: PrivateChat,
      },
      {
        path: "/user/:username",
        name: "UserProfile",
        component: UserProfile,
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
