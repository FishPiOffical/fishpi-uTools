<template>
  <Teleport to="body">
    <div v-if="visible" class="emoji-picker-mask" @click="$emit('close')"></div>
  </Teleport>
  <div class="emoji-picker" v-if="visible">
    <div class="emoji-picker-header">
      <i class="fas fa-times close-btn" @click="$emit('close')"></i>
    </div>
    <div class="emoji-picker-content">
      <div v-if="currentTab === 'default'" class="emoji-grid">
        <span
          v-for="emoji in defaultEmotions"
          :key="emoji"
          class="emoji-item"
          @click="selectEmoji(emoji)"
        >
          <img v-if="emoji.startsWith('http')" :src="emoji" :alt="emoji" />
          <template v-else>{{ emoji }}</template>
        </span>
      </div>
      <div v-else-if="currentTab === 'packs'" class="emoji-pack-grid-wrapper">
        <div class="emoji-pack-grid">
          <div class="emoji-pack-item upload-btn" @click="handleUpload">
            <i class="fas fa-plus"></i>
            <span>添加表情包</span>
          </div>
          <div
            v-for="pack in filteredEmotionPacks"
            :key="pack.id"
            class="emoji-pack-item"
          >
            <img
              :src="pack.cover"
              :alt="pack.name"
              @click="selectEmotionPack(pack)"
            />
            <div class="delete-btn" @click.stop="handleDelete(pack)">
              <i class="fas fa-trash"></i>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="currentTab === 'search'"
        class="emoji-picker-online-search"
      >
        <div class="emoji-picker-online-search-bar">
          <input
            v-model="onlineSearchKeyword"
            type="text"
            placeholder="搜索在线表情包..."
            class="emoji-picker-online-search-input"
            @keydown.enter="() => searchOnlineEmojis(false)"
          />
          <button
            class="emoji-picker-online-search-btn"
            @click="() => searchOnlineEmojis(false)"
          >
            搜索
          </button>
        </div>
        <div
          v-if="showOnlineEmojiSearch"
          class="emoji-picker-online-search-results"
          @scroll="handleOnlineScroll"
        >
          <div class="emoji-picker-online-search-grid">
            <div
              v-for="(image, index) in onlineEmojiSearchResults"
              :key="index"
              class="emoji-picker-online-search-item"
              @click="selectOnlineEmojiImage(image)"
            >
              <img
                :src="image.thumbURL"
                :alt="image.title"
                class="emoji-picker-online-search-image"
                @error="handleOnlineImageError"
              />
            </div>
          </div>
          <div
            v-if="
              onlineEmojiSearchLoading && onlineEmojiSearchResults.length > 0
            "
            class="emoji-picker-online-search-loading"
            style="text-align: center"
          >
            <i class="fas fa-spinner fa-spin"></i>
            <span>加载中...</span>
          </div>
        </div>
        <div
          v-if="
            onlineEmojiSearchLoading && onlineEmojiSearchResults.length === 0
          "
          class="emoji-picker-online-search-loading"
          style="text-align: center; padding: 32px 0"
        >
          <i class="fas fa-spinner fa-spin"></i>
          <span>搜索中...</span>
        </div>
      </div>
    </div>
    <div class="emoji-picker-footer">
      <div class="tabs">
        <span
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          <i :class="tab.icon"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { userApi } from "../api/user";
import { baiduImageAPI } from "../api/baidu";
import { ElMessage } from "element-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select", "close"]);

const tabs = [
  { id: "default", name: "默认表情", icon: "fas fa-smile" },
  { id: "packs", name: "我的收藏", icon: "fas fa-heart" },
  { id: "search", name: "搜索", icon: "fas fa-search" },
];

const currentTab = ref("default");
const defaultEmotions = ref([]);
const emotionPacks = ref([]);
const searchKeyword = ref("");

