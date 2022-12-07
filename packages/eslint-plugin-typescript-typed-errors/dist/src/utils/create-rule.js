"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = void 0;
const utils_1 = require("@typescript-eslint/utils");
exports.createRule = utils_1.ESLintUtils.RuleCreator(name => `https://github.com/fathom3-dev/eslint-plugin-typescript-typed-errors/blob/main/docs/${name}.md`);
