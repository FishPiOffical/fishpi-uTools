<template>
  <!-- 固定标题栏移动到post-detail-container外部，但仍在template根下 -->
  <div
    class="fixed-header"
    :class="{ 'fixed-header-visible': isHeaderVisible }"
    v-if="article"
  >
    <div class="fixed-header-content">
      <span class="fixed-title">{{ article.articleTitle }}</span>
      <div class="fixed-meta">
        <img
          :src="article.articleAuthorThumbnailURL48"
          :alt="article.articleAuthorName"
          class="fixed-avatar"
        />
        <span class="fixed-author">{{ article.articleAuthorName }}</span>
      </div>
    </div>
  </div>

  <div class="post-detail-container" ref="containerRef">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
    <div v-else-if="error" class="error-tip">
      <i class="fas fa-exclamation-circle"></i>
      <span>加载失败：{{ error.message }}</span>
    </div>
    <div v-else-if="!article" class="empty-tip">
      <i class="fas fa-box-open"></i>
      <span>帖子不存在或已删除</span>
    </div>
    <!-- 内容区域，当固定标题栏显示时添加顶部内边距 -->
    <div
      v-else
      class="post-content-area"
      :class="{ 'with-fixed-header': isHeaderVisible }"
    >
      <h1 class="post-detail-title">{{ article.articleTitle }}</h1>

      <div class="post-detail-meta">
        <img
          :src="article.articleAuthorThumbnailURL48"
          :alt="article.articleAuthorName"
          class="author-avatar"
        />
        <div class="meta-info">
          <span class="author-name">{{ article.articleAuthorName }}</span>
          <span class="publish-time">{{ article.timeAgo }} 发布</span>
          <span class="view-count"
            ><i class="fas fa-eye"></i>
            {{
              article.articleViewCntDisplayFormat || article.articleViewCount
            }}
            阅读</span
          >
          <span class="comment-count"
            ><i class="fas fa-comments"></i>
            {{ article.articleCommentCount }} 评论</span
          >
        </div>
      </div>

      <div
        class="post-detail-content"
        v-html="article.articleContent || article.articlePreviewContent"
        @click="handleContentClick"
      ></div>

      <!-- 文章操作栏 -->
      <div class="article-actions-bar">
        <div class="action-group">
          <button
            class="action-btn"
            :class="{ active: article.articleVoteStatus === 1 }"
            @click="handleUpvote"
          >
            <i class="fas fa-thumbs-up"></i>
            <span>{{ article.articleGoodCnt || 0 }} 点赞</span>
          </button>
          <button
            class="action-btn"
            :class="{ active: article.articleThankStatus === 1 }"
            @click="handleThank"
          >
            <i class="fas fa-heart"></i>
            <span>{{ article.articleThankCnt || 0 }} 感谢</span>
          </button>
        </div>
      </div>

      <!-- TODO: 评论区域 -->
      <div class="comments-area">
        <div class="comments-header">
          <h3>评论</h3>
          <button class="comment-btn" @click="showCommentDialog = true">
            <i class="fas fa-edit"></i>
            <span>写评论</span>
          </button>
        </div>

        <!-- 评论列表 -->
        <div v-if="commentLoading" class="comment-loading">
          <div class="loading-spinner"></div>
          <span>加载评论中...</span>
        </div>

        <div v-else-if="commentError" class="comment-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>加载评论失败：{{ commentError.message }}</span>
        </div>

        <div
          v-else-if="!comments || comments.length === 0"
          class="empty-comments"
        >
          暂无评论
        </div>

        <template v-else>
          <div class="comment-list">
            <div
              v-for="comment in comments"
              :key="comment.oId"
              class="comment-item"
            >
              <div class="comment-header">
                <img
                  :src="comment.commentAuthorThumbnailURL"
                  :alt="comment.commentAuthorName"
                  class="comment-avatar"
                />
                <div class="comment-info">
                  <div class="comment-author-info">
                    <span class="comment-author">{{
                      comment.commentAuthorNickName || comment.commentAuthorName
                    }}</span>
                    <span
                      v-if="comment.commentAuthorId === article.articleAuthorId"
                      class="author-tag"
                      >作者</span
                    >
                    <div
                      class="user-metals"
                      v-if="comment.sysMetal && comment.sysMetal.length > 0"
                    >
                      <img
                        v-for="metal in comment.sysMetal"
                        :key="metal.name"
                        :src="metal.attr.split('url=')[1].split('&')[0]"
                        :title="metal.description"
                        class="user-metal"
                      />
                    </div>
                  </div>
                  <span class="comment-time">{{ comment.timeAgo }}</span>
                </div>
              </div>

              <div
                class="comment-content"
                v-html="comment.commentContent"
              ></div>

              <div class="comment-actions">
                <button
                  class="action-btn"
                  :class="{ active: comment.commentVote === 1 }"
                  @click="handleCommentUpvote(comment)"
                >
                  <i class="far fa-thumbs-up"></i>
                  <span class="count">{{ comment.commentGoodCnt || 0 }}</span>
                </button>
                <button
                  class="action-btn"
                  :class="{ active: comment.commentThankStatus === 1 }"
                  @click="handleCommentThank(comment)"
                >
                  <i class="far fa-heart"></i>
                  <span class="count">{{ comment.commentThankCnt || 0 }}</span>
                </button>
                <button class="action-btn" @click="handleReply(comment)">
                  <i class="far fa-comment"></i>
                </button>
              </div>

              <!-- 回复列表 -->
              <div
                v-if="comment.replies && comment.replies.length > 0"
                class="reply-list"
              >
                <div
                  v-for="reply in comment.replies"
                  :key="reply.oId"
                  class="reply-item"
                >
                  <div class="reply-header">
                    <img
                      :src="reply.commentAuthorThumbnailURL"
                      :alt="reply.commentAuthorName"
                      class="reply-avatar"
                    />
                    <div class="reply-info">
                      <div class="reply-author-info">
                        <span class="reply-author">{{
                          reply.commentAuthorNickName || reply.commentAuthorName
                        }}</span>
                        <span
                          v-if="
                            reply.commentAuthorId === article.articleAuthorId
                          "
                          class="author-tag"
                          >作者</span
                        >
                        <div
                          class="user-metals"
                          v-if="reply.sysMetal && reply.sysMetal.length > 0"
                        >
                          <img
                            v-for="metal in reply.sysMetal"
                            :key="metal.name"
                            :src="metal.attr.split('url=')[1].split('&')[0]"
                            :title="metal.description"
                            class="user-metal"
                          />
                        </div>
                      </div>
                      <span class="reply-time">{{ reply.timeAgo }}</span>
                    </div>
                  </div>

                  <div
                    class="reply-content"
                    v-html="reply.commentContent"
                  ></div>

                  <div class="reply-actions">
                    <button
                      class="action-btn"
                      :class="{ active: reply.commentVote === 1 }"
                      @click="handleCommentUpvote(reply)"
                    >
                      <i class="far fa-thumbs-up"></i>
                      <span class="count">{{ reply.commentGoodCnt || 0 }}</span>
                    </button>
                    <button
                      class="action-btn"
                      :class="{ active: reply.commentThankStatus === 1 }"
                      @click="handleCommentThank(reply)"
                    >
                      <i class="far fa-heart"></i>
                      <span class="count">{{
                        reply.commentThankCnt || 0
                      }}</span>
                    </button>
                    <button class="action-btn" @click="handleReply(reply)">
                      <i class="far fa-comment"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 评论弹窗 -->
      <el-dialog
        v-model="showCommentDialog"
        :title="
          replyTo
            ? `回复 @${
                replyTo.commentAuthorNickName || replyTo.commentAuthorName
              }`
            : '发表评论'
        "
        width="500px"
        :close-on-click-modal="false"
        @close="handleDialogClose"
      >
        <div class="comment-dialog-content">
          <textarea
            v-model="commentContent"
            class="comment-input"
            :placeholder="replyTo ? `` : '友善地留下一条评论吧 :)'"
            rows="2"
            ref="commentInput"
            autofocus
          ></textarea>
          <div class="comment-options">
            <label class="comment-option">
              <input type="checkbox" v-model="commentAnonymous" />
              <span>匿名评论</span>
            </label>
            <label class="comment-option">
              <input type="checkbox" v-model="commentVisible" />
              <span>仅楼主可见</span>
            </label>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <button
              v-if="replyTo"
              class="cancel-reply-btn"
              @click="cancelReply"
            >
              取消回复
            </button>
            <button
              class="submit-comment-btn"
              :disabled="!commentContent.trim() || isSubmitting"
              @click="submitComment"
            >
              {{ isSubmitting ? "提交中..." : "发表评论" }}
            </button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
  <!-- 添加返回按钮 -->
  <div class="back-to-list" @click="goBack">
    <i class="fas fa-arrow-left"></i>
    <span>返回列表</span>
  </div>
  <!-- 在 template 最后添加图片预览组件 -->
  <vue-easy-lightbox
    :visible="previewVisible"
    :imgs="previewImages"
    :index="previewIndex"
    @hide="previewVisible = false"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { articleApi } from "../api";
