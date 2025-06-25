// 主题管理工具
import { ref } from "vue";

// 获取用户特定的主题设置
const getUserTheme = () => {
  try {
    const userSettings = utools.dbStorage.getItem("fishpi_settings");
    if (userSettings && userSettings.currentTheme) {
      return userSettings.currentTheme;
    }
  } catch (error) {
    console.log("读取用户主题设置失败:", error);
  }
  return null;
};

// 获取初始主题
const getInitialTheme = () => {
  // 首先尝试获取用户特定的主题设置
  const userTheme = getUserTheme();
  if (userTheme && userTheme !== "auto") {
    return userTheme;
  }

  // 如果没有用户设置或设置为自动，使用旧的主题存储
  const storedTheme = utools.dbStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme;
  }

  // 最后使用系统主题
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// 创建响应式的主题状态
const theme = ref(getInitialTheme());

// 设置主题的方法
const setTheme = (val) => {
  theme.value = val;
  document.documentElement.setAttribute("data-theme", val);

  // 同时更新两个存储位置以保持兼容性
  try {
    const userSettings = utools.dbStorage.getItem("fishpi_settings") || {};
    userSettings.currentTheme = val;
    utools.dbStorage.setItem("fishpi_settings", userSettings);
    utools.dbStorage.setItem("theme", val);
  } catch (error) {
    console.log("保存主题设置失败:", error);
  }
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
