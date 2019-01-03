/**
 * pub-generator test-render
 * lots to do here to get more coverage.
 *
 * copyright 2015-2019, Jurgen Leschner - github.com/jldec - MIT license
 *
**/
var test = require('tape')

var u = require('pub-util');
var inspect = require('util').inspect;

var tests = [

  { name: 'simple {{pageLink}} for /page',
    page: '/page',
    file: {
      path: '/page.md',
      text: ms(function(){/*
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
      text: ms(function(){/*
---- /a/b/c & d ----
name: 1 < 2 > 1 & we're happy
template: custom

hello world

---- /custom.hbs ----

{{{pageLink}}}
    */})
    },
    result: '<a href="/a/b/c-and-d">1 &lt; 2 &gt; 1 &amp; we&#39;re happy</a>'
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
    })
  });
});

// ES5 multi-line string hack
// returns input function body minus the first and last lines
// use these for comment delimiters /* and s*/
// works as long as the rest of the text doesn't contain '*/'
// credit Eli Bendersky - http://eli.thegreenplace.net/
function ms(f) {
  return f.toString().split('\n').slice(1, -1).join('\n');
}
