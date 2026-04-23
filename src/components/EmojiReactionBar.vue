<template>
  <div class="bar" v-if="show" :class="{ clickable: pickerTrigger === 'bar' }" @click="handleBarClick">
    <button
      v-for="s in normalizedSummary"
      :key="s.value"
      type="button"
      class="chip"
      :class="{ selected: s.selected }"
      :title="(s.users || []).join('\n')"
      @click.stop="$emit('react', s.value)"
    >
      <span class="emoji">{{ emojiOf(s.value) }}</span>
      <span class="count">{{ s.count || 0 }}</span>
    </button>

    <el-popover
      v-if="pickerTrigger !== 'none'"
      placement="bottom-start"
      trigger="click"
      :width="340"
      popper-class="emoji-reaction-popper"
    >
      <template #reference>
        <button
          v-if="pickerTrigger === 'emoji'"
          type="button"
          class="emoji-trigger"
          title="贴表情"
          @click.stop
        >
          🙂
        </button>
        <button
          v-else-if="pickerTrigger === 'button'"
          type="button"
          class="text-trigger"
          title="贴表情"
          @click.stop
        >
          贴表情
        </button>
      </template>
      <EmojiReactionPicker @select="handlePick" />
    </el-popover>
  </div>
</template>

<script setup>
import { computed } from "vue";
import EmojiReactionPicker from "./EmojiReactionPicker.vue";
import { reactionEmoji } from "../utils/emojiReactions";

const props = defineProps({
  summary: {
    type: Array,
    default: () => [],
  },
  pickerTrigger: {
    type: String,
    default: "emoji", // emoji | button | bar | none
  },
});

const emit = defineEmits(["react"]);

const normalizedSummary = computed(() => {
  const arr = Array.isArray(props.summary) ? props.summary : [];
  // 后端字段：value/emoji/count/selected/users/userDetails
  return arr
    .filter((x) => x && x.value)
    .map((x) => ({
      value: x.value,
      count: x.count ?? 0,
      selected: !!x.selected,
      users: x.users || [],
    }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));
});

const show = computed(() => true);

const emojiOf = (value) => reactionEmoji(value);

const handlePick = (value) => {
  emit("react", value);
};

const handleBarClick = () => {
  if (props.pickerTrigger !== "bar") return;
  // bar 触发模式：点击空白区域会展开 popover（由 reference 按钮承担）
};
</script>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  align-items: center;
}

.bar.clickable {
  cursor: pointer;
}

.chip {
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 999px;
  padding: 2px 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-color);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.chip:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.chip.selected {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.emoji {
  font-size: 14px;
  line-height: 1;
}

.count {
  opacity: 0.85;
}

.emoji-trigger {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--sub-text-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.bar:hover .emoji-trigger {
  opacity: 1;
}

.emoji-trigger:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

.text-trigger {
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--sub-text-color);
  border-radius: 999px;
  padding: 2px 10px;
  cursor: pointer;
}

.text-trigger:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
</style>

