/**
 * test-parsefiles
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

var test = require('tape')
var deepDiff = require('deep-diff').diff;

var u = require('pub-util');

var sources = [{ path:__dirname + '/md', fragmentDelim:true }];
var opts = require('pub-resolve-opts')( { jquery:false, sources:sources } );

var getSources = require('../getsources');
var serializeFiles = require('../serialize')().serializeFiles;

var files = [
  { path: '/index.md' },
  { path: '/draft-page.md' },
  { path: '/page1-bis.md' },
  { path: '/page1.md' },
  { path: '/page2~.md' },
  { path: '/page3.md' },
  { path: '/page4.md' },
  { path: '/CamelCase Sub-Dir/index.md' },
  { path: '/CamelCase Sub-Dir/Nice File Name.md' }
];

var fragments =
[
  { // NOTE name comes from parent dir for /index.md
    _href: '/',
    _hdr: '',
    _txt: '# root page\n- hello world\n\n## heading2\n\npara\n\n',
    _file: files[0],
    name: '/' },

  { _href: '/#fragment-1',
    _hdr: '---- ----\n\n',
    _txt: '## fragment 1',
    _file: files[0] },

  { _href: '/draft-page',
    _hdr: '---- (draft) ----\n\n',
    _draft: true,
    _txt: 'just some text\n',
    _file: files[1] },

  { // NOTE update page: header changes _href
    _href: '/page1-bis',
    _hdr: '---- /page1-bis (update /page1) ----\n\n',
    _txt: '# page1-bis\nupdated content\ncontent\n',
    _file: files[2],
    _update: {
      _href: '/page1',
      _hdr: '',
      _txt: '# page1\ncontent\ncontent\n',
      _file: files[3] }},

  { // NOTE extra name property comes from filename with ~
    _href: '/page2',
    a: '1',
    _hdr: '---- ----\na:1\n\n',
    _txt: '# page2\ncontent\ncontent\n\n',
    _file: files[4],
    name: 'page2~' },

  { _href: '/page2#fragment-1',
    _hdr: '---- ----\n\n',
    _txt: '# page2#1\ncontent\ncontent\n\n',
    _file: files[4] },

  { _href: '/page3',
    _hdr: '---- /page3 ----\n\n',
    _txt: '# page3\nhas 2 additional fragments and some detached fragments\n\n',
    _file: files[5] },

  { _href: '/page3#fragment-1',
    _hdr: '---- /page3#fragment-1 ----\n\n',
    _txt: '# fragment 1\n\n',
    _file: files[5] },

  { _href: '/pagex#orphan-fragment-1',
    _hdr: '---- /pagex#orphan-fragment-1 ----\n\n',
    _txt: 'This fragment is an orphan without a parent page\n\n',
    _file: files[5] },

  { _href: '/page1-bis#in-page3',
    _hdr: '---- /page1-bis#in-page3 ----\n\n',
    _txt: 'This fragment has to use the updated /page1-bis page qualifier (not the original /page1)\n\n',
    _file: files[5] },

  { _href: '/page3#fragment-2',
    _hdr: '---- /page3#fragment-2 ----\n\n',
    _txt: 'This fragment would end up on the same page as the previous fragment without the /page3 qualifier',
    _file: files[5] },

  { _href: '/page4',
    _hdr: '---- (update) ----\n\n',
    _txt: '# page 4\n\nupdated text\n\n',
    _file: files[6],
    _update: {
      _href: '/page4',
      _hdr: '',
      _txt: '# page4\n\ninitial text\n\n',
      _file: files[6] }},

  { _href: '/camelcase-sub-dir/',
    _hdr: '',
    _txt: '## CamelCase Sub-Dir Heading\ncontent\n',
    _file: files[7],
    name: 'CamelCase Sub-Dir' },

  { _href: '/camelcase-sub-dir/nice-file-name',
    _hdr: '',
    _txt: '## heading\ncontent',
    _file: files[8],
    name: 'Nice File Name' }

];

files[0].fragments = [fragments[0],
                      fragments[1]];

files[1].fragments = [fragments[2]];

files[2].fragments = [fragments[3]];

files[3].fragments = [fragments[3]._update];

files[4].fragments = [fragments[4],
                      fragments[5]];

files[5].fragments = [fragments[6],
                      fragments[7],
                      fragments[8],
                      fragments[9],
                      fragments[10]];

files[6].fragments = [fragments[11]._update,
                      fragments[11]];

files[7].fragments = [fragments[12]];
files[8].fragments = [fragments[13]];

files[0].source = sources[0];
files[1].source = sources[0];
files[2].source = sources[0];
files[3].source = sources[0];
files[4].source = sources[0];
files[5].source = sources[0];
files[6].source = sources[0];
files[7].source = sources[0];
files[8].source = sources[0];

sources[0].files = files;
sources[0].fragments =  u.map(fragments, function(f) { return f._update || f; });
sources[0].updates = u.filter(fragments, function(f) { return f._update; });
sources[0].drafts =  u.filter(fragments, function(f) { return f._draft; });

test('md directory tree', function(t) {

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, actual) {
    t.error(err);
    // console.log(u.inspect(actual, {depth:3}));
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
      + u.inspect(diff.slice(0,maxdiff), {depth:3})
      + (diff.length > maxdiff ? '\n...(truncated)' : ''));
  }
}
