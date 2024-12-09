import {fixupConfigRules, fixupPluginRules} from "@eslint/compat";
import tailwindcss from "eslint-plugin-tailwindcss";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [{
  ignores: ["**/components/ui/**/*"],
}, ...fixupConfigRules(compat.extends(
  "next/core-web-vitals",
  "plugin:import/recommended",
  "plugin:import/typescript",
  "prettier",
  "plugin:tailwindcss/recommended",
)), {
  plugins: {
    tailwindcss: fixupPluginRules(tailwindcss),
  },

  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },

  rules: {
    "tailwindcss/no-custom-classname": "off",
    "tailwindcss/classnames-order": "off",
  },
}];