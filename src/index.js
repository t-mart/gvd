'use strict'
import * as t from "babel-types";
var _ = require('lodash/core');

export default function({ types: t }) {
  return {
    visitor: {
      BinaryExpression : {
        exit(path) {
          path.replaceWith(simplifyBinaryExpression(path.node));
        }
      },
      LogicalExpression : {
        exit(path) {
          path.replaceWith(simplifyLogicalExpression(path.node));
        }
      },
      ConditionalExpression : {
        exit(path) {
          path.replaceWith(simplifyConditionalExpression(path.node));
        }
      },
      CallExpression : {
        exit(path) {
          // console.log(path.node);
          // process.exit();
          return;
        }
      },
      SequenceExpression : {
        exit(path) {
          path.replaceWith(simplifySequenceExpression(path.node));
        },
      },
      IfStatement : {
        exit(path) {
          console.log(path.node);
          // process.exit();
        }
      }
    }
  };
}

function simplifySequenceExpression(node) {
  return node.expressions[node.expressions.length-1];
}

function simplifyBinaryExpression(node) {
    var f = binaryOperations[node.operator];
    if (!f) {
      throw new Error(`No binary operation defined for operator ${node.operator}`);
    }
    return t.valueToNode(f(node.left.value, node.right.value));
}

function simplifyLogicalExpression(node) {
    var f = logicalOperations[node.operator];
    if (!f) {
      throw new Error(`No logical operation defined for operator ${node.operator}`);
    }
    return t.valueToNode(f(node.left.value, node.right.value));
}

function simplifyConditionalExpression(node) {
  return t.valueToNode(node.test.value ? node.consequent.value : node.alternate.value);
}

var binaryOperations = {
  '<': (l, r) => l < r,
  '>': (l, r) => l > r,
  '>=': (l, r) => l >= r,
  '===': (l, r) => l === r,
};

var logicalOperations = {
  '||': (l, r) => l || r,
  '&&': (l, r) => l && r
};

