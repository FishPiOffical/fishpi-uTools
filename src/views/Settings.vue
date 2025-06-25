<template>
  <div class="settings">
    <div class="settings-container">
      <div class="settings-header">
        <h2>系统设置</h2>
        <button class="about-btn" @click="showAboutAuthor">
          <i class="fas fa-info-circle"></i>
          关于插件
        </button>
      </div>

      <div class="settings-content">
        <div class="data-card">
          <div class="card-header">
            <h2>主题设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>主题模式</span>
                <el-tooltip
                  content="选择应用的主题模式，跟随系统或手动设置"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-select
                v-model="currentTheme"
                placeholder="选择主题"
                @change="handleThemeChange"
              >
                <el-option label="跟随系统" value="auto" />
                <el-option label="浅色模式" value="light" />
                <el-option label="深色模式" value="dark" />
              </el-select>
            </div>
          </div>
          <div class="settings-item" v-if="currentTheme !== 'auto'">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>快速切换</span>
                <el-tooltip
                  content="快速切换当前主题模式"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <button class="theme-toggle-btn" @click="handleThemeToggle">
                {{
                  currentTheme === "dark" ? "☀️ 切换到浅色" : "🌙 切换到深色"
                }}
              </button>
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="card-header">
            <h2>导航栏设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>聊天室侧边栏</span>
                <el-tooltip
                  content="设置聊天室侧边栏在页面加载时的默认展开/收起状态"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-switch
                v-model="defaultChatSidebarState"
                @change="handleChatSidebarStateChange"
                active-text="收起"
                inactive-text="展开"
                inline-prompt
              />
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>默认页面</span>
                <el-tooltip
                  content="设置插件打开时的默认页面"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-select
                v-model="defaultPage"
                placeholder="选择默认页面"
                @change="handleDefaultPageChange"
              >
                <el-option label="首页" value="dashboard" />
                <el-option label="聊天室" value="chatroom" />
                <el-option label="帖子" value="posts" />
                <el-option label="私聊" value="private-chat" />
                <el-option label="清风明月" value="moon" />
                <el-option label="通知" value="notifications" />
              </el-select>
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="card-header">
            <h2>工作时间设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>上班时间</span>
                <el-tooltip
                  content="设置默认上班时间，用于计算工作时长"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-time-picker
                v-model="startTime"
                format="HH:mm"
                placeholder="选择时间"
                @change="handleWorkTimeChange"
              />
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>下班时间</span>
                <el-tooltip
                  content="设置默认下班时间，用于计算工作时长"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-time-picker
                v-model="endTime"
                format="HH:mm"
                placeholder="选择时间"
                @change="handleWorkTimeChange"
              />
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>休息日设置</span>
                <el-tooltip
                  content="设置每周的休息日，用于计算工作日"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-select
                v-model="restDays"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择休息日"
                @change="handleRestDaysChange"
              >
                <el-option label="周一" value="1" />
                <el-option label="周二" value="2" />
                <el-option label="周三" value="3" />
                <el-option label="周四" value="4" />
                <el-option label="周五" value="5" />
                <el-option label="周六" value="6" />
                <el-option label="周日" value="0" />
              </el-select>
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="card-header">
            <h2>通知设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>后台通知</span>
                <el-tooltip
                  content="设置是否在应用处于后台时显示通知"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-switch
                v-model="enableBackgroundNotification"
                @change="handleBackgroundNotificationChange"
                active-text="开启"
                inactive-text="关闭"
                inline-prompt
              />
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="card-header">
            <h2>摸鱼小窗设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>月薪（元）</span>
                <el-tooltip
                  content="设置您的月薪，用于计算摸鱼收益"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-input-number
                v-model="salary"
                :min="0"
                :max="999999"
                :precision="2"
                placeholder="请输入月薪"
                @change="handleSalaryChange"
                style="width: 200px"
              />
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>发薪日</span>
                <el-tooltip
                  content="设置每月发薪日期（1-31）"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-input-number
                v-model="payday"
                :min="1"
                :max="31"
                :precision="0"
                placeholder="请输入发薪日"
                @change="handlePaydayChange"
                style="width: 200px"
              />
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>开启摸鱼小窗</span>
                <el-tooltip
                  content="开启摸鱼小窗，显示摸鱼收益"
                  placement="top"
                  effect="dark"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-button
                type="primary"
                @click="handleOpenMoYuWindow"
                :disabled="!canOpenMoYuWindow"
              >
                <i class="fas fa-fish"></i>
                开启摸鱼小窗
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AboutAuthor v-model:visible="aboutAuthorVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";
import { theme, setTheme, toggleTheme, getSystemTheme } from "../utils/theme";
import { showMoYuReminder } from "../utils/moyuWindow";
import AboutAuthor from "../components/AboutAuthor.vue";

