<template>
  <div
    v-if="dialogVisible"
    class="red-packet-overlay"
    @click.self="handleClose"
  >
    <div class="red-packet-container">
      <div class="red-packet-header">
        <div class="header-content">
          <i class="el-icon-gift header-icon"></i>
          <span class="header-title">发红包</span>
        </div>
        <div class="close-btn" @click="handleClose">
          <i class="fas fa-close"></i>
        </div>
      </div>

      <div class="red-packet-body">
        <div class="type-selector">
          <div
            v-for="type in redPacketTypes"
            :key="type.value"
            class="type-card"
            :class="{ active: form.type === type.value }"
            @click="form.type = type.value"
          >
            <i :class="type.icon"></i>
            <span class="type-name">{{ type.name }}</span>
            <span class="type-desc">{{ type.desc }}</span>
          </div>
        </div>

        <div class="form-content">
          <div class="form-item">
            <span class="item-label">祝福语</span>
            <el-input
              v-model="form.msg"
              placeholder="摸鱼者，事竟成！"
              maxlength="20"
              show-word-limit
            />
          </div>

          <div class="form-item">
            <span class="item-label">积分</span>
            <el-input-number
              v-model="form.money"
              :min="1"
              :max="999999999"
              :default-value="32"
              controls-position="right"
            />
          </div>
          <div
            v-if="form.type === 'rockPaperScissors'"
            class="tax-info"
            style="
              margin-left: 62px;
              color: var(--sub-text-color);
              font-size: 12px;
            "
          >
            实际红包：{{ taxedMoney }} 积分（含10%猜拳红包税）
          </div>

          <div class="form-item">
            <span class="item-label">个数</span>
            <el-input-number
              v-model="form.count"
              :min="form.type === 'heartbeat' ? 5 : 1"
              :max="9999999"
              :default-value="form.type === 'heartbeat' ? 5 : 2"
              controls-position="right"
              :disabled="form.type === 'specify'"
            />
          </div>

          <div v-if="form.type === 'specify'" class="form-item">
            <span class="item-label">接收者</span>
            <el-select
              v-model="form.recivers"
              multiple
              filterable
              placeholder="请选择接收者"
              @change="handleReceiversChange"
            >
              <el-option
                v-for="user in onlineUsers"
                :key="user.userName"
                :label="user.userName"
                :value="user.userName"
              />
            </el-select>
          </div>

          <div v-if="form.type === 'rockPaperScissors'" class="form-item">
            <span class="item-label">猜拳</span>
            <div class="gesture-selector">
              <div
                v-for="option in gestureOptions"
                :key="option.value"
                class="gesture-item"
                :class="{ active: form.gesture === option.value }"
                @click="form.gesture = option.value"
              >
                <span class="gesture-icon">{{ option.icon }}</span>
                <span class="gesture-name">{{ option.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="red-packet-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="send-btn" :loading="isSending" @click="handleSend"
          >发送红包</el-button
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  reactive,
  onMounted,
  onUnmounted,
  computed,
} from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  onlineUsers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "send"]);

const dialogVisible = ref(false);
const isSending = ref(false);

const redPacketTypes = [
  {
    name: "拼手气红包",
    value: "random",
    icon: "el-icon-gift",
    desc: "摸鱼者，事竟成！",
    defaultMsg: "摸鱼者，事竟成！",
  },
  {
    name: "平分红包",
    value: "average",
    icon: "el-icon-share",
    desc: "平分红包，人人有份！",
    defaultMsg: "平分红包，人人有份！",
  },
  {
    name: "专属红包",
    value: "specify",
    icon: "el-icon-user",
    desc: "试试看，这是给你的红包吗？",
    defaultMsg: "试试看，这是给你的红包吗？",
  },
  {
    name: "心跳红包",
    value: "heartbeat",
    icon: "el-icon-heart",
    desc: "玩的就是心跳！",
    defaultMsg: "玩的就是心跳！",
  },
  {
    name: "猜拳红包",
    value: "rockPaperScissors",
    icon: "el-icon-scissors",
    desc: "石头剪刀布！",
    defaultMsg: "石头剪刀布！",
  },
];

const gestureOptions = [
  { name: "石头", value: 0, icon: "✊" },
  { name: "剪刀", value: 1, icon: "✌️" },
  { name: "布", value: 2, icon: "✋" },
];

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
  }
);

watch(
  () => dialogVisible.value,
  (val) => {
    if (!val) {
      emit("close");
    }
  }
);

const form = reactive({
  type: "random",
  msg: redPacketTypes[0].defaultMsg,
  money: 32,
  count: 2,
  recivers: [],
  gesture: 0,
});

// 监听红包类型变化，自动更新祝福语和个数
watch(
  () => form.type,
  (newType) => {
    const selectedType = redPacketTypes.find((type) => type.value === newType);
    if (selectedType) {
      form.msg = selectedType.defaultMsg;
      // 如果是心跳红包，设置最小个数为5
      if (newType === "heartbeat") {
        form.count = Math.max(5, form.count);
      }
    }
  }
);

// 处理接收者变化
const handleReceiversChange = (value) => {
  if (form.type === "specify") {
    form.count = value.length;
  }
};

const handleClose = () => {
  dialogVisible.value = false;
  Object.assign(form, {
    type: "random",
    msg: redPacketTypes[0].defaultMsg,
    money: 32,
    count: 2,
    recivers: [],
    gesture: 0,
  });
};

const handleSend = async () => {
  if (isSending.value) return;
  isSending.value = true;
  try {
    emit("send", { ...form });
    handleClose();
  } finally {
    isSending.value = false;
  }
};

const taxedMoney = computed(() => Math.floor(form.money * 0.9));
</script>

<style scoped>
.red-packet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.red-packet-container {
  width: 380px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: slide-up 0.3s ease-out;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.red-packet-header {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 20px;
  color: #fff;
}

.header-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn i {
  color: #fff;
  font-size: 16px;
}

.red-packet-body {
  padding: 16px;
  overflow-y: auto;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.type-card {
  background: var(--hover-bg);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.type-card:hover {
  background: var(--background-color);
}

.type-card.active {
  background: var(--background-color);
  border-color: #ff4d4f;
}

.type-card i {
  font-size: 20px;
  color: #ff4d4f;
  margin-bottom: 6px;
}

.type-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.type-desc {
  display: block;
  font-size: 11px;
  color: var(--sub-text-color);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-label {
  width: 50px;
  font-size: 13px;
  color: var(--sub-text-color);
  flex-shrink: 0;
}

.gesture-selector {
  display: flex;
  gap: 8px;
}

.gesture-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--hover-bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.gesture-item:hover {
  background: var(--background-color);
}

.gesture-item.active {
  background: var(--background-color);
  border-color: #ff4d4f;
}

.gesture-icon {
  font-size: 24px;
}

.gesture-name {
  font-size: 12px;
  color: var(--sub-text-color);
}

.red-packet-footer {
  padding: 12px 16px;
  background: var(--hover-bg);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn {
  padding: 8px 16px;
  font-weight: 500;
  border: none;
  background: var(--hover-bg);
  color: var(--sub-text-color);
  font-size: 13px;
}

.cancel-btn:hover {
  background: var(--background-color);
  color: var(--text-color);
}

.send-btn {
  padding: 8px 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border: none;
  color: #fff;
  font-size: 13px;
}

.send-btn:hover {
  background: linear-gradient(135deg, #ff7875 0%, #ff9c9e 100%);
}

:deep(.el-input__wrapper) {
  padding: 0 8px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding: 0 8px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  width: 28px;
  height: 28px;
  line-height: 28px;
}
</style>
