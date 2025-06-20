<template>
  <div
    v-if="visible"
    class="user-context-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @click.stop
  >
    <template v-for="(item, idx) in items" :key="idx">
      <div
        v-if="!item.divider"
        class="menu-item"
        @click="onAction(item.action)"
      >
        <i v-if="item.icon" :class="['menu-icon', item.icon]"></i>
        <span>{{ item.label }}</span>
      </div>
      <div v-else class="menu-divider"></div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  items: Array, // [{label, action, icon, divider}]
});
const emit = defineEmits(["action"]);
function onAction(type) {
  emit("action", type);
}
</script>

<style scoped>
.user-context-menu {
  position: fixed;
  z-index: 3000;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.18);
  padding: 6px 0;
  min-width: 148px;
  border: 1px solid var(--border-color);
  animation: fadeIn 0.18s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px 10px 18px;
  cursor: pointer;
  font-size: 15px;
  color: var(--text-color);
  transition: background 0.18s, color 0.18s;
  border-radius: 6px;
  user-select: none;
}
.menu-item:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}
.menu-icon {
  width: 18px;
  text-align: center;
  font-size: 15px;
  color: var(--sub-text-color);
  flex-shrink: 0;
}
.menu-item:hover .menu-icon {
  color: var(--primary-color);
}
.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0 4px 8px;
  width: calc(100% - 18px);
}
</style>
