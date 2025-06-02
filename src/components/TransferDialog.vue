<template>
  <div v-if="visible" class="transfer-dialog-overlay" @click="close">
    <div class="transfer-dialog" @click.stop>
      <h3>转账</h3>
      <div class="transfer-form">
        <div class="form-item">
          <label>金额</label>
          <input type="number" v-model="amount" placeholder="请输入转账金额" />
        </div>
        <div class="form-item">
          <label>备注</label>
          <input type="text" v-model="memo" placeholder="请输入转账备注" />
        </div>
        <div class="dialog-buttons">
          <button class="cancel-btn" @click="close">取消</button>
          <button
            class="confirm-btn"
            @click="confirmTransfer"
            :disabled="isTransferring"
          >
            {{ isTransferring ? "转账中..." : "确认转账" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { userApi } from "../api/user";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  receiverUserName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "success", "error"]);

const amount = ref("");
const memo = ref("");
const isTransferring = ref(false);

const close = () => {
  emit("close");
  amount.value = "";
  memo.value = "";
  isTransferring.value = false;
};

const confirmTransfer = async () => {
  if (!amount.value) {
    alert("请输入转账金额");
    return;
  }

  if (Number(amount.value) <= 0) {
    alert("转账金额必须大于0");
    return;
  }

  isTransferring.value = true;
  try {
    await userApi.transfer(
      props.receiverUserName,
      Number(amount.value),
      memo.value
    );
    emit("success", {
      amount: Number(amount.value),
      memo: memo.value,
    });
    close();
  } catch (error) {
    console.error("转账失败:", error);
    emit("error", error);
  } finally {
    isTransferring.value = false;
  }
};
</script>

<style scoped>
.transfer-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.transfer-dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.transfer-dialog h3 {
  margin: 0 0 20px 0;
  text-align: center;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.dialog-buttons button {
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.dialog-buttons button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
}

.confirm-btn {
  background-color: #1890ff;
  color: white;
}

.cancel-btn:hover {
  background-color: #e8e8e8;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #40a9ff;
}
</style>
