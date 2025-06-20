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

    <!-- 发帖按钮 -->
    <div class="publish-btn" @click="goToPublish">
      <i class="fas fa-pen"></i>
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
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  onActivated,
  onDeactivated,
} from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { articleApi } from "../api";
// import PublishBreezemoon from "../components/PublishBreezemoon.vue"; // 看贴页面没有发布功能

// 添加组件名称，用于keep-alive
defineOptions({
  name: "Posts",
});

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
  if (currentType.value === type) {
    // 如果点击的是当前类型，则刷新数据
    refreshCurrentType();
    return;
  }
  currentType.value = type;
  articles.value = []; // 清空当前列表
  currentPage.value = 1; // 重置页码
  hasMore.value = true; // 重置hasMore
  getArticles(1); // 加载第一页新类型数据
};

// 刷新当前类型的数据
const refreshCurrentType = () => {
  articles.value = []; // 清空当前列表
  currentPage.value = 1; // 重置页码
  hasMore.value = true; // 重置hasMore
  getArticles(1); // 重新加载第一页数据
};

// 添加滚动位置保存方法
const saveScrollPosition = () => {
  if (postsListRef.value) {
    const position = postsListRef.value.scrollTop;
    console.log("保存滚动位置:", position);
    utools.dbStorage.setItem("postsScrollPosition", position);
  }
};

// 添加滚动位置恢复方法
const restoreScrollPosition = () => {
  const savedPosition = utools.dbStorage.getItem("postsScrollPosition");
  console.log("恢复滚动位置:", savedPosition);
  if (postsListRef.value && savedPosition) {
    postsListRef.value.scrollTop = parseInt(savedPosition);
    console.log("设置滚动位置:", postsListRef.value.scrollTop);
  }
};

// 修改滚动处理函数
const handleScroll = () => {
  const listElement = postsListRef.value;
  if (!listElement) return;

  // 判断是否滚动到底部附近
  const isNearBottom =
    listElement.scrollHeight -
      listElement.scrollTop -
      listElement.clientHeight <
    200;

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

// 添加路由离开守卫
onBeforeRouteLeave((to, from, next) => {
  console.log("Posts组件即将离开，保存滚动位置");
  if (postsListRef.value) {
    const position = postsListRef.value.scrollTop;
    console.log("保存滚动位置:", position);
    utools.dbStorage.setItem("postsScrollPosition", position);
  }
  next();
});

// 跳转到发帖页面
const goToPublish = () => {
  utools.shellOpenExternal("https://fishpi.cn/pre-post");
};

onMounted(() => {
  console.log("Posts组件挂载");
  getArticles();
  // 添加滚动事件监听器
  if (postsListRef.value) {
    postsListRef.value.addEventListener("scroll", handleScroll);
  }
});

// 组件被激活时（从缓存中恢复）
onActivated(() => {
  console.log("Posts组件被激活");
  // 恢复滚动位置
  nextTick(() => {
    console.log("准备恢复滚动位置");
    restoreScrollPosition();
  });
});

// 组件被缓存时
onDeactivated(() => {
  console.log("Posts组件被缓存");
});

onUnmounted(() => {
  console.log("Posts组件卸载");
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
  background-color: var(--background-color);
}

.posts-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.posts-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.article-types {
  display: flex;
  gap: 16px;
}

.article-types span {
  font-size: 0.875rem;
  color: var(--sub-text-color);
  cursor: pointer;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.article-types span:hover {
  color: var(--primary-color);
}

.article-types span.active {
  color: var(--primary-color);
  font-weight: 600;
  border-bottom-color: var(--primary-color);
}

.posts-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 24px;
}

/* 删除滚动条样式，继承全局 */

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
  color: var(--sub-text-color);
}

.empty-tip i {
  font-size: 40px;
  margin-bottom: 10px;
  color: var(--border-color);
}

.posts-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-item {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
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
  color: var(--text-color);
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
  border: 2px solid var(--avatar-border);
  flex-shrink: 0;
  background: var(--hover-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.author-name {
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.875rem;
}

.publish-time {
  color: var(--sub-text-color);
  font-size: 0.75rem;
}

.stats {
  display: flex;
  gap: 12px;
  color: var(--sub-text-color);
  font-size: 0.75rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item i {
  color: var(--primary-color);
  font-size: 0.75rem;
}

.post-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-preview {
  color: var(--sub-text-color);
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
  border-top: 1px solid var(--border-color);
}

.post-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background-color: var(--hover-bg);
  color: var(--sub-text-color);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.tag:hover {
  background-color: var(--hover-bg);
  color: var(--sub-text-color);
}

.end-tip {
  text-align: center;
  padding: 24px;
  color: var(--sub-text-color);
  font-size: 0.875rem;
}

.publish-btn {
  position: fixed;
  right: 25px;
  bottom: 35px;
  width: 56px;
  height: 56px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
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

.publish-btn:hover {
  background-color: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.publish-btn i {
  font-size: 24px;
  color: #fff;
}
</style>