// 在线表情包搜索相关
const onlineSearchKeyword = ref("");
const onlineEmojiSearchResults = ref([]);
const onlineEmojiSearchLoading = ref(false);
const showOnlineEmojiSearch = ref(false);
const onlineSearchCurrentPage = ref(0);
const onlineSearchHasMore = ref(true);
const onlineSearchPageSize = 20;

// 实时搜索防抖
let debounceTimer = null;
watch(onlineSearchKeyword, (newVal, oldVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchOnlineEmojis(false);
  }, 400);
});

// 监听tab切换
watch(currentTab, (newTab) => {
  if (newTab === "packs") {
    fetchEmotionPacks();
  }
  if (newTab === "search") {
    onlineSearchKeyword.value = "表情包";
    searchOnlineEmojis();
  }
});

// 获取默认表情
const fetchDefaultEmotions = async () => {
  try {
    const res = await userApi.getDefaultEmotions();
    if (res.code === 0) {
      defaultEmotions.value = res.data.map((item) => Object.values(item)[0]);
    }
  } catch (error) {
    console.error("获取默认表情失败:", error);
  }
};

// 获取表情包列表
const fetchEmotionPacks = async () => {
  try {
    const res = await userApi.getEmotionPack("emojis");
    if (res.code === 0) {
      const urls = JSON.parse(res.data);
      emotionPacks.value = urls.map((url, index) => ({
        id: index,
        cover: url,
      }));
    }
  } catch (error) {
    console.error("获取表情包失败:", error);
  }
};

// 过滤本地表情包
const filteredEmotionPacks = computed(() => {
  if (!searchKeyword.value.trim()) return emotionPacks.value;
  return emotionPacks.value.filter((pack) =>
    pack.cover.includes(searchKeyword.value.trim())
  );
});

// 选择表情
const selectEmoji = (emoji) => {
  emit("select", emoji);
  emit("close");
};

// 选择表情包
const selectEmotionPack = (pack) => {
  emit("select", pack);
  emit("close");
};

const handleUpload = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".jpg,.jpeg,.png,.gif,.mp4";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const uploadRes = await userApi.uploadImage(file);
        if (uploadRes.code === 0 && uploadRes.data.succMap) {
          const newUrl = uploadRes.data.succMap[file.name];
          if (newUrl) {
            const newPacks = [
              ...emotionPacks.value,
              { id: emotionPacks.value.length, cover: newUrl },
            ];
            await userApi.syncEmotionPack(
              "emojis",
              JSON.stringify(newPacks.map((pack) => pack.cover))
            );
            emotionPacks.value = newPacks;
          }
        }
      } catch (error) {
        console.error("上传表情包失败:", error);
        ElMessage.error(error.message || "上传失败");
      }
    }
  };
  input.click();
};

const handleDelete = async (pack) => {
  try {
    const newPacks = emotionPacks.value.filter((p) => p.id !== pack.id);
    await userApi.syncEmotionPack(
      "emojis",
      JSON.stringify(newPacks.map((p) => p.cover))
    );
    emotionPacks.value = newPacks;
  } catch (error) {
    console.error("删除表情包失败:", error);
  }
};

// 在线表情包搜索
const searchOnlineEmojis = async (isLoadMore = false) => {
  let keyword = onlineSearchKeyword.value.trim();
  if (keyword && !keyword.endsWith("表情")) {
    keyword = keyword + "表情";
  }
  if (!keyword) {
    showOnlineEmojiSearch.value = false;
    onlineEmojiSearchResults.value = [];
    return;
  }
  if (!isLoadMore) {
    onlineSearchCurrentPage.value = 0;
    onlineEmojiSearchResults.value = [];
    onlineSearchHasMore.value = true;
  }
  if (!onlineSearchHasMore.value) return;

  onlineEmojiSearchLoading.value = true;
  showOnlineEmojiSearch.value = true;
  try {
    const response = await baiduImageAPI.searchEmoji(
      keyword,
      onlineSearchCurrentPage.value,
      onlineSearchPageSize
    );
    const images = baiduImageAPI.parseImageUrls(response);
    if (images.length < onlineSearchPageSize) {
      onlineSearchHasMore.value = false;
    }
    onlineEmojiSearchResults.value = [
      ...onlineEmojiSearchResults.value,
      ...images,
    ];
    onlineSearchCurrentPage.value += 1;
  } catch (error) {
    console.error("在线表情包搜索失败:", error);
    ElMessage.error("在线表情包搜索失败");
    onlineEmojiSearchResults.value = [];
    onlineSearchHasMore.value = false;
  } finally {
    onlineEmojiSearchLoading.value = false;
  }
};

