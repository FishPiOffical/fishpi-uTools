<template>
  <div v-if="dialogVisible" class="welcome-overlay" @click.self="handleClose">
    <div class="welcome-dialog">
      <div class="welcome-content">
        <div class="welcome-header">
          <div class="header-left">
            <i class="fas fa-fish"></i>
            <span>欢迎来到摸鱼派</span>
          </div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="welcome-body">
          <div class="welcome-message">
            <h3>嘿，新朋友！</h3>
            <p>摸鱼派是一个以程序员、设计师、极客为核心的社区</p>
          </div>

          <div class="feature-list">
            <div class="feature-item">
              <i class="fas fa-comments"></i>
              <span>畅所欲言，聊技术、家常、时事</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-gamepad"></i>
              <span>烧脑小游戏，卷来卷去</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-users"></i>
              <span>结识志同道合的朋友</span>
            </div>
          </div>

          <div class="action-area">
            <button class="manual-btn" @click="openManual">
              <i class="fas fa-book"></i>
              查看新人手册
            </button>
            <button class="start-btn" @click="handleClose">开始摸鱼</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const dialogVisible = ref(false);

// 判断是否为新用户
const isNewUser = () => {
  return (
    userStore.userInfo?.userPoint === 500 &&
    userStore.userInfo?.userRole === "新人"
  );
};

const openManual = () => {
  utools.shellOpenExternal("https://fishpi.cn/article/1630569106133");
};

const handleClose = () => {
  dialogVisible.value = false;
  // 可以将状态保存到本地存储，避免重复显示
  utools.dbStorage.setItem("welcomeDialogShown", "true");
};

onMounted(() => {
  // 检查是否为新用户且未显示过欢迎弹框
  if (isNewUser() && !utools.dbStorage.getItem("welcomeDialogShown")) {
    dialogVisible.value = true;
  }
});
</script>

<style scoped>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.welcome-dialog {
  background: white;
  border-radius: 16px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.4s ease;
  overflow: hidden;
}

.welcome-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left i {
  font-size: 24px;
  color: white;
}

.header-left span {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.welcome-body {
  padding: 24px;
}

.welcome-message {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-message h3 {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px 0;
}

.welcome-message p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.feature-item:hover {
  background: #f0f9ff;
  transform: translateX(4px);
}

.feature-item i {
  font-size: 18px;
  color: #409eff;
  width: 24px;
  text-align: center;
}

.feature-item span {
  font-size: 14px;
  color: #333;
}

.action-area {
  display: flex;
  gap: 12px;
}

.manual-btn {
  flex: 1;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.manual-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
}

.start-btn {
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover {
  background: #e8e8e8;
  color: #333;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
