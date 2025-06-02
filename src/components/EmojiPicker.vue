<template>
  <div class="emoji-picker" v-if="visible">
    <div class="emoji-picker-header">
      <i class="fas fa-times close-btn" @click="$emit('close')"></i>
    </div>
    <div class="emoji-picker-content">
      <!-- 默认表情 -->
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
      <!-- 表情包 -->
      <div v-else class="emoji-pack-grid">
        <!-- 添加表情包按钮 -->
        <div class="emoji-pack-item upload-btn" @click="handleUpload">
          <i class="fas fa-plus"></i>
          <span>添加表情包</span>
        </div>
        <div
          v-for="pack in emotionPacks"
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
import { ref, onMounted, watch } from "vue";
import { userApi } from "../api/user";
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
];

const currentTab = ref("default");
const defaultEmotions = ref([]);
const emotionPacks = ref([]);

// 监听tab切换
watch(currentTab, (newTab) => {
  if (newTab === "packs") {
    // 切换到表情包tab时重新获取数据
    fetchEmotionPacks();
  }
});

// 获取默认表情
const fetchDefaultEmotions = async () => {
  try {
    const res = await userApi.getDefaultEmotions();
    if (res.code === 0) {
      // 将对象数组转换为表情数组
      defaultEmotions.value = res.data.map((item) => {
        // 获取对象的第一个值（表情）
        return Object.values(item)[0];
      });
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
      // 将字符串解析为数组
      const urls = JSON.parse(res.data);
      // 转换为表情包对象数组
      emotionPacks.value = urls.map((url, index) => ({
        id: index,
        cover: url,
      }));
    }
  } catch (error) {
    console.error("获取表情包失败:", error);
  }
};

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
  // 创建文件输入元素
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".jpg,.jpeg,.png,.gif,.mp4";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // 使用新的上传方法
        const uploadRes = await userApi.uploadImage(file);
        if (uploadRes.code === 0 && uploadRes.data.succMap) {
          const newUrl = uploadRes.data.succMap[file.name];
          if (newUrl) {
            // 更新表情包列表
            const newPacks = [
              ...emotionPacks.value,
              { id: emotionPacks.value.length, cover: newUrl },
            ];
            // 同步到服务器
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
    // 从列表中移除
    const newPacks = emotionPacks.value.filter((p) => p.id !== pack.id);
    // 同步到服务器
    await userApi.syncEmotionPack(
      "emojis",
      JSON.stringify(newPacks.map((p) => p.cover))
    );
    emotionPacks.value = newPacks;
  } catch (error) {
    console.error("删除表情包失败:", error);
  }
};

onMounted(() => {
  fetchDefaultEmotions();
  fetchEmotionPacks();
});
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 320px;
  background: white;
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
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.close-btn {
  cursor: pointer;
  color: #999;
  font-size: 16px;
  padding: 4px;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #666;
}

.emoji-picker-content {
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.emoji-picker-footer {
  padding: 8px;
  border-top: 1px solid #eee;
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
  color: #666;
  font-size: 20px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.tab.active {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
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
  background-color: #f5f5f5;
}

.emoji-pack-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
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
  aspect-ratio: 1;
  object-fit: cover;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 2px dashed #ddd;
  color: #666;
  gap: 8px;
}

.upload-btn:hover {
  background: #e8e8e8;
  border-color: #ccc;
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
</style>