const userStore = useUserStore();
const aboutAuthorVisible = ref(false);
const aboutDialogVisible = ref(false);
const startTime = ref(null);
const endTime = ref(null);
const restDays = ref([]);
const defaultPage = ref("dashboard");
const enableBackgroundNotification = ref(true);
const defaultChatSidebarState = ref(false);
const currentTheme = ref("auto");
const salary = ref(5000);
const payday = ref(1);

// 获取当前用户的设置
const getUserSettings = () => {
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  const currentUsername = userStore.userInfo?.userName;
  return currentUsername ? savedSettings[currentUsername] || {} : savedSettings;
};

// 保存当前用户的设置
const saveUserSettings = (settings) => {
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  const currentUsername = userStore.userInfo?.userName;

  if (currentUsername) {
    savedSettings[currentUsername] = {
      ...savedSettings[currentUsername],
      ...settings,
    };
  } else {
    Object.assign(savedSettings, settings);
  }

  utools.dbStorage.setItem("fishpi_settings", savedSettings);
};

onMounted(() => {
  // 从 utools.dbStorage 获取保存的设置
  const userSettings = getUserSettings();
  restDays.value = userSettings.restDays || ["0", "6"]; // 默认双休
  defaultPage.value = userSettings.defaultPage || "dashboard";
  enableBackgroundNotification.value =
    userSettings.enableBackgroundNotification !== false; // 默认开启
  defaultChatSidebarState.value =
    userSettings.defaultChatSidebarCollapsed || false;
  currentTheme.value = userSettings.currentTheme || "auto";
  salary.value = userSettings.salary || 0;
  payday.value = userSettings.payday || 1;

  // 设置工作时间
  const startTimeStr = userSettings.workTime?.startTime || "09:00";
  const endTimeStr = userSettings.workTime?.endTime || "17:00";

  const [startHours, startMinutes] = startTimeStr.split(":");
  const [endHours, endMinutes] = endTimeStr.split(":");

  startTime.value = new Date();
  startTime.value.setHours(parseInt(startHours), parseInt(startMinutes), 0);

  endTime.value = new Date();
  endTime.value.setHours(parseInt(endHours), parseInt(endMinutes), 0);

  // 监听账号切换事件
  window.addEventListener("fishpi:account-switched", () => {
    // 重新加载用户设置
    const userSettings = getUserSettings();
    restDays.value = userSettings.restDays || ["0", "6"];
    defaultPage.value = userSettings.defaultPage || "dashboard";
    enableBackgroundNotification.value =
      userSettings.enableBackgroundNotification !== false;
    defaultChatSidebarState.value =
      userSettings.defaultChatSidebarCollapsed || false;
    currentTheme.value = userSettings.currentTheme || "auto";
    salary.value = userSettings.salary || 0;
    payday.value = userSettings.payday || 1;

    // 重新设置工作时间
    const startTimeStr = userSettings.workTime?.startTime || "09:00";
    const endTimeStr = userSettings.workTime?.endTime || "17:00";

    const [startHours, startMinutes] = startTimeStr.split(":");
    const [endHours, endMinutes] = endTimeStr.split(":");

    startTime.value = new Date();
    startTime.value.setHours(parseInt(startHours), parseInt(startMinutes), 0);

    endTime.value = new Date();
    endTime.value.setHours(parseInt(endHours), parseInt(endMinutes), 0);
  });
});

onUnmounted(() => {
  // 移除账号切换事件监听
  window.removeEventListener("fishpi:account-switched", () => {
    const userSettings = getUserSettings();
    restDays.value = userSettings.restDays || ["0", "6"];
    defaultPage.value = userSettings.defaultPage || "dashboard";
    enableBackgroundNotification.value =
      userSettings.enableBackgroundNotification !== false;
    defaultChatSidebarState.value =
      userSettings.defaultChatSidebarCollapsed || false;
    salary.value = userSettings.salary || 0;
    payday.value = userSettings.payday || 1;

    const startTimeStr = userSettings.workTime?.startTime || "09:00";
    const endTimeStr = userSettings.workTime?.endTime || "17:00";

    const [startHours, startMinutes] = startTimeStr.split(":");
    const [endHours, endMinutes] = endTimeStr.split(":");

    startTime.value = new Date();
    startTime.value.setHours(parseInt(startHours), parseInt(startMinutes), 0);

    endTime.value = new Date();
    endTime.value.setHours(parseInt(endHours), parseInt(endMinutes), 0);
  });
});

