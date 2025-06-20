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
