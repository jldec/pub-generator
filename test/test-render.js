/**
 * pub-generator test-render
 * lots to do here to get more coverage.
 *
 * copyright 2015-2020, Jürgen Leschner - github.com/jldec - MIT license
 *
**/
var test = require('tape');

var tests = [

  { name: 'simple {{pageLink}} for /page',
    page: '/page',
    file: {
      path: '/page.md',
      text: mls(function(){/*
---- ----
template: custom

hello world

---- /custom.hbs ----

{{{pageLink}}}
    */})
    },
    result: '<a href="/page">Page</a>'
  },

  { name: '{{pageLink}} with escaping',
    page: '/a/b/c-and-d',
    file: {
      path: '/foo.md',
      text: mls(function(){/*
---- /a/b/c & d ----
name: 1 < 2 > 1 & we're happy
template: custom

hello world

---- /custom.hbs ----

{{{pageLink}}}
    */})
    },
    result: '<a href="/a/b/c-and-d">1 &lt; 2 &gt; 1 &amp; we&#39;re happy</a>'
  },

  { name: 'markdown input field with name with a space',
    page: '/form-1',
    file: {
      path: '/form 1.md',
      text: '[??](input 1)'
    },
    result: '<div data-render-html="/form-1"><p>\n<input name="input 1" id="input-1"></p>\n</div>'
  }

];

tests.forEach(function run(tst) {

  test(tst.name, function(t) {

    var opts = { jquery:false, sources:[{ path:'.', fragmentDelim:true, files:[tst.file] }] };

    var generator = require('../generator')(opts);

    generator.load(function(err) {
      t.error(err);
      t.equal(generator.pages.length, tst.pagecount || 1);

      generator.getPage(tst.page || '/', function(err, page) {
        t.error(err);

        // console.log(inspect(page, {depth:3}));

        t.equal(typeof page, tst.pagetype || 'object');
        if (tst.pagetype !== 'undefined') {

          var actual = generator.renderDoc(page, tst.renderOpts);
          t.equal(actual, tst.result);
        }

        t.end();
      });
    });
  });
});

// ES5 multi-line string hack
// returns input function body minus the first and last lines
// use these for comment delimiters /* and s*/
// works as long as the rest of the text doesn't contain '*/'
// credit Eli Bendersky
// https://eli.thegreenplace.net/2013/11/09/javascript-es-5-hack-for-clean-multi-line-strings
function mls(f) {
  return f.toString().split('\n').slice(1, -1).join('\n');
}
