<template>
  <div class="main-layout">
    <WelcomeDialog />
    <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
      <div class="logo">
        <div
          v-show="isCollapsed"
          class="logo-container"
          id="logo-animate"
        ></div>
        <span v-show="!isCollapsed">摸鱼派</span>
      </div>
      <nav class="navigation">
        <ul>
          <li
            v-for="item in navItems"
            :key="item.path"
            @click="navigateTo(item.path)"
            :class="['nav-item', { active: currentPath === item.path }]"
          >
            <i :class="item.icon"></i>
            <span v-show="!isCollapsed">{{ item.name }}</span>
            <div v-show="isCollapsed" class="tooltip">{{ item.name }}</div>
            <span
              v-if="item.path === '/private-chat' && unreadPrivateCount > 0"
              class="notification-badge"
              :class="{ 'badge-collapsed': isCollapsed }"
            >
              {{ unreadPrivateCount }}
            </span>
            <span
              v-if="
                item.path === '/notifications' &&
                notificationStore.unreadCount > 0
              "
              class="notification-badge"
              :class="{ 'badge-collapsed': isCollapsed }"
            >
              {{ notificationStore.unreadCount }}
            </span>
          </li>
        </ul>
      </nav>
      <div
        class="user-info-container"
        :class="{ 'user-info-collapsed': isCollapsed }"
      >
        <div class="user-info-details" @click="showUserProfile">
          <div
            class="user-avatar"
            @mouseenter="showUserCard = true"
            @mouseleave="showUserCard = false"
          >
            <img :src="userStore.userInfo?.userAvatarURL" alt="用户头像" />
            <div v-if="isCollapsed && showUserCard" class="user-card">
              <div class="user-card-item" @click.stop="showSwitchAccount">
                <i class="fas fa-exchange-alt"></i>
                <span>切换账号</span>
              </div>
              <div class="user-card-item" @click.stop="logout">
                <i class="fas fa-sign-out-alt"></i>
                <span>退出登录</span>
              </div>
            </div>
          </div>
          <div class="user-info" v-show="!isCollapsed">
            <div class="username">{{ userStore.userInfo?.userNickname }}</div>
            <div
              class="user-points"
              :class="{ signed: livenessStore.liveness >= 10 }"
            >
              <i class="fas fa-fire"></i>
              <span>{{ livenessStore.liveness || 0 }}</span>
            </div>
          </div>
          <div v-show="isCollapsed" class="collapsed-liveness">
            <div
              class="liveness-info"
              :class="{ signed: livenessStore.liveness >= 10 }"
            >
              <i class="fas fa-fire"></i>
              <span>{{ livenessStore.liveness || 0 }}</span>
            </div>
          </div>
        </div>
        <div v-show="!isCollapsed" class="user-actions">
          <div class="divider"></div>
          <button @click="showSwitchAccount" class="switch-account-button">
            <i class="fas fa-exchange-alt"></i>
            <span>切换账号</span>
          </button>
          <button @click="logout" class="logout-button">
            <i class="fas fa-sign-out-alt"></i>
            <span>退出登录</span>
          </button>
        </div>
      </div>
      <div class="collapse-button" @click="toggleSidebar">
        <i
          :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"
        ></i>
      </div>
    </div>
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" v-if="$route.meta.keepAlive" />
        </keep-alive>
        <component :is="Component" v-if="!$route.meta.keepAlive" />
      </router-view>
    </div>
    <!-- 账号切换弹窗 -->
    <el-dialog
      v-model="showAccountDialog"
      title="切换账号"
      width="360px"
      :close-on-click-modal="false"
      class="account-switch-dialog"
    >
      <div class="account-list">
        <div v-if="savedAccounts.length === 0" class="no-accounts">
          <i class="fas fa-user-plus"></i>
          <span>暂无其他账号</span>
        </div>
        <div
          v-for="account in savedAccounts"
          :key="account.userName"
          class="account-item"
          @click="switchToAccount(account)"
        >
          <img
            :src="account.userAvatarURL"
            :alt="account.userNickname"
            class="account-avatar"
          />
          <div class="account-info">
            <div class="account-name">{{ account.userNickname }}</div>
            <div class="account-username">@{{ account.userName }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAccountDialog = false">取消</el-button>
          <el-button type="primary" @click="goToLogin">去登录</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, h, ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { request } from "../api";
import { useUserStore } from "../stores/user";
import { useNotificationStore } from "../stores/notification";
import { useLivenessStore } from "../stores/liveness";
import wsManager from "../utils/websocket";
import { ElMessage, ElMessageBox } from "element-plus";
import { chatApi } from "../api/chat";
import * as lottie from "lottie-web";
import logoData from "../js/logo";
import WelcomeDialog from "../components/WelcomeDialog.vue";

const router = useRouter();
const route = useRoute();
const currentPath = computed(() => route.path);
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const livenessStore = useLivenessStore();
const unreadPrivateCount = ref(0);
const isCollapsed = ref(false);
const showUserCard = ref(false);
const showAccountDialog = ref(false);
const savedAccounts = ref([]);

const navItems = [
  { path: "/", name: "鱼塘首页", icon: "fas fa-home" },
  { path: "/chatroom", name: "鱼塘聊天", icon: "fas fa-comments" },
  { path: "/private-chat", name: "康康私信", icon: "fas fa-envelope" },
  { path: "/posts", name: "康康帖子", icon: "fas fa-book-reader" },
  { path: "/moon", name: "清风明月", icon: "fas fa-moon" },
  { path: "/notifications", name: "消息通知", icon: "fas fa-bell" },
  { path: "/settings", name: "系统设置", icon: "fas fa-cog" },
];

// 添加新用户判断逻辑
const isNewUser = computed(() => {
  return (
    userStore.userInfo?.userPoint === 500 &&
    userStore.userInfo?.userRole === "新人"
  );
});

// 处理私信消息
const handleMessage = (data) => {
  if (route.path === "/private-chat") {
    console.log("在私信页面，不处理消息");
    return; // 如果在私信页面，不处理消息
  }
  // 处理私信消息
  if (data.command === "newIdleChatMessage") {
    console.log("处理新私信消息");
    unreadPrivateCount.value++;

    // 如果页面可见，使用 ElMessage
    if (document.visibilityState === "visible") {
      ElMessage({
        message: `收到来自 ${data.senderUserName} 的私信：${data.preview}`,
        type: "info",
        duration: 5000,
        showClose: true,
        grouping: false,
        position: "top-right",
        icon: () => {
          return h("img", {
            src: data.senderAvatar,
            style: {
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              marginRight: "8px",
            },
          });
        },
      });
    } else {
      // 如果页面不可见，使用 utools 通知
      utools.showNotification(
        `收到来自 ${data.senderUserName} 的私信：${data.preview}`,
        "fishpi"
      );
    }
  }
  // 处理通知刷新
  if (data.command === "refreshNotification") {
    console.log("收到通知刷新消息");
    if (!("count" in data)) {
      notificationStore.unreadCount++;
      // 如果在通知页面，刷新通知列表
      if (route.path === "/notifications") {
        // 触发通知页面的刷新
        const event = new CustomEvent("refresh-notifications");
        window.dispatchEvent(event);
      }

      // 如果页面可见，使用 ElMessage
      if (document.visibilityState === "visible") {
        ElMessage({
          message: "有新的通知！",
          type: "info",
          duration: 3000,
          showClose: true,
          position: "top-right",
        });
      } else {
        // 如果页面不可见，使用 utools 通知
        utools.showNotification("有新的通知！", "fishpi");
      }
    }
  }
};

onMounted(async () => {
  console.log("Home 组件挂载...");
  await userStore.init();
  await notificationStore.init();
  await livenessStore.init();

  // 初始化 logo 动画
  const params = {
    container: document.getElementById("logo-animate"),
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData: logoData,
  };

  const anim = lottie.loadAnimation(params);

  // 监听侧边栏状态变化
  watch(isCollapsed, (newValue) => {
    if (newValue) {
      // 侧边栏收起时，播放动画
      anim.goToAndPlay(27, true);
    }
  });

  // 如果初始状态是收起，则播放动画
  if (isCollapsed.value) {
    anim.goToAndPlay(27, true);
  }

  // 添加鼠标悬停事件
  setTimeout(() => {
    const logoElement = document.getElementById("logo-animate");
    if (logoElement) {
      logoElement.addEventListener("mouseenter", () => {
        anim.goToAndPlay(10, true);
      });
    }
  }, 1000);

  // 从 utools.dbStorage 获取导航栏状态
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  isCollapsed.value = savedSettings.defaultNavCollapsed || false;

  // 如果未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    router.push("/login");
    return;
  }

  // 获取未读私信消息
  try {
    const unreadResponse = await chatApi.getUnreadMessages();
    if (unreadResponse.data) {
      unreadPrivateCount.value = unreadResponse.data.length;
    }
  } catch (error) {
    console.error("获取未读私信消息失败:", error);
  }

  // 连接私信 WebSocket
  try {
    await wsManager.connect("wss://fishpi.cn/user-channel", {
      connectionId: "home-channel",
    });
    wsManager.on("message", handleMessage, "home-channel");
  } catch (error) {
    console.error("WebSocket 连接失败:", error);
  }
});

