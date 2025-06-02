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
      content: "来自桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "macOS",
    {
      content: "来自桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "Linux",
    {
      content: "来自桌面客户端",
      url: "https://github.com/imlinhanchao/fishpi-desktop/releases",
    },
  ],
  [
    "Chrome",
    {
      content: "来自 Chrome 扩展",
      url: "https://chrome.google.com/webstore/detail/fkaomdjjdbglkbcmfhhlioejkpacbbpe",
    },
  ],
  [
    "Edge",
    {
      content: "来自 Edge 扩展",
      url: "https://microsoftedge.microsoft.com/addons/detail/oldbilakhdpiamjbkocdcdnlnakainfm",
    },
  ],
  [
    "VSCode",
    {
      content: "来自 VsCode 扩展",
      url: "https://marketplace.visualstudio.com/items?itemName=hancel.pwl-chat",
    },
  ],
  [
    "IDEA",
    {
      content: "来自 IDEA 扩展",
      url: "https://plugins.jetbrains.com/plugin/18091-pwl-chat",
    },
  ],
  [
    "Python",
    {
      content: "来自 Python 客户端",
      url: `${BASE_URL}/article/1641135630423`,
    },
  ],
  [
    "Golang",
    {
      content: "来自 Golang 客户端",
      url: `${BASE_URL}/article/1641661864119`,
    },
  ],
  [
    "Web",
    {
      content: "来自 Web",
      url: `${BASE_URL}/cr`,
    },
  ],
  [
    "iOS",
    {
      content: "来自 iPhone 客户端",
      url: "https://apps.apple.com/cn/app/%E6%91%B8%E9%B1%BC%E6%B4%BE/id1617385824",
    },
  ],
  [
    "Android",
    {
      content: "来自 Android 客户端",
      url: `${BASE_URL}/article/1641291342622`,
    },
  ],
  [
    "Mobile",
    {
      content: "来自移动端",
    },
  ],
  [
    "Extension",
    {
      content: "来自扩展程序",
    },
  ],
  [
    "PC",
    {
      content: "来自桌面客户端",
    },
  ],
  [
    "Other",
    {
      content: "来自其他客户端",
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
  color: #8a8a8a;
  margin-left: 6px;
}

.client-text {
  color: #8a8a8a;
}

.client-detail {
  margin-left: 4px;
  color: #999;
}
</style>
