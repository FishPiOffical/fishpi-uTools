<template>
  <div class="posts-container">
    <div class="posts-header">
      <h2>看贴</h2>
      <div class="article-types">
        <span
          v-for="type in articleTypes"
          :key="type.value"
          :class="{ active: currentType === type.value }"
          @click="changeType(type.value)"
        >
          {{ type.label }}
        </span>
      </div>
    </div>

    <div class="posts-list" ref="postsListRef">
      <div v-if="loading && articles.length === 0" class="loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <div v-else-if="articles.length === 0 && !loading" class="empty-tip">
        <i class="fas fa-clipboard-list"></i>
        <span>暂无文章</span>
      </div>
      <div v-else class="posts-items">
        <div
          v-for="article in articles"
          :key="article.oId"
          class="post-item"
          @click="goToPostDetail(article.oId)"
        >
          <div class="post-item-header">
            <div class="post-info">
              <div class="post-title">{{ article.articleTitle }}</div>
              <div class="post-meta">
                <div class="author-info">
                  <img
                    :src="article.articleAuthorThumbnailURL48"
                    :alt="article.articleAuthorName"
                    class="user-avatar"
                  />
                  <span class="author-name">{{
                    article.articleAuthor.userNickname ||
                    article.articleAuthor.userName
                  }}</span>
                  <span class="publish-time">{{ article.timeAgo }}</span>
                </div>
                <div class="stats">
                  <span class="stat-item">
                    <i class="fas fa-eye"></i>
                    {{
                      article.articleViewCntDisplayFormat ||
                      article.articleViewCount
                    }}
                  </span>
                  <span class="stat-item" v-if="article.articleGoodCnt > 0">
                    <i class="fas fa-thumbs-up"></i>
                    {{ article.articleGoodCnt }}
                  </span>
                  <span class="stat-item" v-if="article.articleThankCnt > 0">
                    <i class="fas fa-heart"></i>
                    {{ article.articleThankCnt }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="post-content">
            <div
              class="post-preview"
              v-html="truncateContent(article.articlePreviewContent)"
            ></div>
            <div class="post-footer">
              <div class="post-tags" v-if="article.articleTags">
                <span
                  v-for="tag in article.articleTags.split(',')"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading && articles.length > 0" class="loading-more-spinner">
        <div class="loading-spinner"></div>
      </div>
      <div v-if="!hasMore && articles.length > 0" class="end-tip">
        ———— 没有更多了 ————
      </div>
    </div>

    <!-- 看贴页面没有发布功能，不引入发布组件 -->
    <!-- <PublishBreezemoon @publish-success="handlePublishSuccess" /> -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { articleApi } from "../api";
import { useRouter } from "vue-router"; // 引入useRouter
// import PublishBreezemoon from "../components/PublishBreezemoon.vue"; // 看贴页面没有发布功能

const articles = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 20;
const postsListRef = ref(null); // 列表容器的引用

const articleTypes = ref([
  { label: "最近", value: "recent" },
  { label: "点赞", value: "good" },
  { label: "热门", value: "hot" },
  { label: "最近回复", value: "reply" },
]);
const currentType = ref("recent"); // 默认显示最近文章

const router = useRouter(); // 获取router实例

// 获取文章列表
const getArticles = async (page = 1) => {
  if (loading.value) return; // 防止重复加载

  try {
    loading.value = true;
    let response;
    switch (currentType.value) {
      case "recent":
        response = await articleApi.getRecentArticles(page, pageSize);
        break;
      case "good":
        response = await articleApi.getGoodArticles(page, pageSize);
        break;
      case "hot":
        response = await articleApi.getHotArticles(page, pageSize);
        break;
      case "reply":
        response = await articleApi.getRecentReplies(page, pageSize);
        break;
      default:
        response = await articleApi.getRecentArticles(page, pageSize);
    }

    // 检查返回结构，有些接口可能直接返回数组，有些可能在data属性里
    const data = response.data
      ? response.data.articles || response.data
      : response.articles || response; // 尝试多种路径获取列表数据
    console.log(data[1]);

    if (page === 1) {
      articles.value = data;
      // 滚动到顶部
      if (postsListRef.value) {
        postsListRef.value.scrollTop = 0;
      }
    } else {
      articles.value = [...articles.value, ...data];
    }
    hasMore.value = data.length > 0; // 宽松的判断：只要返回数据量大于0，就认为可能还有下一页

    currentPage.value = page; // 更新当前页码
  } catch (error) {
    console.error("获取文章列表失败:", error);
    // 加载失败时也需要将loading设为false，并可能根据情况处理hasMore
    hasMore.value = false; // 假设加载失败意味着没有更多了
  } finally {
    loading.value = false;
  }
};

// 跳转到帖子详情页
const goToPostDetail = (articleId) => {
  router.push({ path: `/post/${articleId}` }); // 注意这里的路径，需要包含/home
};

// 切换文章类型
const changeType = (type) => {
  if (currentType.value === type) return; // 防止重复点击当前类型
  currentType.value = type;
  articles.value = []; // 清空当前列表
  currentPage.value = 1; // 重置页码
  hasMore.value = true; // 重置hasMore
  getArticles(1); // 加载第一页新类型数据
};

// 滚动处理函数
const handleScroll = () => {
  const listElement = postsListRef.value;
  if (!listElement) return;

  // 判断是否滚动到底部附近 (例如，距离底部小于100px)
  const isNearBottom =
    listElement.scrollHeight -
      listElement.scrollTop -
      listElement.clientHeight <
    200; // 稍微增大触发距离，提前加载

  if (isNearBottom && !loading.value && hasMore.value) {
    getArticles(currentPage.value + 1);
  }
};

// 看贴页面没有发布功能，不需要handlePublishSuccess
// const handlePublishSuccess = () => {
//   currentPage.value = 1;
//   getArticles(1);
// };

// 截断预览内容
const truncateContent = (content) => {
  if (!content) return "";
  // 移除HTML标签
  const plainText = content.replace(/<[^>]+>/g, "");
  // 截取前100个字符
  return plainText.length > 100 ? plainText.slice(0, 100) + "..." : plainText;
};

onMounted(() => {
  getArticles();
  // 添加滚动事件监听器
  if (postsListRef.value) {
    postsListRef.value.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  // 移除滚动事件监听器
  if (postsListRef.value) {
    postsListRef.value.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
.posts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #f8fafc;
}

.posts-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.posts-header h2 {
  margin: 0;
  color: #1a1f36;
  font-size: 1.5rem;
  font-weight: 600;
}

.article-types {
  display: flex;
  gap: 16px;
}

.article-types span {
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.article-types span:hover {
  color: #ff9800;
}

.article-types span.active {
  color: #ff9800;
  font-weight: 600;
  border-bottom-color: #ff9800;
}

.posts-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 24px;
}

/* 滚动条样式优化 */
.posts-list::-webkit-scrollbar {
  width: 8px;
}

.posts-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.posts-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.posts-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
}

.loading-more-spinner {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0;
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
  color: #999;
}

.empty-tip i {
  font-size: 40px;
  margin-bottom: 10px;
  color: #d9d9d9;
}

.posts-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-item {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  cursor: pointer;
}

.post-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.post-item-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-title {
  font-weight: 600;
  color: #1a1f36;
  font-size: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;
  background: #f8fafc;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.author-name {
  color: #1a1f36;
  font-weight: 500;
  font-size: 0.875rem;
}

.publish-time {
  color: #64748b;
  font-size: 0.75rem;
}

.stats {
  display: flex;
  gap: 12px;
  color: #64748b;
  font-size: 0.75rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item i {
  color: #ff9800;
  font-size: 0.75rem;
}

.post-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-preview {
  color: #64748b;
  line-height: 1.7;
  font-size: 0.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.03);
}

.post-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background-color: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.tag:hover {
  background-color: #f1f5f9;
  color: #64748b;
}

.end-tip {
  text-align: center;
  padding: 24px;
  color: #64748b;
  font-size: 0.875rem;
}
</style>
