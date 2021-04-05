module.exports = {
  env: {
    browser: true,
    es2021: true,
    commonjs: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "react-hooks"],
  rules: {
    "no-empty-function": "warn",
    "no-empty": "off",
    "prefer-const": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/rules-of-hooks": "error",
  },
};
