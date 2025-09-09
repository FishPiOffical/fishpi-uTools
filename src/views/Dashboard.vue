<template>
  <div class="dashboard">
    <div class="dashboard-container">
      <!-- 第一行 欢迎卡片 -->
      <el-row :gutter="16" class="row-block">
        <el-col :span="24">
          <div class="data-card welcome-data-card">
            <div class="welcome-title">
              Hi，{{ userStore.userNickname || userStore.userName }}，{{
                greeting
              }}！
            </div>
            <div class="welcome-date">今天是{{ todayStr }}</div>
            <div class="welcome-row">
              <span class="highlight">{{ offWorkHour }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
      <!-- 第二行 节假日倒计时、每日一言 -->
      <el-row :gutter="16" class="row-block">
        <el-col :span="12">
          <div class="data-card holiday-data-card">
            <div class="holiday-title">节假日倒计时</div>
            <div class="holiday-content">
              <span class="festival-icon">{{
                isHolidayToday ? "🎉" : "📅"
              }}</span>
              <span>{{ holidayMessage }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="data-card quote-data-card">
            <div class="quote-title">每日一言</div>
            <div class="quote-content">{{ dailyQuote }}</div>
            <div class="quote-author">—— {{ quoteAuthor }}</div>
          </div>
        </el-col>
      </el-row>
      <!-- 第三行 活跃度、在线时长、每日奖励 -->
      <el-row :gutter="16" class="row-block">
        <el-col :span="8">
          <div class="data-card">
            <div class="card-header">
              <h2>
                活跃度
                <el-tooltip content="点击查看活跃度说明" placement="top">
                  <span class="help-icon" @click="openHelpLink">?</span>
                </el-tooltip>
              </h2>
              <span
                class="liveness-tag"
                :class="{ active: livenessStore.liveness >= 10 }"
              >
                {{ livenessStore.liveness >= 10 ? "已签到" : "未签到" }}
              </span>
            </div>
            <div class="liveness-progress">
              <div class="progress-bar">
                <div
                  class="progress"
                  :style="{ width: `${livenessStore.liveness}%` }"
                ></div>
              </div>
              <span class="progress-value">{{ livenessStore.liveness }}%</span>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-card">
            <div class="card-header">
              <h2>在线时长</h2>
            </div>
            <div class="time-display">
              <span class="time-value">{{
                userStore.userOnlineMinute || 0
              }}</span>
              <span class="time-unit">分钟</span>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="data-card">
            <div class="card-header">
              <h2>每日奖励</h2>
            </div>
            <button
              class="reward-button"
              :class="{ claimed: rewardStatus }"
              @click="claimReward"
              :disabled="rewardStatus"
            >
              <span class="button-icon">🎁</span>
              <span class="button-text">{{
                rewardStatus ? "已领取" : "领取奖励"
              }}</span>
            </button>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-dialog
      v-model="showRewardDialog"
      title="领取奖励"
      width="30%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="reward-dialog"
    >
      <div class="reward-dialog-content">
        <div class="reward-icon">🎁</div>
        <div class="reward-message">恭喜获得 {{ rewardPoints }} 积分！</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showRewardDialog = false"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { userApi } from "../api";
import { useUserStore } from "../stores/user";
import { useLivenessStore } from "../stores/liveness";
import { useDashboardStore } from "../stores/dashboard";
import { ElRow, ElCol, ElMessage } from "element-plus";

const userStore = useUserStore();
const livenessStore = useLivenessStore();
const dashboardStore = useDashboardStore();
const rewardStatus = ref(false);
const showRewardDialog = ref(false);
const rewardPoints = ref(0);

// 新增：欢迎卡片相关数据
const todayStr = ref("");
const currentTime = ref(new Date());

// 计算距离下班时间
const offWorkHour = computed(() => {
  const now = currentTime.value;
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  const currentUsername = userStore.userInfo?.userName;
  const userSettings = currentUsername
    ? savedSettings[currentUsername] || {}
    : savedSettings;
  const endTimeStr = userSettings.workTime?.endTime || "17:00";
  const restDays = userSettings.restDays || ["0", "6"]; // 默认双休

  // 检查今天是否是休息日
  const today = now.getDay().toString();
  if (restDays.includes(today)) {
    return "今天休息，好好放松一下吧~";
  }

  // 检查是否是节假日
  if (isHolidayToday.value) {
    return `今天是${holidayName.value}，好好享受假期吧！`;
  }

  const [endHours, endMinutes] = endTimeStr.split(":");
  const endTime = new Date(now);
  endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

  // 如果已经过了下班时间
  if (now > endTime) {
    return "今天辛苦了，好好休息吧！";
  }

  const diff = endTime - now;
  const hours = diff / (1000 * 60 * 60);
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 1) {
    return `再坚持${hours.toFixed(1)}小时就可以下班啦，加油！`;
  } else {
    return `再坚持${minutes}分钟就可以下班啦，坚持就是胜利！`;
  }
});

// 计算问候语
const greeting = computed(() => {
  const hour = currentTime.value.getHours();
  if (hour < 6) return "凌晨好";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 17) return "下午好";
  if (hour < 19) return "傍晚好";
  return "晚上好";
});

// 删除原有的节假日和每日一言相关的代码，使用 store 中的数据
const holidayName = computed(() => dashboardStore.holidayName);
const holidayDays = computed(() => dashboardStore.holidayDays);
const isHolidayToday = computed(() => dashboardStore.isHolidayToday);
const holidayMessage = computed(() => dashboardStore.holidayMessage);
const dailyQuote = computed(() => dashboardStore.dailyQuote);
const quoteAuthor = computed(() => dashboardStore.quoteAuthor);

