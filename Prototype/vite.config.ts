import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";     // SWC version
import reactClassic from "@vitejs/plugin-react";  // Classic React plugin
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),            // SWC React compiler
    reactClassic(),     // Classic React plugin you requested
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  base: "/EduSense-Graduation-Project/",
}));
