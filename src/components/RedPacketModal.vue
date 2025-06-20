<template>
  <div class="red-packet-modal" v-if="visible" @click.self="onClose">
    <div class="red-packet-modal-content">
      <div class="red-packet-modal-header">
        <div class="red-packet-modal-close" @click="onClose">×</div>
        <div class="red-packet-sender">
          <img
            :src="redPacket?.info?.userAvatarURL48"
            class="sender-avatar"
            alt="avatar"
          />
          <span class="sender-name">{{ redPacket?.info?.userName }}</span>
          <span
            v-if="redPacket?.type === 'rockPaperScissors'"
            class="rock-paper-scissors-type"
          >
            {{ getRockPaperScissorsType(redPacket?.info?.gesture) }}
          </span>
        </div>
        <div class="red-packet-message">{{ redPacket?.info?.msg }}</div>
        <div class="red-packet-amount">
          {{ redPacket?.money }} <span class="unit">积分</span>
        </div>
        <div class="red-packet-info">
          {{ redPacket?.info?.got }}/{{ redPacket?.info?.count }}个红包
        </div>
      </div>
      <div class="red-packet-modal-body">
        <div class="red-packet-modal-title"></div>
        <div class="red-packet-modal-receivers">
          <div
            v-for="receiver in redPacket?.who"
            :key="receiver.userId"
            class="receiver-item"
          >
            <img :src="receiver.avatar" class="receiver-avatar" alt="avatar" />
            <div class="receiver-info">
              <div>
                <div class="receiver-name">
                  {{ receiver.userName }}
                  <span
                    v-if="receiver.userName === currentUser"
                    class="current-user-tag"
                    >我</span
                  >
                  <span v-if="isLuckyKing(receiver)" class="lucky-king-tag"
                    >手气王</span
                  >
                </div>
                <div class="receiver-time">{{ formatTime(receiver.time) }}</div>
              </div>
              <div class="receiver-amount">{{ receiver.userMoney }} 积分</div>
            </div>
          </div>
        </div>
      </div>
      <div class="red-packet-modal-footer">
        <button class="red-packet-modal-button default" @click="onClose">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import dayjs from "dayjs";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  redPacket: {
    type: Object,
    default: () => ({}),
  },
  currentUser: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);

const onClose = () => {
  emit("close");
};

const formatTime = (time) => {
  return dayjs(time).format("HH:mm:ss");
};

const isLuckyKing = (receiver) => {
  if (!props.redPacket) return false;

  // 如果是平分红包 专属红包 猜拳红包 ，没有手气王
  if (
    props.redPacket.type === "average" ||
    props.redPacket.type === "specify" ||
    props.redPacket.type === "rockPaperScissors"
  )
    return false;

  // 找出最大金额
  const maxMoney = Math.max(...props.redPacket.who.map((w) => w.userMoney));

  // 如果当前用户金额等于最大金额，且是第一个达到最大金额的用户，则为手气王
  return (
    receiver.userMoney === maxMoney &&
    props.redPacket.who.findIndex((w) => w.userMoney === maxMoney) ===
      props.redPacket.who.indexOf(receiver)
  );
};

const getRockPaperScissorsType = (type) => {
  const typeMap = {
    0: "石头",
    1: "剪刀",
    2: "布",
  };
  return typeMap[type] || "";
};
</script>

<style scoped>
.red-packet-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.red-packet-modal-content {
  width: 310px;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.red-packet-modal-header {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  padding: 16px 24px 20px;
  color: #fff;
  text-align: center;
  position: relative;
  border-radius: 0 0 50% 50% / 0 0 15px 15px;
  margin-bottom: 16px;
}

.red-packet-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.red-packet-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.red-packet-modal-body {
  padding: 0 20px 20px;
  max-height: 40vh;
  display: flex;
  flex-direction: column;
  margin-top: -16px;
}

.red-packet-modal-title {
  font-size: 15px;
  color: var(--text-color);
  margin-bottom: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.red-packet-modal-receivers {
  max-height: calc(60vh - 100px);
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
  flex: 1;
}

.red-packet-modal-receivers::-webkit-scrollbar {
  width: 6px;
}

.red-packet-modal-receivers::-webkit-scrollbar-track {
  background: var(--chatroom-bg);
  border-radius: 3px;
}

.red-packet-modal-receivers::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
  transition: all 0.3s;
}

.red-packet-modal-receivers::-webkit-scrollbar-thumb:hover {
  background: var(--sub-text-color);
}

.receiver-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.receiver-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.receiver-item:first-child {
  padding-top: 0;
}

.receiver-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}

.receiver-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.receiver-name {
  font-size: 14px;
  color: var(--text-color);
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.receiver-time {
  font-size: 12px;
  color: var(--sub-text-color);
  white-space: nowrap;
}

.receiver-amount {
  font-size: 15px;
  font-weight: 500;
  color: #ff4d4f;
  margin-left: 8px;
  white-space: nowrap;
}

.red-packet-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.red-packet-modal-button {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.red-packet-modal-button.default {
  background: var(--hover-bg);
  color: var(--sub-text-color);
}

.red-packet-modal-button.default:hover {
  background: var(--background-color);
}

.red-packet-sender {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.sender-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sender-name {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.current-user-tag {
  display: inline-block;
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 6px;
  line-height: 1.5;
}

.lucky-king-tag {
  display: inline-block;
  background: #ffd700;
  color: #fff;
  font-size: 12px;
  padding: 0 6px;
  border-radius: 10px;
  margin-left: 6px;
  line-height: 1.5;
}

.red-packet-message {
  font-size: 14px;
  margin: 8px 0;
  color: #fffbe6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.red-packet-amount {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.red-packet-amount .unit {
  font-size: 14px;
  font-weight: normal;
  margin-left: 4px;
}

.red-packet-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.rock-paper-scissors-type {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  color: #fff;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
