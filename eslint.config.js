import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

const browserGlobals = {
  document: "readonly",
  KeyboardEvent: "readonly",
  HTMLElement: "readonly",
  HTMLInputElement: "readonly",
  MouseEvent: "readonly",
  window: "readonly"
};

export default [
  {
    ignores: ["dist/**", "coverage/**", "src-tauri/target/**", "public/**"]
  },
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...svelte.configs["flat/recommended"],
  {
    files: ["src/**/*.ts", "*.config.ts"],
    languageOptions: {
      globals: browserGlobals
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "off"
    }
  },
  {
    files: ["src/**/*.svelte"],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error"
    }
  }
];
