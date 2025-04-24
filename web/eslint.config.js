import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";
import angulareslint from "@angular-eslint/eslint-plugin";
import angulartemplateeslint from "@angular-eslint/eslint-plugin-template";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", ".angular/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
      },
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@angular-eslint": angulareslint,
    },
    rules: {
      quotes: ["error", "single"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Allow unused constructor parameters (required for Angular DI)
      "@typescript-eslint/no-unused-params": "off",
      "no-console": "off",
      // Angular specific rules
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    plugins: {
      "@angular-eslint/template": angulartemplateeslint,
    },
    rules: {},
  },
];