const selectOnlineEmojiImage = (image) => {
  emit("select", image.middleURL || image.thumbURL);
  emit("close");
};

const handleOnlineImageError = (e) => {
  e.target.style.display = "none";
};

// 滚动加载更多
const handleOnlineScroll = (e) => {
  const el = e.target;
  if (
    el.scrollTop + el.clientHeight >= el.scrollHeight - 10 &&
    !onlineEmojiSearchLoading.value &&
    onlineSearchHasMore.value
  ) {
    searchOnlineEmojis(true);
  }
};

onMounted(() => {
  fetchDefaultEmotions();
  fetchEmotionPacks();
});
</script>

<style scoped>
.emoji-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}
.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 320px;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow: hidden;
}
.emoji-picker-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.close-btn {
  cursor: pointer;
  color: var(--sub-text-color);
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  margin-right: 0;
  margin-left: auto;
}
.close-btn:hover {
  color: var(--primary-color);
  background: var(--hover-bg);
}
.emoji-picker-content {
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  max-height: 235px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.emoji-picker-footer {
  padding: 8px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.tabs {
  display: flex;
  justify-content: flex-start;
  gap: 24px;
  padding-left: 12px;
}
.tab {
  cursor: pointer;
  color: var(--sub-text-color);
  font-size: 20px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab:hover {
  color: var(--primary-color);
  background: var(--hover-bg);
}
.tab.active {
  color: var(--primary-color);
  background: var(--hover-bg);
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
}
.emoji-item {
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  text-align: center;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}
.emoji-item img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.emoji-item:hover {
  background-color: var(--hover-bg);
}
.emoji-pack-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.emoji-pack-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
  max-height: 210px;
  overflow-y: auto;
  box-sizing: border-box;
}
.emoji-pack-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s;
  position: relative;
}
.emoji-pack-item img {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.emoji-pack-item:hover img {
  transform: scale(1.05);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg);
  border: 2px dashed var(--border-color);
  color: var(--sub-text-color);
  gap: 8px;
}
.upload-btn:hover {
  background: var(--background-color);
  border-color: var(--primary-color);
}
.upload-btn i {
  font-size: 24px;
}
.upload-btn span {
  font-size: 12px;
}
.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}
.emoji-pack-item:hover .delete-btn {
  opacity: 1;
}
.delete-btn:hover {
  background: rgba(255, 0, 0, 0.7);
}
.emoji-picker-online-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.emoji-picker-online-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.emoji-picker-online-search-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.emoji-picker-online-search-input:focus {
  border-color: var(--primary-color);
}
.emoji-picker-online-search-btn {
  padding: 4px 12px;
  background: var(--primary-color);
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.emoji-picker-online-search-btn:hover {
  background: var(--button-bg);
}
.emoji-picker-online-search-results {
  flex: 1;
  max-height: 180px;
  overflow-y: auto;
}
.emoji-picker-online-search-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sub-text-color);
  font-size: 13px;
  padding: 12px 0;
}
.emoji-picker-online-search-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.emoji-picker-online-search-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s;
}
.emoji-picker-online-search-image {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.emoji-picker-online-search-item:hover img {
  transform: scale(1.05);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
</style>
