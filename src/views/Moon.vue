<template>
  <div class="moon-container">
    <div class="moon-header">
      <h2>
        清风明月
        <el-tooltip content="点击查看什么是清风明月" placement="top">
          <span class="help-icon" @click="openHelpLink">?</span>
        </el-tooltip>
      </h2>
    </div>

    <div class="moon-list" ref="moonListRef">
      <div v-if="loading && breezemoons.length === 0" class="loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="breezemoons.length === 0 && !loading" class="empty-tip">
        <i class="fas fa-moon"></i>
        <span>暂无内容</span>
      </div>
      <div v-else class="moon-items">
        <div v-for="item in breezemoons" :key="item.oId" class="moon-item">
          <div class="moon-item-header">
            <img
              :src="item.breezemoonAuthorThumbnailURL48"
              :alt="item.breezemoonAuthorName"
              class="user-avatar"
            />
            <div class="user-info">
              <span class="user-name">{{ item.breezemoonAuthorName }}</span>
            </div>
          </div>
          <div class="moon-content" v-html="item.breezemoonContent"></div>
          <div class="moon-meta">
            <div class="publish-time">
              <i class="fas fa-clock"></i>
              <span>{{ item.timeAgo }}</span>
            </div>
            <div class="user-location" v-if="item.breezemoonCity">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ item.breezemoonCity }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="loading && breezemoons.length > 0"
        class="loading-more-spinner"
      >
        <div class="loading-spinner"></div>
      </div>
      <div v-if="!hasMore && breezemoons.length > 0" class="end-tip">
        ———— 没有更多了 ————
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <div class="back-to-top" v-show="showBackToTop" @click="scrollToTop">
      <i class="fas fa-arrow-up"></i>
    </div>

    <!-- 发布组件 -->
    <PublishBreezemoon @publish-success="handlePublishSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { breezemoonApi } from "../api";
import PublishBreezemoon from "../components/PublishBreezemoon.vue";
import { ElTooltip } from "element-plus";

const breezemoons = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 20;
const moonListRef = ref(null); // 列表容器的引用

// 返回顶部相关
const showBackToTop = ref(false);

// 获取清风明月列表
const getBreezemoons = async (page = 1) => {
  if (loading.value) return; // 防止重复加载
  try {
    loading.value = true;
    const response = await breezemoonApi.getBreezemoons(page, pageSize);
    const data = response.breezemoons || [];
    if (page === 1) {
      breezemoons.value = data;
    } else {
      breezemoons.value = [...breezemoons.value, ...data];
    }
    hasMore.value = data.length > 0;
    console.log(`hasMore: ${hasMore.value}`);
    currentPage.value = page; // 更新当前页码
  } catch (error) {
    // 加载失败时也需要将loading设为false，并可能根据情况处理hasMore
    hasMore.value = false; // 假设加载失败意味着没有更多了
  } finally {
    loading.value = false;
    console.log(`loading: ${loading.value}`);
  }
};

// 滚动处理函数
const handleScroll = () => {
  const listElement = moonListRef.value;
  if (!listElement) return;

  // 显示返回顶部按钮
  showBackToTop.value = listElement.scrollTop > 300;

  // 判断是否滚动到底部附近
  const isNearBottom =
    listElement.scrollHeight -
      listElement.scrollTop -
      listElement.clientHeight <
    100;
  if (isNearBottom && !loading.value && hasMore.value) {
    getBreezemoons(currentPage.value + 1);
  }
};

// 返回顶部
const scrollToTop = () => {
  if (moonListRef.value) {
    moonListRef.value.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

// 处理发布成功
const handlePublishSuccess = () => {
  currentPage.value = 1;
  // 重新加载第一页，并滚动到顶部
  getBreezemoons(1);
  if (moonListRef.value) {
    moonListRef.value.scrollTop = 0;
  }
};

// 打开帮助链接
const openHelpLink = () => {
  utools.shellOpenExternal("https://fishpi.cn/article/1630938317106");
};

onMounted(() => {
  getBreezemoons();
  // 添加滚动事件监听器
  if (moonListRef.value) {
    moonListRef.value.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  // 移除滚动事件监听器
  if (moonListRef.value) {
    moonListRef.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
.moon-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: var(--background-color);
}

.moon-header h2 {
  margin: 0 0 24px 0;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.moon-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 24px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--sub-text-color);
}

.loading-more-spinner {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--hover-bg);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0; /* 列表底部的spinner不需要底部margin */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--sub-text-color);
}

.empty-tip i {
  font-size: 40px;
  margin-bottom: 10px;
  color: var(--border-color);
}

.moon-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.moon-item {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

.moon-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--avatar-border);
  flex-shrink: 0;
  background: var(--hover-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.moon-content {
  color: var(--text-color);
  line-height: 1.7;
  word-break: break-word;
  font-size: 1rem;
  padding: 0;
  border: none;
}

.moon-content :deep(p) {
  margin: 0 0 16px 0;
}

.moon-content :deep(p):last-child {
  margin-bottom: 0;
}

.moon-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.moon-content :deep(a:hover) {
  text-decoration: underline;
}

.moon-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 16px 0;
}

.moon-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--sub-text-color);
  font-size: 0.875rem;
}

.publish-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.publish-time i {
  font-size: 0.875rem;
}

.user-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-location i {
  font-size: 0.875rem;
}

.end-tip {
  text-align: center;
  padding: 24px;
  color: var(--sub-text-color);
  font-size: 0.875rem;
}

.back-to-top {
  position: fixed;
  right: 30px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  background-color: var(--card-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  z-index: 100;
  border: 1px solid var(--border-color);
}

.back-to-top:hover {
  background-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.back-to-top:hover i {
  color: #fff;
}

.back-to-top i {
  color: var(--sub-text-color);
  font-size: 24px;
  transition: color 0.3s;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--hover-bg);
  color: var(--sub-text-color);
  font-size: 12px;
  margin-left: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-icon:hover {
  background-color: var(--border-color);
  color: var(--text-color);
}
</style>
