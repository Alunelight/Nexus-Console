import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    // Bundle 分析（仅在构建时启用）
    visualizer({
      open: false,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          "react-vendor": ["react", "react-dom"],
          // TanStack 库
          "tanstack-vendor": [
            "@tanstack/react-query",
            "@tanstack/react-router",
          ],
          // UI 组件库
          "ui-vendor": ["@radix-ui/react-slot", "lucide-react", "sonner"],
          // 表单和验证
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          // 工具库
          "utils-vendor": [
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "date-fns",
          ],
        },
      },
    },
    // 压缩配置
    minify: "esbuild",
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
  },
  // 优化配置
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@tanstack/react-router",
    ],
  },
});
