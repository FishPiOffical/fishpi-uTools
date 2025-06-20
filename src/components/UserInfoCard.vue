<template>
  <div class="user-info-card" :style="{ top: y + 'px', left: x + 'px' }">
    <button class="close-btn" @click="$emit('close')">×</button>
    <div class="avatar-section">
      <img
        :src="userInfo?.userAvatarURL48 || userInfo?.userAvatarURL"
        class="avatar"
      />
      <div class="user-basic">
        <div class="nickname">{{ userInfo?.userNickname }}</div>
        <div class="username">@{{ userInfo?.userName }}</div>
        <div class="status-row">
          <span
            class="status-indicator"
            :class="{ online: userInfo?.userOnlineFlag }"
          ></span>
          <span>{{ userInfo?.userOnlineFlag ? "在线" : "离线" }}</span>
        </div>
      </div>
    </div>
    <div class="info-row" v-if="userInfo?.userPoint">
      <span class="label">积分</span>
      <span class="value">{{ userInfo.userPoint }}</span>
    </div>
    <div class="info-row" v-if="userInfo?.userNo">
      <span class="label">编号</span>
      <span class="value"> {{ userInfo.userNo }} 号</span>
    </div>
    <div class="info-row" v-if="userInfo?.mbti">
      <span class="label">MBTI</span>
      <span class="value">{{ userInfo.mbti }}</span>
    </div>
    <div class="info-row" v-if="userInfo?.userCity">
      <span class="label">城市</span>
      <span class="value">{{ userInfo.userCity }}</span>
    </div>
    <div class="info-row" v-if="userInfo?.userIntro">
      <span class="label">简介</span>
      <span class="value">{{ userInfo.userIntro }}</span>
    </div>
    <div class="card-actions" v-if="!isCurrentUser">
      <button
        class="action-btn detail"
        @click="$emit('detail', userInfo?.userName)"
      >
        查看详情
      </button>
      <button
        class="action-btn message"
        @click="$emit('message', userInfo?.userName)"
      >
        发消息
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { userApi } from "../api";
const props = defineProps({
  userName: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  currentUser: { type: String, default: "" },
});
const userInfo = ref(null);

const fetchUserInfo = async () => {
  if (!props.userName) return;
  const res = await userApi.getUserProfile(props.userName);
  userInfo.value = res;
};

const isCurrentUser = computed(() => {
  return props.currentUser === props.userName;
});

watch(() => props.userName, fetchUserInfo, { immediate: true });
onMounted(fetchUserInfo);
</script>

<style scoped>
.user-info-card {
  position: fixed;
  z-index: 3000;
  min-width: 240px;
  max-width: 280px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  padding: 24px 20px 16px 20px;
  color: var(--text-color);
  font-family: inherit;
  animation: fadeIn 0.18s;
  border: 1px solid var(--border-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--card-bg);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 20px;
  color: var(--sub-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s,
    opacity 0.18s;
  box-shadow: none;
  opacity: 0.85;
}
.close-btn:hover {
  background: var(--primary-color);
  color: var(--button-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.08);
  opacity: 1;
}
.close-btn:active {
  opacity: 0.7;
  transform: scale(0.96);
}
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--avatar-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}
.user-basic {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nickname {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.username {
  font-size: 13px;
  color: var(--sub-text-color);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 2px;
}
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  display: inline-block;
}
.status-indicator.online {
  background: var(--signed-color);
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 8px;
  padding: 0 2px;
}
.label {
  color: var(--sub-text-color);
}
.value {
  color: var(--text-color);
  font-weight: 500;
  max-width: 180px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}
.action-btn {
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.action-btn.detail {
  background: var(--hover-bg);
  color: var(--sub-text-color);
}
.action-btn.detail:hover {
  background: var(--card-bg);
}
.action-btn.message {
  background: var(--button-bg);
  color: var(--button-text);
}
.action-btn.message:hover {
  background: var(--primary-color);
}
</style>