import { ElMessage } from "element-plus";
import { onBeforeRouteLeave } from "vue-router";
import VueEasyLightbox from "vue-easy-lightbox";

const route = useRoute();
const router = useRouter();
const article = ref(null);
const loading = ref(true);
const error = ref(null);
const isHeaderVisible = ref(false);
const containerRef = ref(null);

// 评论相关状态
const comments = ref([]);
const commentLoading = ref(false);
const commentError = ref(null);
const commentContent = ref("");
const replyTo = ref(null);
const isSubmitting = ref(false);
const commentAnonymous = ref(false);
const commentVisible = ref(false);
const userCommentViewMode = ref(1);

// 添加评论弹窗控制变量
const showCommentDialog = ref(false);

const commentInput = ref(null);

// 添加图片预览相关状态
const previewVisible = ref(false);
const previewImages = ref([]);
const previewIndex = ref(0);

const fetchArticleDetail = async () => {
  const articleId = route.params.id;
  if (!articleId) {
    error.value = new Error("未提供帖子ID");
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    const response = await articleApi.getArticleDetail(articleId);
    if (response.code === 0 && response.data && response.data.article) {
      article.value = response.data.article;
      // 文章加载完成后立即获取评论
      await fetchComments();
    } else {
      error.value = new Error(response.msg || "获取帖子详情失败");
      article.value = null;
    }
  } catch (err) {
    console.error("获取帖子详情失败:", err);
    error.value = new Error("网络请求失败");
    article.value = null;
  } finally {
    loading.value = false;
  }
};

