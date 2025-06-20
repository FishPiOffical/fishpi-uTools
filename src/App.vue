<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { request } from "./api";
import ErrorHandler from "./components/ErrorHandler.vue";

const router = useRouter();
const isLoggedIn = ref(false);
const userInfo = ref({});
const theme = ref(
  localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
);

const setTheme = (val) => {
  theme.value = val;
  document.documentElement.setAttribute("data-theme", val);
  localStorage.setItem("theme", val);
};

onMounted(() => {
  // 检查登录状态
  checkLoginStatus();

  window.addEventListener("fishpi:login-success", handleLoginSuccess);
  window.addEventListener("fishpi:login-invalid", handleLoginInvalid);

  setTheme(theme.value);
});

// 检查登录状态
const checkLoginStatus = () => {
  const apiKey = request.getApiKey();
  const userInfo = utools.dbStorage.getItem("fishpi_user_info");

  if (apiKey && userInfo) {
    isLoggedIn.value = true;
    userInfo.value = userInfo;

    // 获取默认页面设置
    const settings = utools.dbStorage.getItem("fishpi_settings") || {};
    const defaultPage = settings.defaultPage || "dashboard";

    // 根据默认页面设置进行跳转
    router.push(`/${defaultPage === "dashboard" ? "" : defaultPage}`);
  } else {
    router.push("/login");
  }
};

// 监听登录成功事件
const handleLoginSuccess = () => {
  checkLoginStatus();
};

// 监听登录失效事件
const handleLoginInvalid = () => {
  isLoggedIn.value = false;
  router.push("/login");
  utools.showNotification("登录已失效，请重新登录");
};
</script>

<template>
  <div id="app">
    <ErrorHandler />
    <button
      style="position: fixed; top: 16px; right: 16px; z-index: 9999"
      @click="setTheme(theme === 'dark' ? 'light' : 'dark')"
    >
      {{ theme === "dark" ? "☀️ 亮色" : "🌙 暗色" }}
    </button>
    <router-view></router-view>
  </div>
</template>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
}
</style>
