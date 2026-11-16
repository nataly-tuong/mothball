import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rolldownOptions: {
      input: {
        main: "index.html",
        invite: "invite.html",
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