// 监听滚动事件，检查标题可见性
const handleScroll = () => {
  if (!containerRef.value || !article.value) return;
  const containerRect = containerRef.value.getBoundingClientRect();
  const titleElement = containerRef.value.querySelector(".post-detail-title");

  if (titleElement) {
    const titleRect = titleElement.getBoundingClientRect();
    // 当标题的顶部滚到容器顶部上方时显示固定标题栏
    // 使用 titleRect.top < containerRect.top 判断
    isHeaderVisible.value = titleRect.top < containerRect.top;
  }
};

onMounted(() => {
  fetchArticleDetail();
  // 监听 containerRef 的滚动事件
  setTimeout(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener("scroll", handleScroll);
    }
    // 首次加载后检查一次可见性
    handleScroll();
  }, 100);
});

onUnmounted(() => {
  // 移除 containerRef 的滚动监听
  if (containerRef.value) {
    containerRef.value.removeEventListener("scroll", handleScroll);
  }
});

// 监听路由变化
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      // 重置状态和数据
      article.value = null;
      loading.value = true;
      error.value = null;
      isHeaderVisible.value = false;

      fetchArticleDetail();
      // 路由变化后，重新绑定滚动监听（如果需要）并检查可见性
      // 延迟执行，确保新内容渲染
      setTimeout(() => {
        if (containerRef.value && !containerRef.value._scrollListenerAttached) {
          containerRef.value.addEventListener("scroll", handleScroll);
          containerRef.value._scrollListenerAttached = true;
        }
        handleScroll();
      }, 100);
    }
  }
);