onUnmounted(() => {
  // 组件卸载时只关闭 home-channel 连接
  wsManager.close("home-channel");
});

const navigateTo = (route) => {
  if (route === "/private-chat") {
    unreadPrivateCount.value = 0; // 进入私信页面时重置未读数
  }
  router.push(route);
};

const logout = () => {
  userStore.logout();
  request.clearApiKey();
  router.push("/login");
};

const showUserProfile = () => {
  router.push(`/user/${userStore.userInfo?.userName}`);
};

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  // 保存到 utools.dbStorage
  const savedSettings = utools.dbStorage.getItem("fishpi_settings") || {};
  savedSettings.defaultNavCollapsed = isCollapsed.value;
  utools.dbStorage.setItem("fishpi_settings", savedSettings);
};

const showSwitchAccount = () => {
  // 获取已保存的账号列表
  const accounts = utools.dbStorage.getItem("fishpi_accounts") || [];
  savedAccounts.value = accounts.filter(
    (account) => account.userName !== userStore.userInfo?.userName
  );
  showAccountDialog.value = true;
};

const switchToAccount = (account) => {
  try {
    // 保存当前账号设置
    const currentUsername = userStore.userInfo?.userName;
    if (currentUsername) {
      const settings = utools.dbStorage.getItem("fishpi_settings") || {};
      settings[currentUsername] = settings[currentUsername] || {};
      utools.dbStorage.setItem("fishpi_settings", settings);
    }

    // 断开旧的 WebSocket 连接
    wsManager.close("home-channel");

    // 切换到新账号
    userStore.setUserInfo(account);
    showAccountDialog.value = false;
    ElMessage.success("账号切换成功");

    // 重新连接 WebSocket
    wsManager
      .connect("wss://fishpi.cn/user-channel", {
        connectionId: "home-channel",
      })
      .then(() => {
        wsManager.on("message", handleMessage, "home-channel");
      })
      .catch((error) => {
        console.error("WebSocket 连接失败:", error);
      });

    // 触发账号切换事件
    window.dispatchEvent(new CustomEvent("fishpi:account-switched"));
  } catch (error) {
    console.error("切换账号失败:", error);
    ElMessage.error("切换账号失败，请重试");
  }
};