onMounted(async () => {
  await fetchRewardStatus();
  // 设置今日日期
  const now = new Date();
  const weekArr = ["日", "一", "二", "三", "四", "五", "六"];
  todayStr.value = `${now.getFullYear()}年${
    now.getMonth() + 1
  }月${now.getDate()}日 星期${weekArr[now.getDay()]}`;

  // 使用 store 中的方法获取数据
  await dashboardStore.fetchNextHoliday();
  await dashboardStore.fetchDailyQuote();

  // 启动定时器，每分钟更新一次时间
  setInterval(() => {
    currentTime.value = new Date();
  }, 60000);

  // 监听账号切换事件
  window.addEventListener("fishpi:account-switched", async () => {
    await livenessStore.init();
    await fetchRewardStatus();
  });
});

onUnmounted(() => {
  window.removeEventListener("fishpi:account-switched", async () => {
    await livenessStore.init();
    await fetchRewardStatus();
  });
});

const fetchRewardStatus = async () => {
  try {
    const res = await userApi.checkLivenessRewardStatus();
    rewardStatus.value = res.isCollectedYesterdayLivenessReward;
    
  } catch (error) {
    console.error("获取奖励状态失败:", error);
  }
};

const claimReward = async () => {
  try {
    const res = await userApi.claimYesterdayLivenessReward();

    if (res.sum === -1) {
      ElMessage.warning("您已经领取过奖励了");
    } else {
      rewardPoints.value = res.sum;
      showRewardDialog.value = true;
      rewardStatus.value = true;
    }
  } catch (error) {
    console.error("领取奖励失败:", error);
    ElMessage.error("领取失败，请稍后重试");
  }
};

const openHelpLink = () => {
  utools.shellOpenExternal("https://fishpi.cn/article/1683775497629");
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 1.5rem;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.row-block {
  margin-bottom: 1rem;
}

/* 欢迎卡片样式 */
.welcome-data-card {
  background: var(--card-bg, #f6f8fc);
  color: var(--text-color, #2c3e50);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  padding: 2rem;
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #1e293b);
  margin-bottom: 0.75rem;
}

.welcome-date {
  font-size: 0.95rem;
  color: var(--sub-text-color, #64748b);
  margin-bottom: 1rem;
}

.welcome-row {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: var(--sub-text-color, #334155);
}

.welcome-row .highlight {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--primary-color, #3b82f6);
  background: var(--hover-bg, #eff6ff);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  line-height: 1.4;
}

/* 节假日卡片样式 */
.holiday-data-card {
  color: var(--text-color, #1a1f36);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}
.holiday-title {
  font-size: 1.1rem;
  font-weight: 700;
}
.holiday-content {
  display: flex;
  align-items: center;
  font-size: 1rem;
}
.festival-icon {
  margin-right: 0.5rem;
}

/* 每日一言卡片样式 */
.quote-data-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.quote-title {
  color: var(--text-color, #1a1f36);
  font-size: 1.1rem;
  font-weight: 700;
}
.quote-content {
  color: var(--text-color, #1a1f36);
  font-size: 1rem;
  margin-top: 0.2rem;
}
.quote-author {
  color: var(--text-color, #1a1f36);
  text-align: right;
  font-size: 0.9rem;
  margin-top: 0.2rem;
  opacity: 0.7;
}

.data-card {
  min-height: 120px;
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 1.25rem;
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

.liveness-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: #fee2e2;
  color: #ef4444;
}
.liveness-tag.active {
  background: #dcfce7;
  color: #22c55e;
}
.liveness-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: #eef0f5;
  border-radius: 3px;
  overflow: hidden;
}
.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color, #1a1f36);
}
.time-display {
  text-align: center;
}
.time-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color, #1a1f36);
}
.time-unit {
  font-size: 0.875rem;
  color: var(--sub-text-color, #697386);
  margin-left: 0.25rem;
}
.reward-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #3b82f6);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.reward-button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.reward-button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  opacity: 0.7;
}
.reward-button.claimed {
  background: #6b7280;
  cursor: not-allowed;
  opacity: 0.8;
}
.reward-button.claimed:hover {
  transform: none;
  background: #6b7280;
  cursor: not-allowed;
}
.button-icon {
  font-size: 1rem;
}
@media (max-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .row-cards {
    flex-direction: column;
    gap: 1rem;
  }
}
@media (max-width: 600px) {
  .dashboard {
    padding: 1rem;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
.single-row {
  grid-column: 1/-1;
  margin-bottom: 1rem;
}
.row-cards {
  display: flex;
  gap: 1rem;
  width: 100%;
}
.row-cards > .data-card {
  flex: 1 1 0;
  min-width: 0;
}

@media (max-width: 768px) {
  .welcome-data-card {
    padding: 1.5rem;
  }

  .welcome-title {
    font-size: 1.1rem;
  }

  .welcome-row {
    font-size: 0.95rem;
  }

  .welcome-row .highlight {
    font-size: 1.1rem;
  }
}

.reward-dialog {
  :deep(.el-dialog__header) {
    text-align: center;
    padding: 20px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-dialog__title) {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color, #1a1f36);
  }

  :deep(.el-dialog__body) {
    padding: 30px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 20px;
    border-top: 1px solid #f0f0f0;
  }
}

.reward-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.reward-icon {
  font-size: 3rem;
  animation: bounce 0.5s ease;
}

.reward-message {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #1a1f36);
  text-align: center;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  margin-left: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-icon:hover {
  background-color: #d1d5db;
  color: #4b5563;
}
</style>
