// 主题管理工具
import { ref } from "vue";

// 创建响应式的主题状态
const theme = ref(
  utools.dbStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
);

// 设置主题的方法
const setTheme = (val) => {
  theme.value = val;
  document.documentElement.setAttribute("data-theme", val);
  utools.dbStorage.setItem("theme", val);
};

// 切换主题的方法
const toggleTheme = () => {
  const newTheme = theme.value === "dark" ? "light" : "dark";
  setTheme(newTheme);
};

// 获取当前主题
const getCurrentTheme = () => theme.value;

// 获取系统主题
const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// 监听系统主题切换
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    const newTheme = e.matches ? "dark" : "light";
    // 触发自定义事件，通知应用主题已变化
    window.dispatchEvent(
      new CustomEvent("system-theme-change", { detail: { theme: newTheme } })
    );
  });

export { theme, setTheme, toggleTheme, getCurrentTheme, getSystemTheme };
