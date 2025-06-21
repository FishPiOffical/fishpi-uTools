import "./main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "@fortawesome/fontawesome-free/css/all.css";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import VueEasyLightbox from "vue-easy-lightbox";
// 导入主题管理
import "./utils/theme.js";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(VueEasyLightbox);
app.mount("#app");
