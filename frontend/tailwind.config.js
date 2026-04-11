/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7F00FF",
        secondary: "#FF5F6D",
        accent: "#4a9c6e",
        background: "#F2F2F5",
        text: "#1F1F1F",
        soft: "#FFFFFF",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(127, 0, 255, 0.25)"
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out forwards',
        blob: 'blob 12s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        }
      },
      animationDelay: {
        2000: '2s',
        4000: '4s'
      }
    },
  },
  plugins: [],
};