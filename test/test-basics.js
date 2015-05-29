/**
 * pub-generator test-basics
 * tests for basic conversion of single file to single page (with urls)
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test-basics');

var u = require('pub-util');
var should = require('should');

var tests =
[
{ name: 'nothing in label or file.path',
  page: '/',
  file: {
    path: '',
    text: 'hello world'
  },
  pagetype: 'undefined'
},

{ name: 'home page in index.md with no label',
  page: '/',
  file: {
    path: '/index.md',
    text: 'hello world'
  },
  result: '<div data-render-html="/"><p>hello world</p>\n</div>'
},

{ name: '/dir/ directory index.md with no label',
  page: '/dir/',
  file: {
    path: '/dir/index.md',
    text: 'hello world'
  },
  result: '<div data-render-html="/dir/"><p>hello world</p>\n</div>'
},

{ name: '/bar in bar.md with no label',
  page: '/bar',
  file: {
    path: '/bar.md',
    text: 'hello world'
  },
  result: '<div data-render-html="/bar"><p>hello world</p>\n</div>'
},

{ name: '/dir/bar in bar.md with no label',
  page: '/dir/bar',
  file: {
    path: '/dir/bar.md',
    text: 'hello world'
  },
  result: '<div data-render-html="/dir/bar"><p>hello world</p>\n</div>'
},

{ name: '/bar in foo.md with label /bar',
  page: '/bar',
  file: {
    path: '/foo.md',
    text: '---- /bar ----\n\nhello world'
  },
  result: '<div data-render-html="/bar"><p>hello world</p>\n</div>'
},

{ name: 'home page missing',
  page: '/',
  file: {
    path: '/foo.md',
    text: 'hello world'
  },
  pagetype: 'undefined'
},

{ name: 'home page in foo.md with label /',
  page: '/',
  file: {
    path: '/foo.md',
    text: '---- / ----\n\nhello world'
  },
  result: '<div data-render-html="/"><p>hello world</p>\n</div>'
},

{ name: 'minimal page with one update',
  page: '/update',
  file: {
    path: '/update.md',
    text: 'hello world\n\n---- (update) ----\n\nhellow'
  },
  result: '<div data-render-html="/update"><p>hellow</p>\n</div>'
},

{ name: 'minimal page with two extra fragments',
  page: '/fragments',
  file: {
    path: '/fragments.md',
    text: 'hello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2'
  },
  result: '<div data-render-html="/fragments"><p>hello world</p>\n' +
  '</div><div data-render-html="/fragments#fragment-1"><p>fragment1</p>\n' +
  '</div><div data-render-html="/fragments#fragment-2"><p>fragment2</p>\n</div>'
},

{ name: 'minimal page with two extra fragments and customized default template',
  page: '/template',
  file: {
    path: '/template.md',
    text: 'hello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2\n\n' +
    '---- /default.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr>{{{html}}}{{/each}}'
  },
  result: '<div data-render-html="/template"><p>hello world</p>\n' +
  '</div><hr><div data-render-html="/template#fragment-1"><p>fragment1</p>\n' +
  '</div><hr><div data-render-html="/template#fragment-2"><p>fragment2</p>\n</div>'
},

{ name: 'page with fragments and non-default template',
  page: '/template',
  file: {
    path: '/template.md',
    text: '---- ----\ntemplate: special\n\nhello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2\n\n' +
    '---- /special.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr>{{{html}}}{{/each}}<hr>'
  },
  result: '<div data-render-html="/template"><p>hello world</p>\n' +
  '</div><hr><div data-render-html="/template#fragment-1"><p>fragment1</p>\n' +
  '</div><hr><div data-render-html="/template#fragment-2"><p>fragment2</p>\n</div><hr>'
},

{ name: 'page with 2 named fragments and a custom template',
  page: '/template',
  file: {
    path: '/template.md',
    text: '---- ----\ntemplate: custom\n\nhello world\n\n---- Hello ----\n\nfragment1\n\n---- World ----\n\nfragment2\n\n' +
    '---- /custom.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr><h1>{{title}}</h1>\n{{{html}}}{{/each}}<hr>'
  },
  result: '<div data-render-html="/template"><p>hello world</p>\n</div><hr><h1>Hello</h1>\n' +
  '<div data-render-html="/template#hello"><p>fragment1</p>\n</div><hr><h1>World</h1>\n' +
  '<div data-render-html="/template#world"><p>fragment2</p>\n</div><hr>'
},

{ name: 'simple page and a main-layout template',
  page: '/',
  file: {
    path: '/index.md',
    text: 'hello world\n\n---- /main-layout.hbs ----\n\n<div class="main-layout">test<br>{{{renderPage}}}</div>'
  },
  result: '<div class="main-layout">test<br><div data-render-page="default"><div data-render-html="/"><p>hello world</p>\n</div></div></div>'
},

{ name: 'simple page and doc-layout and main-layout templates',
  page: '/',
  file: {
    path: '/index.md',
    text: 'hello world\n\n---- /main-layout.hbs ----\n\n<div class="main-layout">inner layout<br>{{{renderPage}}}</div>' +
      '\n\n---- /doc-layout.hbs ----\n\n<div class="doc-layout">outer layout<br>{{{renderLayout}}}</div>'
  },
  result: '<div class="doc-layout">outer layout<br>' +
            '<div data-render-layout="main-layout"><div class="main-layout">inner layout<br>' +
              '<div data-render-page="default"><div data-render-html="/"><p>hello world</p>\n</div></div></div>\n\n' +
            '</div>' +
          '</div>'
},

{ name: 'simple page and a doc-layout template with a renderPage - confusing but works',
  page: '/',
  file: {
    path: '/index.md',
    text: 'hello world\n\n---- /doc-layout.hbs ----\n\n<div class="doc-layout">test<br>{{{renderPage}}}</div>'
  },
  result: '<div class="doc-layout">test<br><div data-render-page="default"><div data-render-html="/"><p>hello world</p>\n</div></div></div>'
},

{ name: 'simple page and a doc-layout template with a renderLayout - will break editor',
  page: '/',
  file: {
    path: '/index.md',
    text: 'hello world\n\n---- /doc-layout.hbs ----\n\n<div class="doc-layout">test<br>{{{renderLayout}}}</div>'
  },
  result: '<div class="doc-layout">test<br><div data-render-layout="default"><div data-render-html="/"><p>hello world</p>\n</div></div></div>'
},

{ name: 'name with spaces etc.',
  page: '/name-with-spaces',
  file: {
    path: '/Name with spaces _ @.md',
    text: 'hello world'
  },
  result: '<div data-render-html="/name-with-spaces"><p>hello world</p>\n</div>'
},

];




tests.reverse().forEach(function run(tst) {

  test(tst.name, function(done) {

    var opts = { jquery:0,
      sources: [ { path:'.', files:[tst.file], fragmentDelim:true } ] };

    var generator = require('../generator')(opts);

    generator.load(function(err) {
      if (err) return done(err);

      generator.pages.length.should.be.exactly(1);

      generator.getPage(tst.page, function(err, page) {
        if (err) return done(err);

        // console.log(u.inspect(page, {depth:3}));

        (typeof page).should.be.exactly(tst.pagetype || 'object');
        if (tst.pagetype !== 'undefined') {

          var actual = generator.renderDoc(page);
          actual.should.be.exactly(tst.result);
        }

        // load again and retest to simulate reload
        generator.load(function(err) {
          if (err) return done(err);

          generator.pages.length.should.be.exactly(1);

          generator.getPage(tst.page, function(err, page) {
            if (err) return done(err);

            // console.log(u.inspect(page, {depth:3}));

            (typeof page).should.be.exactly(tst.pagetype || 'object');
            if (tst.pagetype !== 'undefined') {

              var actual = generator.renderDoc(page);
              actual.should.be.exactly(tst.result);
            }
            done();
          });
        });
      });
    });
  });

});
