<template>
  <div class="profile-page">
    <!-- 顶部导航 -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>{{ isCurrentUser ? "我的主页" : "TA的主页" }}</h1>
      <!-- 添加一个占位符元素，用于在没有编辑按钮时帮助居中标题 -->
      <div class="nav-placeholder"></div>
    </header>

    <!-- 可滚动内容区域 -->
    <div class="scrollable-content">
      <!-- 用户信息区 -->
      <div
        class="user-header"
        :style="{ backgroundImage: `url(${userInfo?.cardBg})` }"
      >
        <div class="user-info">
          <div class="avatar">
            <img :src="userInfo?.userAvatarURL" :alt="userInfo?.userNickname" />
            <span v-if="userInfo?.userRole" class="role-tag">{{
              userInfo.userRole
            }}</span>
          </div>
          <div class="info">
            <h2>{{ userInfo?.userNickname }}</h2>
            <p class="username">@{{ userInfo?.userName }}</p>
            <p class="user-no">摸鱼派第 {{ userInfo?.userNo }} 号成员</p>
            <p v-if="userInfo?.userCity" class="location">
              <i class="fas fa-map-marker-alt"></i>
              {{ userInfo.userCity }}
            </p>
          </div>
          <div v-if="!isCurrentUser" class="actions">
            <button
              v-if="userInfo?.canFollow !== 'hide'"
              class="btn follow"
              :class="{ active: isFollowing }"
              @click="handleFollow"
            >
              {{ isFollowing ? "已关注" : "关注" }}
            </button>
            <button class="btn message" @click="handleMessage">发消息</button>
          </div>

          <!-- 只显示个人简介内容，如果有的话 -->
          <div v-if="userInfo?.userIntro" class="bio-content-inline-only">
            {{ userInfo?.userIntro }}
          </div>
        </div>
      </div>

      <!-- 主要内容区 -->
      <main class="main-content">
        <!-- 数据统计 -->
        <div class="stats">
          <div class="stat-item">
            <span class="value">{{ userInfo?.userPoint || 0 }}</span>
            <span class="label">积分</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ userInfo?.followingUserCount || 0 }}</span>
            <span class="label">关注</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ userInfo?.followerCount || 0 }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="stat-item">
            <span class="value">{{ userInfo?.onlineMinute || 0 }}</span>
            <span class="label">在线时长/分钟</span>
          </div>
        </div>

        <!-- 徽章展示 -->
        <section
          v-if="
            userInfo?.allMetalOwned &&
            JSON.parse(userInfo.allMetalOwned).list?.length > 0
          "
          class="section badges"
        >
          <h3>{{ isCurrentUser ? "我的勋章" : "TA的勋章" }}</h3>
          <div class="badge-list">
            <div
              v-for="(badge, index) in JSON.parse(userInfo.allMetalOwned).list"
              :key="index"
              class="badge"
              :style="getBadgeStyle(badge.attr)"
            >
              <img :src="getBadgeImage(badge.attr)" :alt="badge.name" />
              <div class="badge-info">
                <span class="name">{{ badge.name }}</span>
                <span class="desc">{{ badge.description }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 个人资料 -->
        <section class="section profile">
          <h3>个人资料</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="label">用户编号</span>
              <span class="value">{{ userInfo?.userNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">MBTI</span>
              <span class="value">{{ userInfo?.mbti || "未知" }}</span>
            </div>
            <div class="info-item">
              <span class="label">在线状态</span>
              <span class="value">
                <span
                  class="status"
                  :class="{ online: userInfo?.userOnlineFlag }"
                ></span>
                {{ userInfo?.userOnlineFlag ? "在线" : "离线" }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">个人主页</span>
              <a
                v-if="userInfo?.userURL"
                :href="userInfo.userURL"
                target="_blank"
                class="link"
              >
                {{ userInfo.userURL }}
              </a>
              <span v-else class="value">未设置</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { userApi } from "../api";
import { useUserStore } from "../stores/user";

const route = useRoute();
const router = useRouter();
const userInfo = ref(null);
const isFollowing = ref(false);

const userStore = useUserStore();

const isCurrentUser = computed(() => {
  return userStore.userInfo?.userName === userInfo.value?.userName;
});

const getBadgeStyle = (attr) => {
  const params = new URLSearchParams(attr);
  return {
    backgroundColor: params.get("backcolor") || "#ffffff",
    color: params.get("fontcolor") || "#333333",
  };
};

const getBadgeImage = (attr) => {
  const params = new URLSearchParams(attr);
  return params.get("url");
};

const handleEdit = () => {
  router.push("/settings/profile");
};

const handleUserMessage = (userName) => {
  utools.dbStorage.setItem("private-chat-user", userName);
  router.push(`/private-chat?user=${userName}`);
};

const fetchUserInfo = async () => {
  try {
    const username = route.params.username;
    const response = await userApi.getUserProfile(username);
    userInfo.value = response;
    isFollowing.value = response.isFollowing ?? false;
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }
};

const handleFollow = async () => {
  try {
    if (isFollowing.value) {
      await userApi.unfollowUser(userInfo.value.userId);
      isFollowing.value = false;
      userInfo.value.followerCount = Math.max(
        (userInfo.value.followerCount || 0) - 1,
        0
      );
    } else {
      await userApi.followUser(userInfo.value.userId);
      isFollowing.value = true;
      userInfo.value.followerCount = (userInfo.value.followerCount || 0) + 1;
    }
  } catch (error) {
    console.error("关注/取关操作失败:", error);
  }
};

onMounted(async () => {
  await fetchUserInfo();
});
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-color);
  overflow: hidden;
}

.header {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: var(--card-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.back-btn,
.edit-btn {
  position: absolute;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--text-color);
  font-size: 18px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
  flex-shrink: 0;
  z-index: 1;
}

.back-btn {
  left: 16px;
}

.edit-btn {
  right: 16px;
}

.header h1 {
  width: 100%;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: var(--text-color);
}

.nav-placeholder {
  position: absolute;
  right: 16px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.user-header {
  position: relative;
  padding: 24px 16px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.user-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4),
    rgba(0, 0, 0, 0.2)
  );
}

.user-info {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
  flex-wrap: wrap;
  color: #fff;
}

.avatar {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--avatar-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.role-tag {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
}

.info {
  flex: 1;
  min-width: 180px;
}

.info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.username {
  margin: 4px 0;
  font-size: 14px;
  opacity: 0.9;
  color: #fff;
}

.user-no {
  margin: 4px 0;
  font-size: 14px;
  color: #fff;
}

.location {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  color: #fff;
}

.actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.follow {
  background: var(--primary-color);
  color: #fff;
}

.btn.follow.active {
  background: var(--hover-bg);
  color: var(--sub-text-color);
}

.btn.message {
  background: var(--card-bg);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  padding-bottom: 32px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  background: var(--card-bg);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.stat-item {
  background: none;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  text-align: center;
}

.stat-item .value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-item .label {
  font-size: 13px;
  color: var(--sub-text-color);
}

.section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.badge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: transform 0.2s;
  background: none;
  box-shadow: none;
}

.badge:hover {
  transform: translateY(-2px);
}

.badge img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.badge-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.badge-info .name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.badge-info .desc {
  font-size: 12px;
  color: var(--sub-text-color);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: none;
  border-radius: 0;
}

.info-item .label {
  font-size: 14px;
  color: var(--sub-text-color);
}

.info-item .value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
}

.status {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  margin-right: 6px;
}

.status.online {
  background: var(--signed-color);
}

.link {
  color: var(--primary-color);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* 新增的个人简介内联样式 */
.bio-content-inline-only {
  width: 100%;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  opacity: 0.9;
  color: #fff;
}

@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .actions {
    width: auto;
    justify-content: center;
  }

  /* 移动端调整内联简介样式 */
  .bio-content-inline-only {
    margin-top: 16px;
    text-align: center;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    padding: 16px;
  }

  .badge-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .btn {
    padding: 6px 16px;
    font-size: 13px;
  }
}
</style>
