// jscs:disable maximumLineLength
// jscs:disable disallowTrailingWhitespace
'use strict';

var t = require('babel-types');
var _ = require('lodash');

function transformPath(path, transformers) {
  _.forEach(transformers, f => path.replaceWith(f(path)));
}

export default function () {
  return {
    visitor: {
      BinaryExpression: {
        exit(path) {
          transformPath(path,
            [
              simplifyLiteralBinaryExpression,
              simplifyCharCodeAt
            ]);
        },
      },
      LogicalExpression: {
        exit(path) {
          transformPath(path, [simplifyLiteralLogicalExpression]);
        },
      },
      ConditionalExpression: {
        exit(path) {
          transformPath(path, [simplifyLiteralConditionalExpression]);
        },
      },
      CallExpression: {
        exit(path) {
        },
      },
      MemberExpression: {
        exit(path) {
          transformPath(path, [resolveMemberExpression]);
        },
      },
      SequenceExpression: {
        exit(path) {
          transformPath(path, [simplifyLiteralSequenceExpression]);
        },
      },
      IfStatement: {
        exit(path) {
          //console.log(path.node);
          // process.exit();
        },
      },
      Identifier: {
        exit(path) {
          transformPath(path, [resolveIdentifier]);
        }
      }
    },
  };
}

var isLiteral = (n) => t.isNumericLiteral(n) ||
t.isBooleanLiteral(n) ||
t.isNullLiteral(n) ||
t.isStringLiteral(n) ||
t.isRegExpLiteral(n);

function simplifyCharCodeAt(path) {
  var node = path.node;
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
  
function simplifyLiteralSequenceExpression(path) {
  var node = path.node;
  return node.expressions[node.expressions.length - 1];
}

var builtinMemberExpressionProperties = [
  'length',
  'charCodeAt'
];

var assigningNodeTypes = [
  'VariableDeclarator',
  'FunctionDeclaration',
  'AssignmentExpression',
];

function getIdentifierNode(name, path) {
  var binding;
  if (_.includes(assigningNodeTypes, path.parent.type)) {
    return undefined;
  }
  binding = path.scope.getBinding(name);
  if (!binding) {
    if (path.parent.type === 'MemberExpression' && _.includes(builtinMemberExpressionProperties, name)) {
      return undefined;
    }
    //throw new Error(`could not find binding for ${path.node.type} ${path.node.name}`);
    return undefined;
  }
  if (binding.path.type === 'FunctionDeclaration') {
    // TODO figure this out
    return undefined;
  }
  if (binding.path.type === 'VariableDeclarator') {
    return binding.path.node.init;
  }
  return undefined;
}

function resolveIdentifier(path) {
  var node = getIdentifierNode(path.node.name, path);
  if (node && isLiteral(node)) {
    return t.valueToNode(node.value);
  }
  return path.node;
}

function resolveMemberExpression(path) {
  var memberObject = getIdentifierNode(path.node.object.name, path);
  if (memberObject && memberObject.type === 'ObjectExpression') {
    var theObject = _.reduce(memberObject.properties, (obj, prop) => {
      if (isLiteral(prop.value)) {
        obj[prop.key.value] = prop.value.value;
      }
      return obj;
    }, {});
    var key;
    if (t.isIdentifier(path.node.property)) {
      key = path.node.property.name;
    } else if (isLiteral(path.node.property)) {
      key = path.node.property.value;
    } else {
      return path.node;
      //throw new Error(`member expression property ${path.node.property.type} is not identifier or literal`);
    }
    var value = theObject[key];
    if (value) {
      return t.valueToNode(value);
    } else {
      return path.node;
    }
  }
  return path.node;
}

function simplifyLiteralBinaryExpression(path) {
  var node = path.node;
  var f = binaryOperations[node.operator];
  if (!f) {
    throw new Error(`No binary operation defined for operator ${node.operator}`);
  }

  if (!_.every([node.left, node.right], isLiteral)) {
    //console.log(`binaryExpression cannot be simplified because ${node.left.type} ${node.operator} ${node.right.type} contains non-literals`);
    return node;
  }

  if (node.operator === 'instanceof' || node.operator === 'in') {
    console.log(node);
    throw new Error('stopping because of this binaryExpression that\'s interesting')
  }

  var result = f(node.left.value, node.right.value);
  return t.valueToNode(result);
}

function simplifyLiteralLogicalExpression(path) {
  var node = path.node;
  var f = logicalOperations[node.operator];
  if (!f) {
    throw new Error(`No logical operation defined for operator ${node.operator}`);
  }

  if (!_.every([node.left, node.right], isLiteral)) {
    //console.log(`logicalExpression cannot be simplified because ${node.left.type} ${node.operator} ${node.right.type} contains non-literals`);
    return node;
  }

  var result = f(node.left.value, node.right.value);
  return t.valueToNode(result);
}

function simplifyLiteralConditionalExpression(path) {
  var node = path.node;
  if (!isLiteral(node.test)) {
    //console.log(`conditionalExpression cannot be simplified because test ${node.test.type} is not literal`);
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

