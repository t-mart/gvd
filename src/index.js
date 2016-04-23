// jscs:disable maximumLineLength
// jscs:disable disallowTrailingWhitespace
'use strict';

var t = require('babel-types');
var _ = require('lodash');

function transformNodeOfPath(path, transformers) {
  return path.replaceWith(_.flow(transformers)(path.node));
}

export default function () {
  return {
    visitor: {
      BinaryExpression: {
        exit(path) {
          transformNodeOfPath(path,
            [
              simplifyLiteralBinaryExpression,
              simplifyCharCodeAt
            ]);
        },
      },
      LogicalExpression: {
        exit(path) {
          transformNodeOfPath(path, simplifyLiteralLogicalExpression);
        },
      },
      ConditionalExpression: {
        exit(path) {
          transformNodeOfPath(path, simplifyLiteralConditionalExpression);
        },
      },
      CallExpression: {
        exit(path) {
        },
      },
      MemberExpression: {
        exit(path) {
        },
      },
      SequenceExpression: {
        exit(path) {
          transformNodeOfPath(path, simplifyLiteralSequenceExpression);
        },
      },
      IfStatement: {
        exit(path) {
          //console.log(path.node);
          // process.exit();
        },
      },
    },
  };
}

var isLiteral = (n) => t.isNumericLiteral(n) ||
t.isBooleanLiteral(n) ||
t.isNullLiteral(n) ||
t.isStringLiteral(n) ||
t.isRegExpLiteral(n);

function simplifyCharCodeAt(node) {
  var charCodeCallExprNode = (t.isCallExpression(node.left)
  && t.isMemberExpression(node.left.callee)
  && t.isIdentifier(node.left.callee.property)
  && node.left.callee.property.name === 'charCodeAt') ?
    node.left :
    (t.isCallExpression(node.right)
    && t.isMemberExpression(node.right.callee)
    && t.isIdentifier(node.right.callee.property)
    && node.right.callee.property.name === 'charCodeAt') ?
      node.right :
      false;
  if (charCodeCallExprNode === false) return node;
  var indexLiteralNode = charCodeCallExprNode.arguments[0];
  if (!indexLiteralNode) return node;
  if (node.operator !== '===') return node;
  var asciiNode = t.valueToNode(String.fromCharCode(
    (charCodeCallExprNode === node.left ?
      node.right :
      node.left).value));
  var identifierIndexMemberNode = t.memberExpression(
    charCodeCallExprNode.callee.object,
    indexLiteralNode,
    true
  );
  return t.binaryExpression('===', identifierIndexMemberNode, asciiNode);
}
  
function simplifyLiteralSequenceExpression(node) {
  return node.expressions[node.expressions.length - 1];
}

function simplifyLiteralBinaryExpression(node) {
  var f = binaryOperations[node.operator];
  if (!f) {
    throw new Error(`No binary operation defined for operator ${node.operator}`);
  }

  if (!_.every([node.left, node.right], isLiteral)) {
    console.log(`binaryExpression cannot be simplified because ${node.left.type} ${node.operator} ${node.right.type} contains non-literals`);
    return node;
  }

  var result = f(node.left.value, node.right.value);
  return t.valueToNode(result);
}

function simplifyLiteralLogicalExpression(node) {
  var f = logicalOperations[node.operator];
  if (!f) {
    throw new Error(`No logical operation defined for operator ${node.operator}`);
  }

  if (!_.every([node.left, node.right], isLiteral)) {
    console.log(`logicalExpression cannot be simplified because ${node.left.type} ${node.operator} ${node.right.type} contains non-literals`);
    return node;
  }

  var result = f(node.left.value, node.right.value);
  return t.valueToNode(result);
}

function simplifyLiteralConditionalExpression(node) {
  if (!isLiteral(node.test)) {
    console.log(`conditionalExpression cannot be simplified because test ${node.test.type} is not literal`);
    return node;
  }

  var result = node.test.value ? node.consequent.value : node.alternate.value;
  return t.valueToNode(result);
}

var binaryOperations = {
  '<': (l, r) => l < r,
  '>': (l, r) => l > r,
  '>=': (l, r) => l >= r,
  '===': (l, r) => l === r,
  '!==': (l, r) => l !== r,
  '==': (l, r) => l == r,
  '!=': (l, r) => l != r,
  '<=': (l, r) => l <= r,
  '+': (l, r) => l + r,
  '-': (l, r) => l - r,
  '*': (l, r) => l * r,
  '/': (l, r) => l / r,
  '>>>': (l, r) => l >>> r,
  '>>': (l, r) => l >> r,
  '<<': (l, r) => l << r,
  '^': (l, r) => l ^ r,
  '&': (l, r) => l & r,
  '|': (l, r) => l | r,
  '%': (l, r) => l % r,
  'in': (l, r) => l in r,
  'instanceof': (l, r) => l instanceof r,
};

var logicalOperations = {
  '||': (l, r) => l || r,
  '&&': (l, r) => l && r,
};

