/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Add autoprefixer for better compatibility
  },
};

export default config; // Use export default for ES module
