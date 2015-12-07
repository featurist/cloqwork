var babel = require('babel-core');
var plastiq = require('plastiq');
var h = plastiq.html;

var nodeRenderers = {
  File: function(node) {
    return renderNodeElement(node, renderNode(node.program));
  },
  Program: function(node) {
    return renderNodeElement(node, newLineSeparated(node.body));
  },
  FunctionDeclaration: function(node) {
    return renderNodeElement(node,
      h('span.keyword.function', 'function', node.generator ? '*' : undefined),
      space(),
      h('span.functionname', node.id.name),
      symbol('brace.leftbrace', '('),
      commaSeparated(node.params.map(function(p) {
        return h('span.param', p.name);
      })),
      symbol('brace.rightbrace', ')'),
      space(),
      symbol('brace.leftcurlybrace', '{'),
      indent(renderNode(node.body)),
      symbol('brace.rightcurlybrace', '}')
    )
  },
  BlockStatement: function(node) {
    return renderNodeElement(node, newLineSeparated(node.body));
  },
  ReturnStatement: function(node) {
    return renderNodeElement(node,
      h('span.keyword.return', 'return'),
      space(),
      renderNode(node.argument),
      semicolon()
    );
  },
  ConditionalExpression: function(node) {
    return renderNodeElement(node,
      renderNode(node.test),
      space(),
      symbol('questionmark', '?'),
      space(),
      renderNode(node.consequent),
      space(),
      symbol('colon', ':'),
      space(),
      renderNode(node.alternate)
    )
  },
  StringLiteral: function(node) {
    return renderNodeElement(node,
      symbol('quote.doublequote', '"'),
      node.value,
      symbol('quote.doublequote', '"')
    );
  },
  BinaryExpression: function(node) {
    return renderNodeElement(node,
      renderNode(node.left),
      space(),
      symbol('operator', node.operator),
      space(),
      renderNode(node.right)
    );
  },
  Identifier: function(node) {
    return renderNodeElement(node, node.name);
  },
  NumericLiteral: function(node) {
    return renderNodeElement(node, node.value);
  },
  ExpressionStatement: function(node) {
    return renderNodeElement(node,
      renderNode(node.expression),
      semicolon()
    );
  },
  CallExpression: function(node) {
    return renderNodeElement(node,
      renderWithBrackets(node.callee),
      symbol('brace.leftbrace', '('),
      commaSeparated(node.arguments.map(renderNode)),
      symbol('brace.rightbrace', ')')
    )
  },
  MemberExpression: function(node) {
    return renderNodeElement(node,
      renderWithBrackets(node.object),
      symbol('dot', '.'),
      renderNode(node.property)
    )
  },
  VariableDeclaration: function(node) {
    return renderNodeElement(node,
      h('span.keyword.' + node.kind, node.kind),
      space(),
      commaSeparated(node.declarations.map(renderNode)),
      semicolon()
    );
  },
  VariableDeclarator: function(node) {
    return renderNodeElement(node,
      renderNode(node.id),
      node.init == null ? [] : [
        space(),
        symbol('equals', '='),
        space(),
        renderNode(node.init)
      ]
    );
  },
  ObjectExpression: function(node) {
    return renderNodeElement(node,
      symbol('brace.leftcurlybrace', '{'),
      indent(commaNewLineSeparated(node.properties.map(renderNode))),
      symbol('brace.rightcurlybrace', '}')
    );
  },
  ObjectProperty: function(node) {
    return renderNodeElement(node,
      node.key.type == 'Identifier' ? renderNode(node.key) : [
        symbol('brace.leftsquarebrace', '['),
        space(),
        renderNode(node.key),
        space(),
        symbol('brace.rightsquarebrace', ']')
      ],
      symbol('colon', ':'),
      space(),
      renderNode(node.value)
    );
  },
  WhileStatement: function(node) {
    return renderNodeElement(node,
      keyword('while'),
      space(),
      symbol('brace.leftbrace', '('),
      renderNode(node.test),
      symbol('brace.rightbrace', ')'),
      space(),
      symbol('brace.leftcurlybrace', '{'),
      indent(renderNode(node.body)),
      symbol('brace.rightcurlybrace', '}')
    )
  },
  BooleanLiteral: function(node) {
    return renderNodeElement(node, node.value);
  },
  YieldExpression: function(node) {
    return renderNodeElement(node,
      keyword('yield'),
      space(),
      renderNode(node.argument)
    );
  },
  AssignmentExpression: function(node) {
    return renderNodeElement(node,
      renderNode(node.left),
      space(),
      renderNode(node.operator),
      space(),
      renderNode(node.right)
    );
  },
  ArrayExpression: function(node) {
    return renderNodeElement(node,
      symbol('brace.leftsquarebrace', '['),
      commaSeparated(node.elements.map(renderNode)),
      symbol('brace.rightsquarebrace', ']')
    );
  },
  ArrayPattern: function(node) {
    return renderNodeElement(node,
      symbol('brace.leftsquarebrace', '['),
      commaSeparated(node.elements.map(renderNode)),
      symbol('brace.rightsquarebrace', ']')
    );
  },
  ForOfStatement: function(node) {
    return renderNodeElement(node,
      keyword('for'),
      space(),
      symbol('brace.leftbrace', '('),
      renderNode(node.left),
      space(),
      keyword('of'),
      space(),
      renderNode(node.right),
      symbol('brace.rightbrace', ')'),
      space(),
      symbol('brace.leftcurlybrace', '{'),
      indent(renderNode(node.body)),
      symbol('brace.rightcurlybrace', '}')
    )
  },
  ImportNamespaceSpecifier: function(node) {
    return renderNodeElement(node,
      symbol('star', '*'),
      space(),
      keyword('as'),
      space(),
      renderNode(node.local)
    )
  },
  ImportDeclaration: function(node) {
    return renderNodeElement(node,
      keyword('import'),
      space(),
      commaSeparated(node.specifiers.map(renderNode)),
      space(),
      keyword('from'),
      space(),
      renderNode(node.source),
      semicolon()
    )
  },
  ObjectMethod: function(node) {
    return renderNodeElement(node,
      renderNode(node.key),
      symbol('brace.leftbrace', '('),
      symbol('brace.rightbrace', ')'),
      space(),
      symbol('brace.leftcurlybrace', '{'),
      indent(renderNode(node.body)),
      symbol('brace.rightcurlybrace', '}')
    )
  },
  ArrowFunctionExpression: function(node) {
    return renderNodeElement(node,
      symbol('brace.leftbrace', '('),
      symbol('brace.rightbrace', ')'),
      space(),
      symbol('arrow.fatarrow', '=>'),
      space(),
      renderNode(node.body)
    )
  },
  Super: function(node) {
    return renderNodeElement(node,
      symbol('keyword.super', 'super')
    )
  },
  ThisExpression: function(node) {
    return renderNodeElement(node,
      symbol('keyword.this', 'this')
    )
  }
}

