<template>
  <div class="sidebar-container">
    <div class="sidebar-section topic-section">
      <h4>
        当前话题
        <i class="fas fa-edit edit-icon" @click="showEditDialog"></i>
      </h4>
      <p class="topic-text" @click="handleTopicClick">
        {{ currentTopic || "暂无话题" }}
      </p>
    </div>
    <div class="sidebar-section online-users-section">
      <h4>在线用户 ({{ onlineUsers.length }})</h4>
      <ul class="online-users-list">
        <li
          v-for="user in onlineUsers"
          :key="user.userName"
          class="user-item"
          @click="showUserProfile(user.userName)"
        >
          <img
            :src="user.userAvatarURL48"
            :alt="user.userName"
            class="user-avatar"
          />
          <span class="user-name">{{ user.userName }}</span>
        </li>
      </ul>
    </div>

    <!-- Topic Edit Dialog -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <h3>修改话题</h3>
        <div class="dialog-info">
          <p>修改话题需要16积分，将自动从账户中扣除</p>
          <p>最大长度16字符，不合法字符将被自动过滤</p>
        </div>
        <input
          v-model="newTopic"
          type="text"
          maxlength="16"
          placeholder="请输入新话题"
          class="topic-input"
        />
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button
            class="confirm-btn"
            @click="confirmEdit"
            :disabled="!isValidTopic"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { chatApi } from "../api/chat";

const router = useRouter();
const emit = defineEmits(["topic-click"]);

const props = defineProps({
  onlineUsers: {
    type: Array,
    default: () => [],
  },
  currentTopic: {
    type: String,
    default: "",
  },
});

const showDialog = ref(false);
const newTopic = ref("");

const isValidTopic = computed(() => {
  return newTopic.value.trim().length > 0 && newTopic.value.length <= 16;
});

const showEditDialog = () => {
  newTopic.value = props.currentTopic;
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  newTopic.value = "";
};

const confirmEdit = async () => {
  if (!isValidTopic.value) return;

  try {
    const content = `[setdiscuss]${newTopic.value}[/setdiscuss]`;
    await chatApi.sendMessage(content);
    closeDialog();
  } catch (error) {
    console.error("修改话题失败:", error);
  }
};

// 查看用户信息
const showUserProfile = (userName) => {
  router.push(`/user/${userName}`);
};

// 处理话题点击
const handleTopicClick = () => {
  if (props.currentTopic) {
    const formattedTopic = `*\`# ${props.currentTopic} #\`*`;
    emit("topic-click", formattedTopic);
  }
};
</script>

<style scoped>
.sidebar-container {
  padding: 0; /* 移除容器内边距，由内部section控制 */
  width: 150px; /* 根据 Chatroom.vue 中的样式调整 */
  background-color: #f8f9fa; /* 根据 Chatroom.vue 中的样式调整 */
  border-left: 1px solid #eee; /* 添加左侧边框 */
  display: flex; /* 使用flex布局 */
  flex-direction: column; /* 垂直排列子元素 */
  overflow: hidden; /* 防止整体侧边栏溢出 */
  height: 100%; /* 确保sidebar-container填充父容器高度 */
}

.sidebar-section {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 0; /* 移除margin-bottom */
  flex-shrink: 0; /* 防止section被压缩 */
}

.sidebar-section:last-of-type {
  border-bottom: none;
}

.sidebar-section h4 {
  margin-top: 0;
  margin-bottom: 8px; /* 调整h4底部间距 */
  font-size: 15px; /* 调整h4字体大小 */
  color: #555;
  display: flex; /* 使用flex布局让编辑图标对齐 */
  justify-content: space-between; /* 将标题和图标推开 */
  align-items: center; /* 垂直居中 */
}

.edit-icon {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
}

.edit-icon:hover {
  color: #1890ff;
}

.topic-text {
  margin: 0;
  font-size: 14px;
  color: #666;
  word-break: break-word;
  cursor: pointer;
  transition: color 0.2s ease;
}

.topic-text:hover {
  color: #1890ff;
}

.online-users-section {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  height: calc(100% - 80px); /* 减去顶部话题区域的高度 */
}

.online-users-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 15px;
  color: #555;
}

.online-users-list {
  list-style: none;
  padding: 0;
  margin: 0;
  height: calc(100% - 40px);
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.online-users-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.user-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  transition: color 0.2s ease;
}

.user-item:last-child {
  margin-bottom: 0; /* 最后一个item无底部间距 */
}

.user-item:hover {
  color: #1890ff;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
  border: 1px solid #eee;
}

.user-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder-section {
  /* 如果需要特定样式可以单独设置 */
}

.placeholder-section h4 {
  color: #999;
}

.placeholder-text {
  color: #999;
  font-style: italic;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.dialog-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.dialog-info {
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.dialog-info p {
  margin: 4px 0;
}

.topic-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
}

.topic-input:focus {
  outline: none;
  border-color: #1890ff;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-buttons button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background-color: #e8e8e8;
}

.confirm-btn {
  background-color: #1890ff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #40a9ff;
}

.confirm-btn:disabled {
  background-color: #bfbfbf;
  cursor: not-allowed;
}
</style>
