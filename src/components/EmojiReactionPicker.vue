<template>
  <div class="picker">
    <button
      v-for="r in reactions"
      :key="r.value"
      class="emoji-btn"
      type="button"
      :title="r.label"
      @click="$emit('select', r.value)"
    >
      <span class="emoji">{{ r.emoji }}</span>
    </button>
  </div>
</template>

<script setup>
import { EMOJI_REACTIONS as reactions } from "../utils/emojiReactions";

defineEmits(["select"]);
</script>

<style scoped>
.picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 6px;
  max-width: 320px;
}

.emoji-btn {
  width: 44px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.emoji-btn:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.emoji-btn:active {
  transform: scale(0.96);
}

.emoji {
  font-size: 16px;
  line-height: 1;
  white-space: nowrap;
}
</style>

