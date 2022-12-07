"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const create_rule_js_1 = require("../utils/create-rule.js");
exports.default = (0, create_rule_js_1.createRule)({
    name: 'consistent-result-return',
    meta: {
        type: 'problem',
        docs: {
            description: 'Functions that return an Ok or Err, should only return Result types',
            recommended: 'error',
            requiresTypeChecking: true,
        },
        messages: {
            nonResultReturn: 'Return an Ok or Err here',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const parserServices = utils_1.ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const scopeInfoStack = [];
        function enterFunction(node) {
            scopeInfoStack.push({
                owningFunc: node,
                returns: [],
            });
        }
        function isResultExpression(node) {
            if (node.type === utils_1.AST_NODE_TYPES.ReturnStatement && !node.argument) {
                return false;
            }
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const nodeType = checker.getTypeAtLocation(tsNode);
            const props = nodeType.getApparentProperties();
            return props.some((symb) => {
                return /__@IsErrSymbol@/g.test(symb.escapedName.toString());
            });
        }
        function exitFunction() {
            const scopeInfo = scopeInfoStack.pop();
            if (!scopeInfo)
                return;
            const returnsResult = scopeInfo.returns.some(isResultExpression);
            if (!returnsResult)
                return;
            scopeInfo.returns.forEach((node) => {
                if (!isResultExpression(node)) {
                    context.report({
                        node,
                        messageId: 'nonResultReturn',
                    });
                }
            });
        }
        function findReturnedNodes(node) {
            if (node.type === utils_1.AST_NODE_TYPES.ConditionalExpression) {
                return [
                    ...findReturnedNodes(node.alternate),
                    ...findReturnedNodes(node.consequent),
                ];
            }
            return [node];
        }
        return {
            FunctionDeclaration: enterFunction,
            FunctionExpression: enterFunction,
            ArrowFunctionExpression: enterFunction,
            'FunctionDeclaration:exit': exitFunction,
            'FunctionExpression:exit': exitFunction,
            'ArrowFunctionExpression:exit': exitFunction,
            ReturnStatement(node) {
                const scopeInfo = scopeInfoStack[scopeInfoStack.length - 1];
                if (!node.argument) {
                    scopeInfo.returns.push(node);
                    return;
                }
                findReturnedNodes(node.argument).forEach(node => {
                    scopeInfo.returns.push(node);
                });
            },
        };
    },
});
