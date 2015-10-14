/**
 * test-parsefiles
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

var test = require('tape')
var deepDiff = require('deep-diff').diff;

var u = require('pub-util');
var inspect = require('util').inspect;

var sources = [{ path:__dirname + '/md-old', fragmentDelim:true, leftDelim:'----', rightDelim:'', headerDelim:'----' }];
var opts = require('pub-resolve-opts')( { jquery:false, sources:sources } );

var generator = {};
require('../parsefiles')(generator);
require('../getsources')(generator);
var getSources = generator.getSources;

var serializeFiles = require('../serialize')().serializeFiles;

var files = [
  { path: '/index.md' },
  { path: '/page1.md' },
  { path: '/page2~.md' },
  { path: '/page3.md' }
];

var fragments =
[
  { _href: '/',
    _hdr:'',
    _txt: '# root page\n- hello world\n\n## heading2\n\npara\n\n',
    _file: files[0],
    name: '/' },

  { _href: '/#fragment-1',
    _hdr:'----\n----\n',
    _txt: '## fragment 1',
    _file: files[0] },

  { _href: '/page1',
    _hdr:'',
    _txt: '# page1\ncontent\ncontent\n',
    _file: files[1] },

  { _href: '/page2',
    a: '1',
    _hdr:'----\na:1\n\n----\n',
    _txt: '\n# page2\ncontent\ncontent\n\n',
    _file: files[2],
    name: 'page2~' },

  { _href: '/page2#fragment-1',
    _hdr:'----\n----\n',
    _txt: '\n# page2#1\ncontent\ncontent\n\n',
    _file: files[2] },

  { _href: '/page3',
    page: '/page3',
    _hdr:'----\npage: /page3\n\n----\n',
    _txt: '# page3\nhas 2 additional fragments and some detached fragments\n\n',
    _file:files[3] },

  { _href: '/page3#fragment-1',
    fragment: '/page3#fragment-1',
    _hdr:'----\nfragment:/page3#fragment-1\n\n----\n',
    _txt: '# fragment 1\n\n',
    _file:files[3] },

  { _href: '/pagex#orphan-fragment-1',
    fragment: '/pagex#orphan-fragment-1',
    _hdr:'----\nfragment:/pagex#orphan-fragment-1\n\n----\n',
    _txt: 'orphan\n\n',
    _file:files[3] },

  { _href: '/page1#in-page3',
    fragment: '/page1#in-page3',
    _hdr:'----\nfragment:/page1#in-page3\n\n----\n',
    _txt: '\n',
    _file:files[3] },

  { _href: '/page3#fragment-2',
    fragment: '/page3#fragment-2',
    _hdr:'----\nfragment:/page3#fragment-2\n\n----',
    _txt: '',
    _file:files[3] },
];

files[0].fragments = [fragments[0],
                      fragments[1]];

files[1].fragments = [fragments[2]];

files[2].fragments = [fragments[3],
                      fragments[4]];

files[3].fragments = [fragments[5],
                      fragments[6],
                      fragments[7],
                      fragments[8],
                      fragments[9]];

files[0].source = sources[0];
files[1].source = sources[0];
files[2].source = sources[0];
files[3].source = sources[0];

sources[0].files = files;
sources[0].fragments = fragments;

test('md-old directory tree', function(t) {

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, actual) {
    t.error(err);
    // console.log(inspect(actual, {depth:3}));
    assertNoDiff(t, actual, fragments, 'parsed');

    _sources[0].files = serializeFiles(_sources[0].files); // replace memoized files

    getSources(_sources, opts, function(err, actual2) {
      t.error(err);
      assertNoDiff(t, actual, actual2, 'serialized');
      t.end();
    });
  });
});

function assertNoDiff(t, actual, expected, msg) {
  var diff = deepDiff(actual, expected);
  var maxdiff = 5;
  if (diff) {
    t.assert(false, 'deepDiff ' + (msg || '') + '\n'
      + inspect(diff.slice(0,maxdiff), {depth:3})
      + (diff.length > maxdiff ? '\n...(truncated)' : ''));
  }
}
