import { request } from "./request";

export const articleApi = {
  // 发布文章
  publishArticle(content, title, categoryId) {
    return request.post("/article", {
      content,
      title,
      categoryId,
    });
  },

  // 获取最近文章
  getRecentArticles(p = 1, size = 20) {
    return request.get("/api/articles/recent", { p, size });
  },

  // 获取点赞文章
  getGoodArticles(p = 1, size = 20) {
    return request.get("/api/articles/recent/good", { p, size });
  },

  // 获取热门文章
  getHotArticles(p = 1, size = 20) {
    return request.get("/api/articles/recent/hot", { p, size });
  },

  // 获取最近回复
  getRecentReplies(p = 1, size = 20) {
    return request.get("/api/articles/recent/reply", { p, size });
  },

  // 获取用户文章
  getUserArticles(username, p = 1, size = 20) {
    return request.get(`/api/user/${username}/articles`, { p, size });
  },

  // 文章打赏
  rewardArticle(articleId) {
    return request.post("/article/reward", { articleId });
  },

  // 获取文章详情
  getArticleDetail(articleId) {
    return request.get(`/api/article/${articleId}`);
  },

  // 感谢文章
  thankArticle(articleId) {
    return request.post(`/article/thank?articleId=${articleId}`);
  },

  // 获取文章评论
  getArticleComments(articleId) {
    return request.get(`/api/comment/${articleId}`);
  },

  // 用户常用表情
  emotions(apiKey) {
    return request.get(`/users/emotions?apiKey=${apiKey}`);
  },

  // 用户名联想
  users(name) {
    return request.post("/users/names", name);
  },

  // 发表评论
  postComment(params) {
    return request.post("/comment", params);
  },
  // 感谢评论
  thankComment(commentId) {
    return request.post("/comment/thank", { commentId });
  },
  // 点赞评论
  upvoteComment(dataId) {
    return request.post("/vote/up/comment", { dataId });
  },

  // 点赞文章
  upvoteArticle(articleId) {
    return request.post("/vote/up/article", { dataId: articleId });
  },
};
