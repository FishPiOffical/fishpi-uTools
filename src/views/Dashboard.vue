<template>
  <div class="dashboard">
    <div class="dashboard-container">
      <!-- 第一行 欢迎卡片 -->
      <el-row :gutter="16" class="row-block">
        <el-col :span="24">
          <div class="data-card welcome-data-card">
            <div class="welcome-title">
              Hi，{{ userStore.userNickname }}，{{ greeting }}！
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
              <h2>活跃度</h2>
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
                userStore.userInfo?.onlineMinute || 0
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
import { ref, onMounted, computed } from "vue";
import { userApi } from "../api";
import { useUserStore } from "../stores/user";
import { useLivenessStore } from "../stores/liveness";
import { ElRow, ElCol, ElMessage } from "element-plus";

const userStore = useUserStore();
const livenessStore = useLivenessStore();
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
  const endTimeStr = savedSettings.workTime?.endTime || "17:00";
  const restDays = savedSettings.restDays || ["0", "6"]; // 默认双休

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

// 节假日倒计时数据
const holidayName = ref("");
const holidayDays = ref(null);
const isHolidayToday = ref(false);
const holidayMessage = ref("正在获取节假日信息...");

// 节日祝福语映射
const holidayGreetings = {
  元旦: "新年快乐！愿新的一年里，万事如意，心想事成！",
  春节: "新春快乐！祝您阖家欢乐，幸福安康！",
  元宵节: "元宵节快乐！记得吃汤圆哦~",
  清明节: "清明时节雨纷纷，路上行人欲断魂。",
  劳动节: "劳动节快乐！感谢每一位辛勤的劳动者！",
  端午节: "端午节快乐！今天吃粽子了吗？",
  中秋节: "中秋快乐！月圆人团圆，记得吃月饼哦~",
  国庆节: "国庆节快乐！祝祖国繁荣昌盛！",
  重阳节: "重阳节快乐！祝您健康长寿！",
  腊八节: "腊八节快乐！记得喝腊八粥哦~",
  除夕: "除夕快乐！祝您阖家团圆，幸福美满！",
};

// 获取节日祝福语
const getHolidayGreeting = (holidayName) => {
  return (
    holidayGreetings[holidayName] || `今天是${holidayName}，祝您节日快乐！`
  );
};

// 每日一言数据
const dailyQuote = ref("");
const quoteAuthor = ref("");

onMounted(async () => {
  await fetchRewardStatus();
  // 设置今日日期
  const now = new Date();
  const weekArr = ["日", "一", "二", "三", "四", "五", "六"];
  todayStr.value = `${now.getFullYear()}年${
    now.getMonth() + 1
  }月${now.getDate()}日 星期${weekArr[now.getDay()]}`;
  fetchNextHoliday();
  fetchDailyQuote();

  // 启动定时器，每分钟更新一次时间
  setInterval(() => {
    currentTime.value = new Date();
  }, 60000);
});

// 获取下一个节假日
const fetchNextHoliday = async () => {
  try {
    // 首先获取今天的日期
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // 格式化为 YYYY-MM-DD

    // 先检查今天是否是节假日
    const todayRes = await fetch(
      `https://timor.tech/api/holiday/info/${todayStr}`
    );
    const todayData = await todayRes.json();

    if (todayData.code === 0) {
      // 如果今天是节假日
      if (todayData.holiday && todayData.holiday.holiday) {
        holidayName.value = todayData.holiday.name;
        holidayDays.value = "今天";
        isHolidayToday.value = true;
        holidayMessage.value = getHolidayGreeting(todayData.holiday.name);
        return;
      }
    }

    // 如果今天不是节假日，获取下一个节假日
    const nextRes = await fetch("https://timor.tech/api/holiday/next");
    const nextData = await nextRes.json();

    if (nextData.holiday) {
      holidayName.value = nextData.holiday.name;
      // 计算距离天数
      const holidayDate = new Date(nextData.holiday.date);
      // 只算天数，不考虑时分秒
      const diffTime =
        holidayDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      holidayDays.value = diffDays;

      // 如果是当天，显示"今天"
      if (diffDays === 0) {
        holidayDays.value = "今天";
        isHolidayToday.value = true;
        holidayMessage.value = getHolidayGreeting(nextData.holiday.name);
      } else {
        isHolidayToday.value = false;
        holidayMessage.value = `距离${nextData.holiday.name}还有${diffDays}天`;
      }
    } else {
      holidayName.value = "未知";
      holidayDays.value = "-";
      isHolidayToday.value = false;
      holidayMessage.value = "暂无节假日信息";
    }
  } catch (e) {
    console.error("获取节假日信息失败:", e);
    holidayName.value = "未知";
    holidayDays.value = "-";
    isHolidayToday.value = false;
    holidayMessage.value = "获取节假日信息失败";
  }
};

// 获取每日一言
const fetchDailyQuote = async () => {
  try {
    const response = await fetch(
      "https://international.v1.hitokoto.cn/?c=d&c=i&c=k&min_length=20&max_length=50"
    );
    const data = await response.json();
    if (data) {
      dailyQuote.value = data.hitokoto;
      quoteAuthor.value = data.from_who || data.from || "佚名";
    }
  } catch (error) {
    // 设置一些默认的名言
    const defaultQuotes = [
      {
        text: "生活就像一盒巧克力，你永远不知道下一颗是什么味道。",
        author: "阿甘正传",
      },
      { text: "种一棵树最好的时间是十年前，其次是现在。", author: "中国谚语" },
      { text: "不要等待机会，而要创造机会。", author: "林肯" },
      {
        text: "与其用华丽的外衣装饰自己，不如用知识武装自己。",
        author: "莎士比亚",
      },
      { text: "把时间用在思考上是最能节省时间的事情。", author: "卡曾斯" },
    ];
    const randomQuote =
      defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
    dailyQuote.value = randomQuote.text;
    quoteAuthor.value = randomQuote.author;
  }
};

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
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f5f7fa;
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
  background: linear-gradient(135deg, #f6f8fc 0%, #e9ecef 100%);
  color: #2c3e50;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  padding: 2rem;
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.welcome-date {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.welcome-row {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #334155;
}

.welcome-row .highlight {
  font-size: 1.1rem;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  line-height: 1.4;
}

/* 节假日卡片样式 */
.holiday-data-card {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
  color: #256029;
  box-shadow: 0 4px 20px rgba(150, 230, 161, 0.1);
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
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
  color: #5a3d6d;
  box-shadow: 0 4px 20px rgba(166, 193, 238, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.quote-title {
  font-size: 1.1rem;
  font-weight: 700;
}
.quote-content {
  font-size: 1rem;
  margin-top: 0.2rem;
}
.quote-author {
  text-align: right;
  font-size: 0.9rem;
  margin-top: 0.2rem;
  opacity: 0.7;
}

.data-card {
  min-height: 120px; /* 你 可以根据实际内容调整高度 */
  background: #fff;
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
  color: #1a1f36;
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
  color: #1a1f36;
}
.time-display {
  text-align: center;
}
.time-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1f36;
}
.time-unit {
  font-size: 0.875rem;
  color: #697386;
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
  background: #3b82f6;
  color: white;
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
    color: #1a1f36;
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
  color: #1a1f36;
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
</style>
