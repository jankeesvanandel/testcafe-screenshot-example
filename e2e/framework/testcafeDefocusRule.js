"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Lint = require("tslint");
var ts = require("typescript");
var Rule = /** @class */ (function (_super) {
  tslib_1.__extends(Rule, _super);
  function Rule() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  Rule.prototype.apply = function (sourceFile) {
    return this.applyWithFunction(sourceFile, walk);
  };
  Rule.metadata = {
    /* tslint:disable:object-literal-sort-keys */
    ruleName: "testcafeDefocus",
    description: "Bans the use of the `only` Testcafe function.",
    rationale: "It is all too easy to mistakenly commit a focussed test suite or spec.",
    options: null,
    optionsDescription: "Not configurable.",
    type: "functionality",
    typescriptOnly: false
  };
  return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
function walk(ctx) {
  return ts.forEachChild(ctx.sourceFile, function cb(node) {
    if (node.kind === ts.SyntaxKind.CallExpression) {
      var expression_1 = node.expression;
      var functionName_1 = expression_1.getText();
      bannedFunctions.forEach(function (banned) {
        if (banned === functionName_1) {
          ctx.addFailureAtNode(expression_1, failureMessage(functionName_1));
        }
      });
    }
    return ts.forEachChild(node, cb);
  });
}
var bannedFunctions = ["fixture.only", "test.only"];
var failureMessage = function (functionName) {
  return "Calls to '" + functionName + "' are not allowed.";
};
