// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'slow-pan': 'pan 60s linear infinite',
      },
      keyframes: {
        pan: {
          '0%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(-30%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
};