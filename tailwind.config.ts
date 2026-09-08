import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1E2B",
        paper: "#F1F3F6",
        surface: "#FFFFFF",
        line: "#DBDFE7",
        muted: "#6B7185",
        teal: {
          DEFAULT: "#0F6B5C",
          dark: "#0B4E43",
          light: "#E4F0EE",
        },
        amber: {
          DEFAULT: "#C77D2E",
          light: "#F6E9D9",
        },
        night: {
          DEFAULT: "#14171F",
          surface: "#1C2030",
          line: "#2A2F42",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-plex)", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
