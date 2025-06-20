<template>
  <div
    v-if="via"
    class="client-info"
    @mouseenter="showDetail = true"
    @mouseleave="showDetail = false"
  >
    <span class="client-text">{{ via.content }}</span>
    <span v-if="showDetail" class="client-detail">{{ version }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { BASE_URL } from "../api/config";

const props = defineProps({
  client: {
    type: String,
    default: "",
  },
});

const via = ref(undefined);
const version = ref("");
const showDetail = ref(false);

const vias = new Map([
  [
    "Windows",
    {
      content: "桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "macOS",
    {
      content: "桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "Linux",
    {
      content: "桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "Chrome",
    {
      content: "Chrome 扩展",
      url: "https://chrome.google.com/webstore/detail/fkaomdjjdbglkbcmfhhlioejkpacbbpe",
    },
  ],
  [
    "Edge",
    {
      content: "Edge 扩展",
      url: "https://microsoftedge.microsoft.com/addons/detail/oldbilakhdpiamjbkocdcdnlnakainfm",
    },
  ],
  [
    "VSCode",
    {
      content: "VsCode 扩展",
      url: "https://marketplace.visualstudio.com/items?itemName=hancel.pwl-chat",
    },
  ],
  [
    "IDEA",
    {
      content: "IDEA 扩展",
      url: "https://plugins.jetbrains.com/plugin/18091-pwl-chat",
    },
  ],
  [
    "Python",
    {
      content: "Python 客户端",
      url: `${BASE_URL}/article/1641135630423`,
    },
  ],
  [
    "Golang",
    {
      content: "Golang 客户端",
      url: `${BASE_URL}/article/1641661864119`,
    },
  ],
  [
    "Web",
    {
      content: "Web",
      url: `${BASE_URL}/cr`,
    },
  ],
  [
    "iOS",
    {
      content: "iPhone 客户端",
      url: "https://apps.apple.com/cn/app/%E6%91%B8%E9%B1%BC%E6%B4%BE/id1617385824",
    },
  ],
  [
    "Android",
    {
      content: "Android 客户端",
      url: `${BASE_URL}/article/1641291342622`,
    },
  ],
  [
    "Mobile",
    {
      content: "移动端",
    },
  ],
  [
    "Extension",
    {
      content: "扩展程序",
    },
  ],
  [
    "PC",
    {
      content: "桌面客户端",
    },
  ],
  [
    "Other",
    {
      content: "其他客户端",
    },
  ],
]);

onMounted(() => {
  if (!props.client) {
    return;
  }
  const client = props.client.split("/");
  if (client.length > 1) {
    version.value = client[1];
  }
  via.value = vias.get(client[0]) ?? { content: client[0] };
});
</script>

<style scoped>
.client-info {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: var(--sub-text-color);
  margin-left: 6px;
}

.client-text {
  color: var(--sub-text-color);
}

.client-detail {
  margin-left: 4px;
  color: var(--sub-text-color);
}
</style>
