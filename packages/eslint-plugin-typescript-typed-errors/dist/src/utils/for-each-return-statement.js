"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEachReturnStatement = void 0;
const typescript_1 = __importDefault(require("typescript"));
// Copied from typescript https://github.com/microsoft/TypeScript/blob/42b0e3c4630c129ca39ce0df9fff5f0d1b4dd348/src/compiler/utilities.ts#L1335
// Warning: This has the same semantics as the forEach family of functions,
//          in that traversal terminates in the event that 'visitor' supplies a truthy value.
function forEachReturnStatement(body, visitor) {
    return traverse(body);
    function traverse(node) {
        switch (node.kind) {
            case typescript_1.default.SyntaxKind.ReturnStatement:
                return visitor(node);
            case typescript_1.default.SyntaxKind.CaseBlock:
            case typescript_1.default.SyntaxKind.Block:
            case typescript_1.default.SyntaxKind.IfStatement:
            case typescript_1.default.SyntaxKind.DoStatement:
            case typescript_1.default.SyntaxKind.WhileStatement:
            case typescript_1.default.SyntaxKind.ForStatement:
            case typescript_1.default.SyntaxKind.ForInStatement:
            case typescript_1.default.SyntaxKind.ForOfStatement:
            case typescript_1.default.SyntaxKind.WithStatement:
            case typescript_1.default.SyntaxKind.SwitchStatement:
            case typescript_1.default.SyntaxKind.CaseClause:
            case typescript_1.default.SyntaxKind.DefaultClause:
            case typescript_1.default.SyntaxKind.LabeledStatement:
            case typescript_1.default.SyntaxKind.TryStatement:
            case typescript_1.default.SyntaxKind.CatchClause:
                return typescript_1.default.forEachChild(node, traverse);
        }
        return undefined;
    }
}
exports.forEachReturnStatement = forEachReturnStatement;
