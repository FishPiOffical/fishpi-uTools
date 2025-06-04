<template>
  <div class="login-container">
    <div class="login-content">
      <!-- 左侧登录框 -->
      <div class="login-box">
        <div class="login-header">
          <h2>登录</h2>
          <p class="login-subtitle">欢迎回来，请登录您的账号</p>
        </div>
        <div class="form-content">
          <div class="form-item">
            <div class="input-wrapper">
              <i class="fas fa-user"></i>
              <input
                v-model="form.username"
                type="text"
                placeholder="用户名/邮箱"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>
          <div class="form-item">
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input
                v-model="form.password"
                type="password"
                placeholder="密码"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>
          <div class="form-item">
            <div class="input-wrapper">
              <i class="fas fa-shield-alt"></i>
              <input
                v-model="form.mfaCode"
                type="text"
                placeholder="两步验证码(未开启请留空)"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>
          <div class="form-item">
            <button class="login-btn" :disabled="loading" @click="handleLogin">
              {{ loading ? "登录中..." : "登录" }}
            </button>
          </div>
          <div class="form-footer">
            <a href="#" class="footer-link" @click.prevent="goToRegister">
              <i class="fas fa-user-plus"></i>
              注册账号
            </a>
            <span class="divider">|</span>
            <a href="#" class="footer-link" @click.prevent="goToForgetPwd">
              <i class="fas fa-key"></i>
              忘记密码
            </a>
          </div>
        </div>
      </div>

      <!-- 右侧欢迎文案 -->
      <div class="welcome-section">
        <h2>Hi，鱼油，欢迎来到摸鱼派！</h2>
        <p class="welcome-subtitle">
          如果你也是奋斗在一线、热爱工作的苦逼青年，期待与众多鱼油聚集起来，那就加入友好的摸鱼派社区吧！
          ❤️
        </p>
        <div class="welcome-text">
          <p>
            在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动
            :)
          </p>
          <p>
            日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ......
            都可以在摸鱼派中讨论。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { userApi } from "../api";
import { request } from "../api";
import MD5 from "crypto-js/md5";
import { useRouter } from "vue-router";

const router = useRouter();
const loading = ref(false);
const showMfa = ref(true); // 默认显示两步验证输入框

const form = reactive({
  username: "",
  password: "",
  mfaCode: "",
});

// MD5 加密
const md5 = (text) => {
  return MD5(text).toString();
};

const handleLogin = async () => {
  if (!form.username || !form.password) {
    utools.showNotification("请输入用户名和密码");
    return;
  }

  try {
    loading.value = true;
    const result = await userApi.login(
      form.username,
      md5(form.password),
      form.mfaCode
    );

    // 保存 API Key
    request.setApiKey(result.Key);

    // 获取用户信息
    const userInfo = await userApi.getCurrentUser();

    // 保存用户信息
    utools.dbStorage.setItem("fishpi_user_info", userInfo.data);

    // 显示成功提示
    utools.showNotification("登录成功");

    // 触发登录成功事件
    window.dispatchEvent(new CustomEvent("fishpi:login-success"));
  } catch (error) {
    if (error.message.includes("两步验证")) {
      showMfa.value = true;
    } else {
      utools.showNotification(error.message || "登录失败");
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到注册页
const goToRegister = () => {
  utools.shellOpenExternal("https://fishpi.cn/register?r=otis1026");
};

// 跳转到忘记密码页面
const goToForgetPwd = () => {
  utools.shellOpenExternal("https://fishpi.cn/forget-pwd");
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}

.login-content {
  display: flex;
  width: 900px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.login-box {
  width: 380px;
  background: white;
  padding: 40px;
  border-right: 1px solid #f0f0f0;
}

.welcome-section {
  flex: 1;
  padding: 40px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-section h2 {
  margin: 0 0 20px;
  font-size: 28px;
  font-weight: 500;
  color: #000;
}

.welcome-subtitle {
  margin: 0 0 24px;
  font-size: 16px;
  color: #666;
  line-height: 1.6;
}

.welcome-text {
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}

.welcome-text p {
  margin: 0 0 16px;
}

.welcome-text p:last-child {
  margin-bottom: 0;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: #000;
}

.login-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.form-content {
  width: 100%;
}

.form-item {
  margin-bottom: 18px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 16px;
  transition: color 0.3s ease;
}

input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #ffffff;
}

input:focus {
  border-color: #000;
  background: #fff;
  box-shadow: none;
  outline: none;
}

.login-btn {
  width: 100%;
  padding: 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  color: #999;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
}

.footer-link {
  color: #666;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

.footer-link:hover {
  color: #000;
}

.divider {
  margin: 0 10px;
  color: #e0e0e0;
  font-weight: 400;
}
</style>