// 处理点赞
const handleUpvote = async () => {
  if (!article.value) return;

  try {
    const response = await articleApi.upvoteArticle(article.value.oId);
    if (response.code === 0) {
      if (response.type === -1) {
        // 点赞成功
        article.value.articleVoteStatus = 1;
        article.value.articleGoodCnt = (article.value.articleGoodCnt || 0) + 1;
        ElMessage.success("点赞成功");
      } else if (response.type === 0) {
        // 取消点赞
        article.value.articleVoteStatus = 0;
        article.value.articleGoodCnt = Math.max(
          0,
          (article.value.articleGoodCnt || 0) - 1
        );
        ElMessage.success("已取消点赞");
      }
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (err) {
    console.error("点赞操作失败:", err);
  }
};

// 处理感谢
const handleThank = async () => {
  if (!article.value) return;

  try {
    const response = await articleApi.thankArticle(article.value.oId);
    if (response.code === 0) {
      // 如果已经感谢过,则不做任何操作
      if (article.value.articleThankStatus === 1) {
        return;
      }
      // 感谢成功
      article.value.articleThankStatus = 1;
      article.value.articleThankCnt = (article.value.articleThankCnt || 0) + 1;
      ElMessage.success("感谢成功");
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (err) {
    console.error("感谢操作失败:", err);
  }
};

// 获取评论列表
const fetchComments = async () => {
  if (!article.value) return;

  try {
    commentLoading.value = true;
    commentError.value = null;
    const response = await articleApi.getArticleComments(article.value.oId);
    if (response.code === 0) {
      // 处理评论数据，将回复归类到对应的评论下
      const commentsMap = new Map();
      const commentsData = response.data.articleComments || [];

      // 先处理所有评论
      commentsData.forEach((comment) => {
        // 所有评论都先作为主评论处理
        commentsMap.set(comment.oId, {
          ...comment,
          replies: [],
        });
      });

      // 再处理回复关系
      commentsData.forEach((comment) => {
        if (comment.commentOriginalCommentId) {
          // 如果是回复，从主评论列表中移除，并添加到对应主评论的replies中
          const parentComment = commentsMap.get(
            comment.commentOriginalCommentId
          );
          if (parentComment) {
            parentComment.replies.push(comment);
            commentsMap.delete(comment.oId); // 从主评论列表中移除
          }
        }
      });

      // 转换为数组并按时间排序
      const sortedComments = Array.from(commentsMap.values()).sort((a, b) => {
        return new Date(b.commentCreateTime) - new Date(a.commentCreateTime);
      });

      // 对每个评论的回复也进行时间排序
      sortedComments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => {
            return (
              new Date(a.commentCreateTime) - new Date(b.commentCreateTime)
            );
          });
        }
      });

      // 更新响应式数据
      comments.value = sortedComments;
      console.log("评论数据:", comments.value);
    } else {
      commentError.value = new Error(response.msg || "获取评论失败");
    }
  } catch (err) {
    console.error("获取评论失败:", err);
    commentError.value = new Error("网络请求失败");
  } finally {
    commentLoading.value = false;
  }
};

// 提交评论
const submitComment = async () => {
  if (!article.value || !commentContent.value.trim()) return;

  try {
    isSubmitting.value = true;
    const params = {
      articleId: article.value.oId,
      commentContent: commentContent.value.trim(),
      commentAnonymous: commentAnonymous.value,
      commentVisible: commentVisible.value,
      userCommentViewMode: userCommentViewMode.value,
    };

    if (replyTo.value) {
      params.commentOriginalCommentId = replyTo.value.oId;
    }

    const response = await articleApi.postComment(params);
    if (response.code === 0) {
      ElMessage.success(replyTo.value ? "回复成功" : "评论成功");
      commentContent.value = "";
      replyTo.value = null;
      commentAnonymous.value = false;
      commentVisible.value = false;
      showCommentDialog.value = false; // 关闭弹窗
      // 重新获取评论列表
      await fetchComments();
      // 更新文章评论数
      article.value.articleCommentCount =
        (article.value.articleCommentCount || 0) + 1;
    } else {
      ElMessage.error(response.msg || "评论失败");
    }
  } catch (err) {
    console.error("评论失败:", err);
    ElMessage.error("评论失败，请稍后重试");
  } finally {
    isSubmitting.value = false;
  }
};

