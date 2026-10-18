import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves project sites from /<repo>/. Local dev stays at /.
const base = process.env.GITHUB_ACTIONS ? "/kept/" : "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [tailwindcss(), react()],
});
