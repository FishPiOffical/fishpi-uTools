<template>
  <div class="settings">
    <div class="settings-container">
      <div class="settings-header">
        <h2>系统设置</h2>
      </div>

      <div class="settings-content">
        <div class="data-card">
          <div class="card-header">
            <h2>导航栏设置</h2>
          </div>
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-title">
                <span>默认状态</span>
                <el-tooltip
                  content="设置导航栏在页面加载时的默认展开/收起状态"
                  placement="top"
                  effect="light"
                >
                  <i class="fas fa-question-circle"></i>
                </el-tooltip>
              </div>
            </div>
            <div class="settings-item-right">
              <el-switch
                v-model="defaultNavState"
                @change="handleNavStateChange"
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
                  effect="light"
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
                  effect="light"
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
                  effect="light"
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
                  effect="light"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const aboutDialogVisible = ref(false);
const defaultNavState = ref(false);
const startTime = ref(null);
const endTime = ref(null);
const restDays = ref([]);
const defaultPage = ref("dashboard");

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
  defaultNavState.value = userSettings.defaultNavCollapsed || false;
  restDays.value = userSettings.restDays || ["0", "6"]; // 默认双休
  defaultPage.value = userSettings.defaultPage || "dashboard";

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
    defaultNavState.value = userSettings.defaultNavCollapsed || false;
    restDays.value = userSettings.restDays || ["0", "6"];
    defaultPage.value = userSettings.defaultPage || "dashboard";

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
    defaultNavState.value = userSettings.defaultNavCollapsed || false;
    restDays.value = userSettings.restDays || ["0", "6"];
    defaultPage.value = userSettings.defaultPage || "dashboard";

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

const handleNavStateChange = (value) => {
  saveUserSettings({ defaultNavCollapsed: value });

  ElMessage({
    message: "导航栏默认状态已更新",
    type: "success",
    duration: 2000,
    showClose: true,
  });
};

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

const showAboutDialog = () => {
  aboutDialogVisible.value = true;
};
</script>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 8px;
  background: #fff;
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
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.settings-content::-webkit-scrollbar {
  width: 8px;
}

.settings-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.settings-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: #697386;
  font-size: 14px;
}

.app-info {
  color: #1a1f36;
}

.data-card {
  background: #fff;
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
  color: #1a1f36;
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
  color: #1a1f36;
  margin-bottom: 4px;
}

.settings-item-title i {
  color: #697386;
  cursor: help;
}

.settings-item-description {
  font-size: 13px;
  color: #697386;
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
  color: #1a1f36;
  margin-right: 0.5rem;
}

.about-item a {
  color: #3b82f6;
  text-decoration: none;
}

.about-item a:hover {
  text-decoration: underline;
}
</style>