function simplifyBabelAst(ast) {
  delete(ast._paths);
  delete(ast.loc);
  delete(ast.tokens);
  delete(ast.start);
  delete(ast.end);
  delete(ast.extra);
  delete(ast.sourceType);
  delete(ast.__clone);
  for (var k in ast) {
    if (k == '_paths' || k == 'tokens' || typeof(ast[k]) == 'function') {
      continue;
    }
    if (ast[k] && typeof(ast[k]) == 'object') {
      simplifyBabelAst(ast[k])
    }
  }
}

function indent(nodes) {
  return [h('br.indent')].concat(nodes).concat([h('br.outdent')]);
}

function symbol(name, character) {
  return h('span.symbol.' + name, character);
}

function space() {
  return h('span.space', ' ');
}

function semicolon() {
  return symbol('semicolon', ';');
}

function keyword(name, value) {
  if (typeof(value) == 'undefined') { return keyword(name, name); }
  return h('span.keyword.' + name, value);
}

function commaSeparated(array) {
  var o = [];
  for (var i = 0; i < array.length; i++) {
    if (i > 0) {
      o.push(symbol('comma', ','));
      o.push(space());
    }
    o.push(array[i]);
  }
  return o;
}

function commaNewLineSeparated(array) {
  var o = [];
  for (var i = 0; i < array.length; i++) {
    if (i > 0) {
      o.push(symbol('comma', ','));
      o.push(h('br'));
    }
    o.push(array[i]);
  }
  return o;
}

