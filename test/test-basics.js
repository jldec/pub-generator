/**
 * pub-generator test-basics
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
  result: '<p>hello world</p>\n'
},

{ name: '/bar in bar.md with no label',
  page: '/bar',
  file: {
    path: '/bar.md',
    text: 'hello world'
  },
  result: '<p>hello world</p>\n'
},

{ name: '/bar in foo.md with label /bar',
  page: '/bar',
  file: {
    path: '/foo.md',
    text: '---- /bar ----\n\nhello world'
  },
  result: '<p>hello world</p>\n'
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
  result: '<p>hello world</p>\n'
},

{ name: 'minimal page with one update',
  page: '/update',
  file: {
    path: '/update.md',
    text: 'hello world\n\n---- (update) ----\n\nhellow'
  },
  result: '<p>hellow</p>\n'
},

{ name: 'minimal page with two extra fragments',
  page: '/fragments',
  file: {
    path: '/fragments.md',
    text: 'hello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2'
  },
  result: '<p>hello world</p>\n<p>fragment1</p>\n<p>fragment2</p>\n'
},

{ name: 'minimal page with two extra fragments and customized default template',
  page: '/template',
  file: {
    path: '/template.md',
    text: 'hello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2\n\n' +
    '---- /default.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr>{{{html}}}{{/each}}'
  },
  result: '<p>hello world</p>\n<hr><p>fragment1</p>\n<hr><p>fragment2</p>\n'
},

{ name: 'page with fragments and non-default template',
  page: '/template',
  file: {
    path: '/template.md',
    text: '---- ----\ntemplate: special\n\nhello world\n\n---- ----\n\nfragment1\n\n---- ----\n\nfragment2\n\n' +
    '---- /special.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr>{{{html}}}{{/each}}<hr>'
  },
  result: '<p>hello world</p>\n<hr><p>fragment1</p>\n<hr><p>fragment2</p>\n<hr>'
},

{ name: 'page with 2 named fragments and a custom template',
  page: '/template',
  file: {
    path: '/template.md',
    text: '---- ----\ntemplate: custom\n\nhello world\n\n---- Hello ----\n\nfragment1\n\n---- World ----\n\nfragment2\n\n' +
    '---- /custom.hbs ----\n\n{{{html}}}{{#each _fragments}}<hr><h1>{{name}}</h1>\n{{{html}}}{{/each}}<hr>'
  },
  result: '<p>hello world</p>\n<hr><h1>Hello</h1>\n<p>fragment1</p>\n<hr><h1>World</h1>\n<p>fragment2</p>\n<hr>'
},

{ name: 'name with spaces etc.',
  page: '/name-with-spaces',
  file: {
    path: '/Name with spaces _ @.md',
    text: 'hello world'
  },
  result: '<p>hello world</p>\n'
},

];




tests.reverse().forEach(function run(tst) {

  test(tst.name, function(done) {

    var opts = {
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
