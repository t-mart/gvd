gvd
===

This is an attempt at deobsfucating the nasty, ad-ridden code of sites like
GorillaVid. [Here's an
example](https://github.com/t-mart/gvd/blob/master/test/gorillavidscript.js) of what that code looks like.

The deobsfucation is done by traversing the AST of a source and
adding/removing/manipulating nodes that are tricky to read. [Babel](https://babeljs.io) provides the framework.
Here are some of the techniques employed:
* Literal evalution
  * `true && false` => `false`
  * `1 > 2 ? 'foo' : 'bar'` => `'bar'`
* Method call readability improvements
  * `s.charCodeAt(4) === 101` => `s[4] === 'e'`
* Identifier lookup
  * `var foo = 'hello'; foo + ' world'` => `'hello' + ' world'`
