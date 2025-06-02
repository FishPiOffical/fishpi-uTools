<template>
  <div></div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";

const handleError = (event) => {
  const { message } = event.detail;
  ElMessage.error(message);
};

onMounted(() => {
  window.addEventListener("fishpi:error", handleError);
});

onUnmounted(() => {
  window.removeEventListener("fishpi:error", handleError);
});
</script>
