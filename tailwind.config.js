module.exports = {
  purge: ["./*.html", "./*.js"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1DA1F2",
        },
        secondary: {
          DEFAULT: "#F27F0C",
        },
        text: {
          DEFAULT: "#053F5C",
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
