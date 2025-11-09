import { respectPrettierConfig } from "eslint-config-react-yas";

export default [
  ...respectPrettierConfig,
  {
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
    },
  },
];
