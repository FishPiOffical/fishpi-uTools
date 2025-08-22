import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import terser from "@rollup/plugin-terser";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
      vue(),
      terser({
        compress: {
          drop_console: true, // 移除 console
          drop_debugger: true, // 移除 debugger
        },
        output: {
          comments: false, // 移除注释
        },
      }),
    ],
    base: "./",
    build: {
      minify: "terser",
      chunkSizeWarningLimit: 1000, // 调整警告阈值到 1000kb
      rollupOptions: {
        output: {
          manualChunks: {
            "vue-vendor": ["vue"], // Vue 相关
          },
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
        },
      },
    },
});
