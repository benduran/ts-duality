import { respectPrettierConfig } from "eslint-config-react-yas";

export default [
  ...respectPrettierConfig,
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
