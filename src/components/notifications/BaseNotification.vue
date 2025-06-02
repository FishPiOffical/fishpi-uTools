<template>
  <div
    :class="['notification-item', { unread: !notification.hasRead }]"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["mark-as-read"]);

const handleClick = () => {
  if (!props.notification.hasRead) {
    emit("mark-as-read", props.notification.oId);
  }
};
</script>

<style scoped>
.notification-item {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.notification-item.unread {
  background: #f8fafc;
}

.notification-item.unread :deep(.user-name),
.notification-item.unread :deep(.system-title),
.notification-item.unread :deep(.point-change) {
  color: #1a1f36;
  font-weight: 600;
}

.notification-item.unread :deep(.notification-time) {
  color: #64748b;
}

.notification-item.unread :deep(.notification-time i) {
  color: #ff9800;
}

:deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

:deep(.name-at) {
  color: #3b82f6;
  font-weight: 500;
}
</style>
