const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("@typescript-eslint/eslint-plugin");
const cypress = require("eslint-plugin-cypress");

const config = [
  {
    ignores: ["dist/**", "ui/dist/**", "**/coverage/**"],
  },
  {
    // Backend TypeScript files
    files: ["**/*.ts"],
    ignores: ["ui/**"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "commonjs",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    // Cypress test files
    files: ["cypress/**/*.cy.ts"],
    plugins: {
      cypress: cypress,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        cy: "readonly",
        Cypress: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      ...cypress.configs.recommended.rules,
    },
  },
  {
    // Frontend TypeScript and React files
    files: ["ui/**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];

module.exports = config;
