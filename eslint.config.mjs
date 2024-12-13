import tailwindcss from "eslint-plugin-tailwindcss";
import {dirname} from "path";
import {fileURLToPath} from "url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const eslintConfig = [
  {ignores: ["**/components/ui/**/*"]},
  ...compat.extends("next/core-web-vitals", "plugin:import/recommended", "plugin:import/typescript", "next/typescript", "prettier", "plugin:tailwindcss/recommended"),
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
