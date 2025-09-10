<template>
  <div :class="['notification-item', { unread: !notification.hasRead }]" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script setup>
  import { defineProps, defineEmits } from "vue";
  import { useRouter, onBeforeRouteLeave } from "vue-router";

  const router = useRouter(); // 获取router实例

  const props = defineProps({
    notification: {
      type: Object,
      required: true,
    },
  });

  const emit = defineEmits(["mark-as-read"]);

  const handleClick = () => {
    console.log("handleClick", props.notification);
    if (!props.notification.hasRead) {
      emit("mark-as-read", props.notification.oId);
    }

    gotoCommentPostDetail(props.notification);
  };

  // 跳转至帖子详情
  const gotoCommentPostDetail = (notificat) => {
    let acticalurl = null; // 帖子url
    const datatype = notificat.dataType ?? 0;
    let cId = null;
    switch (datatype) {
      case 4: // 关注-发布新文章
        acticalurl = notificat.url;
        break;
      case 8: // 积分-感谢回帖
      case 25:  // at我-赞同回帖
        acticalurl = notificat.description;
        break;
      case 0: // 评论
      case 13: // 回复评论
        acticalurl = notificat.commentSharpURL;
        break;
      case 39: // at我-专属红包-聊天室信息
      case 11: //积分明细
        return;
      default:
        return;
    };
    const postid = acticalurl.match(/\/article\/(\d+)/)[1]; // 获取文章ID
    console.log('1', acticalurl.includes('#'))
    if (acticalurl.includes('#')) {
      cId = acticalurl.match(/#(\d+)/)[1]
      // let commentId = acticalurl.split('#')[-1]
    }
    console.log('postid', postid)
    console.log('cid', cId)

    // 跳转帖子 并滚到评论位置
    router.push({
      path: `/post/${postid}`,
      query: {
        commentId: cId
      },
    });
  };
</script>

<style>
  .notification-item {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border-color);
  }

  .notification-item.unread {
    background: var(--hover-bg);
  }

  .notification-item.unread :deep(.user-name),
  .notification-item.unread :deep(.system-title),
  .notification-item.unread :deep(.point-change) {
    color: var(--text-color);
    font-weight: 600;
  }

  .notification-item.unread :deep(.notification-time) {
    color: var(--sub-text-color);
  }

  .notification-item.unread :deep(.notification-time i) {
    color: var(--primary-color);
  }

  :deep(a) {
    color: var(--primary-color);
    text-decoration: none;
  }

  :deep(a:hover) {
    text-decoration: underline;
  }

  :deep(.name-at) {
    color: var(--primary-color);
    font-weight: 500;
  }
</style>