const goToLogin = () => {
  showAccountDialog.value = false;
  router.push("/login");
};
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.sidebar {
  width: 200px;
  background-color: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #eee;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
}

.sidebar-collapsed {
  border-radius: 8px;
  width: 64px;
  padding: 20px 10px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.logo-container {
  width: 55px;
  height: 55px;
  padding-bottom: 6px;
}

.sidebar-collapsed .logo-container {
  margin: 0 auto;
}

.navigation ul {
  list-style: none;
  padding: 0;
}

.navigation li {
  padding: 10px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
}

.navigation li:hover {
  background-color: #f0f0f0;
}

.navigation i {
  margin-right: 10px;
  font-size: 18px;
}

.user-info-container {
  padding: 10px;
  border-top: 1px solid #eee;
}

.user-info-details {
  display: flex;
  align-items: center;
  padding: 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.user-info-details:hover {
  background-color: #f0f0f0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex-grow: 1;
  min-width: 0;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-points {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.user-points i {
  font-size: 12px;
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background-color: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.logout-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.logout-button i {
  font-size: 14px;
}

.content-area {
  flex-grow: 1;
  padding: 0 10px 0 10px;
}

/* Placeholder styles for content areas */
.content-area > div {
  height: 100%;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 4px 0;
  color: #8c8c8c;
  white-space: nowrap;
}

.sidebar-collapsed .nav-item {
  padding: 12px;
  justify-content: center;
}

.sidebar-collapsed .nav-item i {
  margin-right: 0;
}

.nav-item:hover {
  color: #666;
}

.nav-item.active {
  color: #333;
  font-weight: 500;
}

.nav-item i {
  margin-right: 12px;
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.nav-item span {
  font-size: 14px;
}

.notification-badge {
  background-color: #ff4d4f;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  margin-left: 8px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.badge-collapsed {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.user-info-collapsed .user-info-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-info-collapsed .user-avatar {
  margin-right: 0;
  margin-bottom: 4px;
}

.user-info-collapsed .logout-button {
  padding: 8px 0;
}

.user-info-collapsed .logout-button i {
  margin: 0;
}

.collapse-button {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.collapse-button:hover {
  background-color: #f5f5f5;
}

.tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  margin-left: 10px;
}

.tooltip::before {
  content: "";
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent #333 transparent transparent;
}

.nav-item:hover .tooltip,
.user-info-details:hover .tooltip,
.logout-button:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.bottom-tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  margin-left: 10px;
}

.bottom-tooltip::before {
  content: "";
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent #333 transparent transparent;
}

.user-info-details:hover .bottom-tooltip,
.logout-button:hover .bottom-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 欢迎弹框样式 */
:deep(.welcome-dialog) {
  .el-message-box__content {
    padding: 20px;
  }

  .el-message-box__title {
    font-size: 18px;
    font-weight: bold;
  }

  .el-message-box__message {
    padding: 0;
  }

  .el-message-box__btns {
    padding: 10px 20px 20px;
  }

  .el-button--primary {
    background-color: #409eff;
    border-color: #409eff;
  }

  a {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 16px;
    background-color: #f0f9ff;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #e6f7ff;
    }
  }
}

.user-card {
  position: absolute;
  left: 100%;
  top: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 1000;
  min-width: 120px;
}

.user-card-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-card-item:hover {
  background-color: #f5f5f5;
}

.user-card-item i {
  width: 16px;
  color: #666;
}

.user-actions {
  margin-top: 8px;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin-bottom: 8px;
}

.switch-account-button,
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background-color: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-bottom: 2px;
}

.switch-account-button:hover,
.logout-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.switch-account-button i,
.logout-button i {
  font-size: 14px;
}

.collapsed-liveness {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
}

.collapsed-liveness .liveness-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff4d4f;
}

.collapsed-liveness .liveness-info.signed {
  color: #52c41a;
}

.user-points {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.user-points.signed {
  color: #52c41a;
}

.account-switch-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.account-list {
  max-height: 300px;
  overflow-y: auto;
}

.no-accounts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #999;
}

.no-accounts i {
  font-size: 24px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.account-item:hover {
  background-color: #f5f5f5;
}

.account-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.account-username {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
