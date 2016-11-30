var Compiler = require('../compiler');
var expect = require('chai').expect;

describe('compiler', function() {
  var compiler;

  beforeEach(function () {
    compiler = new Compiler();
  });

  it('can compile a simple expression', function () {
    var output = compiler.compile('5');
    expect(output.call()).to.equal(5);
  });

  describe('jsx', function () {
    beforeEach(function () {
      compiler = new Compiler(['hyperdom']);
    });

    it('uses hyperdom', function () {
      var output = compiler.compile('<h1>title</h1>');
      var hyperdom = {
        jsx(...args) {
          return args;
        }
      };
      var vdom = output.call({}, hyperdom);

      expect(vdom).to.eql(['h1', null, 'title']);
    });
  });

  describe('globals', function () {
    it('can detect global variables', function () {
      var output = compiler.compile('x');
      expect(output.call({x: 5})).to.equal(5);
    });

    it("doesn't detect globals for recursive functions", function () {
      var output = compiler.compile(`
        function fib(x) {
          if (x == 0 || x == 1) {
            return 1;
          } else {
            return fib(x - 1) + fib(x - 2);
          }
        }

        return fib(5)
      `);

      expect(output.call()).to.equal(8);
    });

    it('assigns to globals', function () {
      var output = compiler.compile(`
        y = x = 5
      `);

      var globals = {};
      output.call(globals);
      expect(globals).to.eql({x: 5, y: 5});
    });

    it('throws if a global is not defined', function () {
      var output = compiler.compile('x');

      var globals = {};
      expect(() => output.call(globals)).to.throw('x is not defined');
    });
  });

  describe('requires', function() {
    it('can detect requires', function () {
      var output = compiler.compile(`
        var x = require('x');
        var y = require('y');
      `);

      expect(output.dependencies).to.eql(['x', 'y']);
    });
  });
});
