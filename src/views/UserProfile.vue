<template>
  <div class="profile-container">
    <!-- 顶部导航栏 -->
    <nav class="profile-nav">
      <button class="nav-back" @click="router.back()">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1 class="nav-title">个人主页</h1>
    </nav>

    <!-- 用户信息卡片 -->
    <section class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <img :src="userInfo?.userAvatarURL" :alt="userInfo?.userNickname" />
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ userInfo?.userNickname }}</h2>
          <p class="profile-username">@{{ userInfo?.userName }}</p>
        </div>
        <div class="profile-actions">
          <button
            class="action-btn follow"
            :class="{ 'is-following': isFollowing }"
            @click="handleFollow"
          >
            {{ isFollowing ? "已关注" : "关注" }}
          </button>
          <button class="action-btn message" disabled>发消息</button>
        </div>
      </div>

      <!-- 用户统计数据 -->
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ userInfo?.userPoint || 0 }}</span>
          <span class="stat-label">积分</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{
            userInfo?.followingUserCount || 0
          }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo?.followerCount || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo?.onlineMinute || 0 }}</span>
          <span class="stat-label">在线时长</span>
        </div>
      </div>
    </section>

    <!-- 个人资料卡片 -->
    <section class="info-section">
      <h3 class="section-title">个人资料</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">用户编号</span>
          <span class="info-value">{{ userInfo?.userNo }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">MBTI</span>
          <span class="info-value">{{ userInfo?.mbti || "未知" }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">在线状态</span>
          <span class="info-value">
            <span
              class="status-indicator"
              :class="{ 'is-online': userInfo?.userOnlineFlag }"
            ></span>
            {{ userInfo?.userOnlineFlag ? "在线" : "离线" }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">个人主页</span>
          <a
            v-if="userInfo?.userURL"
            :href="userInfo.userURL"
            target="_blank"
            class="info-link"
          >
            {{ userInfo.userURL }}
          </a>
          <span v-else class="info-value">未设置</span>
        </div>
      </div>
    </section>

    <!-- 个人简介卡片 -->
    <section class="bio-section">
      <h3 class="section-title">个人简介</h3>
      <div class="bio-content">
        {{ userInfo?.userIntro || "这个人很懒，什么都没写~" }}
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { userApi } from "../api";

const route = useRoute();
const router = useRouter();
const userInfo = ref(null);
const isFollowing = ref(false);

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

onMounted(fetchUserInfo);
</script>

<style scoped>
.profile-container {
  margin: 0 auto;
  padding: 0 16px;
  background: #ffffff;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.profile-nav {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #eaeaea;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0 -16px;
}

.nav-back {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
  font-size: 18px;
}

.nav-title {
  margin-left: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.profile-card {
  margin-top: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.profile-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.profile-username {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.follow {
  background: #1890ff;
  color: white;
  border: none;
}

.action-btn.follow.is-following {
  background: #f5f5f5;
  color: #666;
}

.action-btn.message {
  background: white;
  color: #1890ff;
  border: 1px solid #1890ff;
  cursor: not-allowed;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.info-section,
.bio-section {
  margin-top: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  margin-right: 6px;
}

.status-indicator.is-online {
  background: #52c41a;
}

.info-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 14px;
  word-break: break-all;
}

.info-link:hover {
  text-decoration: underline;
}

.bio-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-actions {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