function renderWithBrackets(node) {
  return node.type == 'Identifier' ||
         node.type == 'MemberExpression' ||
         node.type == 'ThisExpression' ||
         node.type == 'Super' ?
         renderNode(node) :
         [
           symbol('brace.leftbrace', '('),
           renderNode(node),
           symbol('brace.rightbrace', ')')
         ];
}

newLineTypes = [
  'FunctionDeclaration',
  'ObjectMethod',
  'ForOfStatement'
];

function isNewLineType(node) {
  return newLineTypes.indexOf(node.type) > -1;
}

function newLineSeparated(array) {
  var o = [];
  for (var i = 0; i < array.length; i++) {
    if (i > 0 && (isNewLineType(array[i - 1]) || isNewLineType(array[i]))) {
      o.push(h('br'));
    }
    o.push(renderNode(array[i]));
    if (i < array.length - 1) {
      o.push(h('br'));
    }
  }
  return o;
}

function renderNode(node) {
  if (Array.isArray(node)) {
    return node.map(renderNode);
  } else if (node != null &&
             typeof(node) == 'object' &&
             typeof(node.type) == 'string') {
    var renderer = nodeRenderers[node.type];
    if (renderer) {
      return renderer(node);
    }
    return renderNodeElement(node, renderAttributes(node));
  }
  return node;
}

function renderNodeElement(node, contents) {
  return h('.node.' + node.type, Array.prototype.slice.call(arguments, 1));
}

function renderAttributes(node) {
  if (typeof(node) != 'object') {
    return undefined;
  }
  var attrs = [];
  for (var key in node) {
    if (key != 'type' && key != '__clone') {
      var val = node[key];
      attrs.push(
        h('tr.attribute',
          h('td.key', key, ':'),
          h('td.value', renderNode(node[key]))
        )
      );
    }
  }
  return h('table', attrs);
}

var jsBinding = {
  get: function() {
    return model.js;
  },
  set: function(value) {
    model.js = value;
    model.parse();
  }
}

function repeatString(string, repeatCount) {
  return new Array(repeatCount + 1).join(string);
}

function applyIndentation(vdom) {
  var stack = [vdom];
  var level = 0;
  while (stack.length > 0) {
    var current = stack.shift();
    if (current.tagName == 'BR') {
      var type = current.properties.className;
      if (type == 'indent') {
        level++;
      } else if (type == 'outdent') {
        level--;
      }
      var index = current.parent.children.indexOf(current);
      var whitespace = repeatString('&nbsp;&nbsp;', level);
      current.parent.children[index] = h('span.indent',
                              h('br'), h.rawHtml('span.space', whitespace));
    }
    if (current.children) {
      current.children.forEach(function(child) {
        child.parent = current;
      })
      stack = current.children.concat(stack);
    }
  }
  return vdom;
}

var js = [
  "function fizzBuzzAt(n) {",
  "  return n % 5 == 0 ? 'FizzBuzz' : (n % 3 == 0 ? 'Buzz' : 'Fizz');",
  "}",
  "console.log(fizzBuzzAt(3));",
  "(x + y).whatevs();",
  "",
  "var funcs = { fb: fizzBuzzAt };",
  "",
  "function* fibonacci() {",
  "  let a = 0, b = 1;",
  "  while(true) {",
  "    yield a;",
  "    [a, b] = [b, a + b];",
  "  }",
  "}",
  "",
  "for(let value of fibonacci()) {",
  "  wibble.wobble(value);",
  "}",
  "",
  "import * as math from \"lib/math\"",
  "var obj = {",
  "  x() { return 1; },",
  "  __proto__: theProtoObj,",
  "  handler,",
  "  toString() {",
  "    return \"d \" + this.ouch + super.toString();",
  "  },",
  "  [ 'prop_' + (() => 42)() ]: 42",
  "};"
].join("\n")

var model = {
  js: js,
  parse: function() {
    try {
      this.ast = babel.transform(this.js).ast;
      simplifyBabelAst(this.ast);
      delete(this.parseError);
      window.ast = this.ast; // for devtools debugging
    }
    catch (e) {
      this.parseError = e;
    }
  }
};
model.parse();
model.js = babel.transformFromAst(model.ast, js).code;

function render(model) {
  return h('.app',
    h('textarea.js', { binding: jsBinding }),
    model.parseError ?
      h('pre', "Parse Error:\n", model.parseError.toString()) :
      applyIndentation(renderNode(model.ast))
  );
}

plastiq.append(document.body, render, model);
