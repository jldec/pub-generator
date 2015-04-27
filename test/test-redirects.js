/**
 * pub-generator test-redirects
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test-redirects');

var u = require('pub-util');
var assert = require('assert');

var tests =
[

{ name: 'page with one alias',
  pages: ['/bar'],
  redirectTo: '/foo',
  file: {
    path: '/foo.md',
    text: '---- ----\nalias: /bar\n\nhello'
  }
},

{ name: 'page with 3 aliases',
  pages: ['/bar', '/barf', '/gag'],
  redirectTo: '/foo',
  file: {
    path: '/foo.md',
    text: '---- ----\nalias: /bar\nalias: /barf\nalias: /gag\n\nhello'
  }
},

{ name: 'redirect without params',
  pages: ['/testRedirect'],
  redirectTo: '/new/url?test=1',
  file: {
    path: '/whatever.md',
    text: '---- /new/url ----\n\nhello'
  }
},

{ name: 'redirect with params',
  pages: ['/TESTREDIRECT?tst=%20x'],
  redirectTo: '/new/url?tst=%20x&test=1',
  file: {
    path: '/whatever.md',
    text: '---- /new/url ----\n\nhello'
  }
},

];


tests.reverse().forEach(function run(tst) {

  test(tst.name, function(done) {

    var opts = { sources: [ { path:'.', fragmentDelim:true, files:[tst.file] } ] };

    var generator = require('../generator')(opts);
    require('./custom-redirect')(generator);

    generator.load(function(err) {
      if (err) return done(err);

      u.each(tst.pages, function(page) {
        var newUrl = generator.redirect(page);
        assert.deepEqual(newUrl, { status:301, url:tst.redirectTo } );
        assert(typeof generator.findPage(newUrl.url) === 'object');
      });

      done();
    });
  });

});
