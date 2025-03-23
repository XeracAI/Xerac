import {dirname} from "path";
import {fileURLToPath} from "url";
import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import tailwindcss from "eslint-plugin-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const eslintConfig = [
  {ignores: ["**/components/ui/**/*"]},
  ...compat.extends("next/core-web-vitals", "plugin:import/recommended", "plugin:import/typescript", "prettier", "plugin:tailwindcss/recommended"),
  ...compat.config({
    extends: ["next/typescript"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }),
  {
    plugins: {tailwindcss},

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },

    rules: {"tailwindcss/no-custom-classname": "off", "tailwindcss/classnames-order": "off"},
  }
];

export default eslintConfig;