// 处理回复
const handleReply = (comment) => {
  replyTo.value = comment;
  showCommentDialog.value = true;
  // 确保在下一个 tick 后聚焦
  nextTick(() => {
    setTimeout(() => {
      commentInput.value?.focus();
    }, 100);
  });
};

// 取消回复
const cancelReply = () => {
  replyTo.value = null;
  commentContent.value = "";
  showCommentDialog.value = false; // 关闭弹窗
};

// 处理弹窗关闭
const handleDialogClose = () => {
  replyTo.value = null;
  commentContent.value = "";
  commentAnonymous.value = false;
  commentVisible.value = false;
};

// 处理评论点赞
const handleCommentUpvote = async (comment) => {
  try {
    const response = await articleApi.upvoteComment(comment.oId);
    if (response.code === 0) {
      if (response.type === -1) {
        // 点赞成功
        comment.commentVote = 1;
        comment.commentGoodCnt = (comment.commentGoodCnt || 0) + 1;
        ElMessage.success("点赞成功");
      } else if (response.type === 0) {
        // 取消点赞
        comment.commentVote = 0;
        comment.commentGoodCnt = Math.max(0, (comment.commentGoodCnt || 0) - 1);
        ElMessage.success("已取消点赞");
      }
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (err) {
    console.error("点赞操作失败:", err);
  }
};

// 处理评论感谢
const handleCommentThank = async (comment) => {
  try {
    const response = await articleApi.thankComment(comment.oId);
    if (response.code === 0) {
      // 如果已经感谢过,则不做任何操作
      if (comment.commentThankStatus === 1) {
        return;
      }
      // 感谢成功
      comment.commentThankStatus = 1;
      comment.commentThankCnt = (comment.commentThankCnt || 0) + 1;
      ElMessage.success("感谢成功");
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (err) {
    console.error("感谢操作失败:", err);
  }
};

// 添加返回列表方法
const goBack = () => {
  console.log("点击返回按钮");
  router.push("/posts");
};

// 添加路由离开守卫
onBeforeRouteLeave((to, from, next) => {
  console.log("离开帖子详情页", to.path);
  next();
});

// 修改 showCommentDialog 的监听
watch(showCommentDialog, (newVal) => {
  if (newVal) {
    // 确保在下一个 tick 后聚焦
    nextTick(() => {
      setTimeout(() => {
        commentInput.value?.focus();
      }, 100);
    });
  }
});

// 处理图片点击
const handleImageClick = (e) => {
  if (e.target.tagName === "IMG") {
    const imgSrc = e.target.src;
    const allImages = Array.from(
      document.querySelectorAll(".post-detail-content img")
    ).map((img) => ({
      src: img.src,
    }));
    previewIndex.value = allImages.findIndex((img) => img.src === imgSrc);
    previewImages.value = allImages;
    previewVisible.value = true;
  }
};

// 处理链接点击
const handleLinkClick = (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    const url = e.target.href;
    // 使用系统默认浏览器打开链接
    utools.shellOpenExternal(url);
  }
};

// 修改文章内容的点击事件处理
const handleContentClick = (e) => {
  handleImageClick(e);
  handleLinkClick(e);
};
</script>

<style scoped>
.post-detail-container {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.loading,
.empty-tip,
.error-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
  text-align: center;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-tip i,
.error-tip i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d9d9d9;
}

.error-tip {
  color: #f5222d;
}

.post-content-area {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.post-content-area.with-fixed-header {
  /* 当固定标题栏显示时，给内容区域顶部留白 */
  /* padding-top的值应该等于fixed-header的高度 */
  padding-top: 60px; /* 这个值需要与 .fixed-header 的实际高度一致 */
}

.post-detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 24px;
  line-height: 1.4;
  word-break: break-word;
  letter-spacing: -0.5px;
}

.post-detail-meta {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.author-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin-right: 16px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.author-avatar:hover {
  transform: scale(1.05);
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-size: 14px;
  color: #666;
  gap: 20px;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.publish-time,
.view-count,
.comment-count {
  display: flex;
  align-items: center;
  color: #666;
}

.meta-info i {
  margin-right: 6px;
  color: #ff9800;
  font-size: 16px;
}

.post-detail-content {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  word-break: break-word;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 对v-html渲染的内部元素进行样式控制 */
.post-detail-content :deep(p) {
  margin: 0 0 1.2em 0;
  line-height: 1.8;
  width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
}

.post-detail-content :deep(img) {
  max-width: 100%;
  cursor: pointer;
}

.post-detail-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 1.2em 0;
  border: 1px solid #eee;
  width: 100%;
  box-sizing: border-box;
  white-space: pre;
  word-wrap: normal;
  tab-size: 4;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.post-detail-content :deep(pre code) {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  font-size: 0.9em;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: #333;
  display: block;
  line-height: 1.5;
  white-space: pre;
  word-wrap: normal;
  width: 100%;
  box-sizing: border-box;
}

/* 自定义滚动条样式 */
.post-detail-content :deep(pre::-webkit-scrollbar) {
  height: 6px;
  background-color: #f8f9fa;
}

.post-detail-content :deep(pre::-webkit-scrollbar-thumb) {
  background-color: #ddd;
  border-radius: 3px;
}

.post-detail-content :deep(pre::-webkit-scrollbar-thumb:hover) {
  background-color: #ccc;
}

.post-detail-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
  word-break: break-all;
}

.post-detail-content :deep(a:hover) {
  text-decoration: underline;
}

.post-detail-content :deep(blockquote) {
  margin: 1.2em 0;
  padding: 12px 20px;
  border-left: 4px solid #ff9800;
  background-color: #fff8e1;
  color: #666;
  font-style: italic;
}

.post-detail-content :deep(ul),
.post-detail-content :deep(ol) {
  margin: 1.2em 0;
  padding-left: 2em;
}

.post-detail-content :deep(li) {
  margin: 0.5em 0;
}

.post-detail-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
}

.post-detail-content :deep(th),
.post-detail-content :deep(td) {
  padding: 12px;
  border: 1px solid #eee;
}

.post-detail-content :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.comments-area {
  margin-top: 48px;
  border-top: 1px solid #eee;
  padding-top: 24px;
}

.comments-area h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.comment-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ff9800;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-btn:hover {
  background: #f57c00;
  transform: translateY(-1px);
}

.comment-btn i {
  font-size: 14px;
}

.comment-dialog-content {
  padding: 12px 0;
}

.comment-dialog-content .comment-input {
  width: 100%;
  min-height: 80px;
  padding: 8px 0;
  border: none !important;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  background: transparent;
  caret-color: #ff9800;
  outline: none !important; /* 确保移除轮廓 */
  box-shadow: none !important; /* 确保移除阴影 */
}

.comment-dialog-content .comment-input:focus {
  border: none !important;
  outline: none !important; /* 确保聚焦时也无轮廓 */
  box-shadow: none !important; /* 确保聚焦时也无阴影 */
}

.comment-dialog-content .comment-input::placeholder {
  color: #999;
  font-size: 14px;
}

.comment-dialog-content .comment-input::selection {
  background: rgba(255, 152, 0, 0.1);
}

.comment-dialog-content .comment-input::-moz-selection {
  background: rgba(255, 152, 0, 0.1);
}

.comment-dialog-content .comment-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-dialog-content .comment-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.comment-dialog-content .comment-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.comment-dialog-content .comment-option span {
  user-select: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
}

.dialog-footer .submit-comment-btn {
  padding: 8px 24px;
  background: #ff9800;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-footer .submit-comment-btn:hover:not(:disabled) {
  background: #f57c00;
}

.dialog-footer .submit-comment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dialog-footer .cancel-reply-btn {
  padding: 8px 24px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-footer .cancel-reply-btn:hover {
  background: #e8e8e8;
  color: #333;
}

/* 自定义弹窗样式 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

:deep(.el-dialog__body) {
  padding: 0 20px;
}

:deep(.el-dialog__footer) {
  padding: 0 20px 20px;
  border-top: none;
}

.comment-loading,
.comment-error,
.empty-comments {
  text-align: center;
  padding: 32px 20px;
  color: #999;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.comment-error {
  color: #f5222d;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  background: #fff;
  padding: 16px 0;
  position: relative;
}

.comment-item:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -12px;
  height: 1px;
  background: #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}

.comment-info {
  flex: 1;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-author {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.comment-time {
  font-size: 13px;
  color: #999;
}

.comment-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 12px 48px;
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-left: 48px;
}

.comment-actions .action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  height: 32px;
  font-size: 16px;
  color: #666;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.comment-actions .action-btn:hover {
  color: #ff9800;
  background: #fff8e1;
}

.comment-actions .action-btn.active {
  color: #ff9800;
  background: transparent;
}

.comment-actions .action-btn .count {
  font-size: 13px;
  color: #999;
}

.reply-list {
  margin: 12px 0 0 48px;
  padding-left: 12px;
  border-left: 1px solid #f0f0f0;
}

.reply-item {
  padding: 12px 0;
  position: relative;
}

.reply-item:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 1px;
  background: #f5f5f5;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-right: 8px;
}

.reply-info {
  flex: 1;
}

.reply-author-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-author {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.reply-time {
  font-size: 13px;
  color: #999;
}

.reply-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 8px 36px;
}

.reply-actions {
  display: flex;
  gap: 12px;
  margin-left: 36px;
}

.reply-actions .action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
  height: 28px;
  font-size: 14px;
  color: #666;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reply-actions .action-btn:hover {
  color: #ff9800;
  background: #fff8e1;
}

.reply-actions .action-btn.active {
  color: #ff9800;
  background: transparent;
}

.reply-actions .action-btn .count {
  font-size: 12px;
  color: #999;
}

.author-tag {
  background-color: #ff9800;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: normal;
}

.user-metals {
  display: flex;
  gap: 4px;
}

.user-metal {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  width: 100%;
  max-width: 800px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: transform 0.3s ease;
  padding: 12px 20px;
  height: 60px;
  box-sizing: border-box;
}

.fixed-header-visible {
  transform: translateX(-50%) translateY(0);
}

.fixed-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.fixed-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fixed-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fixed-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.fixed-author {
  font-size: 14px;
  color: #666;
}

.article-actions-bar {
  margin: 32px 0;
  padding: 24px 0;
}

.action-group {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  border: 1px solid #ddd;
  border-radius: 24px;
  background: #fff;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
  transform: translateY(-1px);
}

.action-btn.active {
  background: #ff9800;
  border-color: #ff9800;
  color: #fff;
}

.action-btn i {
  font-size: 16px;
}

.author-tag {
  background-color: #ff9800;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: normal;
}

.comment-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
}

.reply-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
}

.comment-options {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.comment-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.comment-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.comment-option span {
  user-select: none;
}

/* 添加返回按钮样式 */
.back-to-list {
  position: fixed;
  right: 32px;
  bottom: 32px;
  background: #ff9800;
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  overflow: hidden;
  will-change: width, border-radius, transform;
}

.back-to-list:hover {
  width: 120px;
  border-radius: 24px;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.3);
}

.back-to-list i {
  font-size: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.back-to-list span {
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  width: 0;
  white-space: nowrap;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-10px);
}

.back-to-list:hover span {
  opacity: 1;
  width: auto;
  margin-left: 6px;
  transform: translateX(0);
}

.back-to-list:hover i {
  font-size: 16px;
  transform: scale(0.9);
}

.back-to-list:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}
</style>
