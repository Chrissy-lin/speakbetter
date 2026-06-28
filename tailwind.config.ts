import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        sea: "#127C73",
        coral: "#E65F4A",
        lemon: "#F4C95D",
        mist: "#E8F3F1"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 38, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
