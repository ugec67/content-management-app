/** @type {import('tailwindcss').Config} */
module.exports = {
  // This 'content' array tells Tailwind where to scan for your utility classes.
  // It's crucial for Tailwind to generate only the CSS you actually use.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all .js, .jsx, .ts, .tsx files in the src directory
    "./public/index.html",       // Scans your public/index.html file
  ],
  // Configure dark mode to be based on the presence of a 'dark' class
  // on the HTML element (e.g., <html class="dark">).
  darkMode: 'class', // THIS LINE IS ESSENTIAL FOR DARK MODE
  theme: {
    extend: {
      // You can extend Tailwind's default theme here.
      // For example, adding custom colors, fonts, spacing, etc.
    },
  },
  plugins: [
    // You can add Tailwind plugins here.
  ],
}
    