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
      <div v-if="onlineUsers.length === 0" class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <ul v-else class="online-users-list">
        <li v-for="user in onlineUsers" :key="user.userName" class="user-item" @click="showUserProfile(user.userName)">
          <img :src="user.userAvatarURL48" :alt="user.userName" class="user-avatar" />
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
        <input v-model="newTopic" type="text" maxlength="16" placeholder="请输入新话题" class="topic-input" />
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button class="confirm-btn" @click="confirmEdit" :disabled="!isValidTopic">
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
    padding: 0;
    width: 150px;
    background-color: var(----card-bg);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .sidebar-section {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .sidebar-section:last-of-type {
    border-bottom: none;
  }

  .sidebar-section h4 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 15px;
    color: var(--text-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .edit-icon {
    font-size: 14px;
    color: var(--sub-text-color);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .edit-icon:hover {
    color: var(--primary-color);
  }

  .topic-text {
    margin: 0;
    font-size: 14px;
    color: var(--sub-text-color);
    word-break: break-word;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .topic-text:hover {
    color: var(--primary-color);
  }

  .online-users-section {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    height: calc(100% - 80px);
  }

  .online-users-section h4 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 15px;
    color: var(--text-color);
  }

  .online-users-list {
    list-style: none;
    padding: 0;
    margin: 0;
    height: calc(100% - 40px);
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .online-users-list::-webkit-scrollbar {
    display: none;
  }

  .user-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-color);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .user-item:last-child {
    margin-bottom: 0;
  }

  .user-item:hover {
    color: var(--primary-color);
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    margin-right: 10px;
    flex-shrink: 0;
    border: 1px solid var(--border-color);
  }

  .user-name {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .placeholder-section h4 {
    color: var(--sub-text-color);
  }

  .placeholder-text {
    color: var(--sub-text-color);
    font-style: italic;
  }

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
    background-color: var(--card-bg);
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .dialog-content h3 {
    margin: 0 0 16px 0;
    color: var(--text-color);
    font-size: 18px;
  }

  .dialog-info {
    margin-bottom: 16px;
    color: var(--sub-text-color);
    font-size: 14px;
  }

  .dialog-info p {
    margin: 4px 0;
  }

  .topic-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 16px;
    background: var(--card-bg);
    color: var(--text-color);
  }

  .topic-input:focus {
    outline: none;
    border-color: var(--primary-color);
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
    background-color: var(--hover-bg);
    color: var(--sub-text-color);
  }

  .cancel-btn:hover {
    background-color: var(--background-color);
  }

  .confirm-btn {
    background-color: var(--primary-color);
    color: var(--button-text);
  }

  .confirm-btn:hover:not(:disabled) {
    background-color: var(--button-bg);
  }

  .confirm-btn:disabled {
    background-color: #bfbfbf;
    cursor: not-allowed;
  }

  .loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    color: var(--sub-text-color);
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>