const handleWorkTimeChange = () => {
  if (!startTime.value || !endTime.value) return;

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  saveUserSettings({
    workTime: {
      startTime: formatTime(startTime.value),
      endTime: formatTime(endTime.value),
    },
  });

  ElMessage({
    message: "工作时间设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleRestDaysChange = (value) => {
  saveUserSettings({ restDays: value });

  ElMessage({
    message: "休息日设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleDefaultPageChange = (value) => {
  saveUserSettings({ defaultPage: value });

  ElMessage({
    message: "默认页面设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleBackgroundNotificationChange = (value) => {
  saveUserSettings({ enableBackgroundNotification: value });

  ElMessage({
    message: "后台通知设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleChatSidebarStateChange = (value) => {
  saveUserSettings({ defaultChatSidebarCollapsed: value });

  ElMessage({
    message: "聊天室侧边栏状态已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleThemeChange = (value) => {
  saveUserSettings({ currentTheme: value });

  if (value === "auto") {
    // 跟随系统主题
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
  } else {
    // 手动设置主题
    setTheme(value);
  }

  ElMessage({
    message: "主题模式设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleThemeToggle = () => {
  const newTheme = currentTheme.value === "dark" ? "light" : "dark";
  currentTheme.value = newTheme;
  setTheme(newTheme);
  saveUserSettings({ currentTheme: newTheme });

  ElMessage({
    message: "主题模式已切换",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handleSalaryChange = (value) => {
  saveUserSettings({ salary: value });

  ElMessage({
    message: "月薪设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

const handlePaydayChange = (value) => {
  saveUserSettings({ payday: value });

  ElMessage({
    message: "发薪日设置已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

// 计算属性：是否可以开启摸鱼小窗
const canOpenMoYuWindow = computed(() => {
  return salary.value > 0 && payday.value >= 1 && payday.value <= 31;
});

const handleOpenMoYuWindow = async () => {
  // 检查参数是否已填写
  if (!canOpenMoYuWindow.value) {
    ElMessage({
      message: "请先填写月薪和发薪日",
      type: "warning",
      duration: 3000,
      showClose: true,
    });
    return;
  }

  try {
    // 获取用户头像和用户名
    const userAvatar = userStore.userInfo?.userAvatarURL || null;
    const username = userStore.userInfo?.userName || null;

    // 开启摸鱼小窗
    await showMoYuReminder({
      userAvatar: userAvatar,
      username: username,
      autoClose: false,
    });

    ElMessage({
      message: "摸鱼小窗已开启",
      type: "success",
      duration: 2000,
      showClose: true,
    });
  } catch (error) {
    console.error("开启摸鱼小窗失败:", error);
    ElMessage({
      message: "开启摸鱼小窗失败，请重试",
      type: "error",
      duration: 3000,
      showClose: true,
    });
  }
};

const showAboutAuthor = () => {
  aboutAuthorVisible.value = true;
};
</script>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 8px;
  background: var(--background-color, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.settings-header h2 {
  margin: 0;
  color: var(--text-color, #333);
  font-size: 24px;
  font-weight: 600;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.settings-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #eee);
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: var(--sub-text-color, #697386);
  font-size: 14px;
}

.app-info {
  color: var(--text-color, #1a1f36);
}

.data-card {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #1a1f36);
  margin: 0;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.settings-item-left {
  flex: 1;
  padding-right: 24px;
}

.settings-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color, #1a1f36);
  margin-bottom: 4px;
}

.settings-item-title i {
  color: var(--sub-text-color, #697386);
  cursor: help;
}

.settings-item-description {
  font-size: 13px;
  color: var(--sub-text-color, #697386);
  line-height: 1.4;
}

.settings-item-right {
  flex-shrink: 0;
}

:deep(.el-switch) {
  --el-switch-on-color: #3b82f6;
}

.settings-item-right .el-select {
  width: 200px;
}

@media (max-width: 600px) {
  .settings {
    padding: 1rem;
  }
}

.about-content {
  padding: 1rem;
}

.about-item {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.about-item .label {
  font-weight: 500;
  color: var(--text-color, #1a1f36);
  margin-right: 0.5rem;
}

.about-item a {
  color: var(--primary-color, #3b82f6);
  text-decoration: none;
}

.about-item a:hover {
  text-decoration: underline;
}

.about-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-color, #1a1f36);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.about-btn:hover {
  background-color: var(--hover-bg, #e5e7eb);
}

.about-btn i {
  font-size: 16px;
}

.theme-toggle-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
  color: var(--text-color, #1a1f36);
}
</style>
