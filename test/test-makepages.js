/**
 * test-makepages.js
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 * uses deep-diff so that errors produce something useful
**/

var test = require('tape')
var deepDiff = require('deep-diff').diff;

var u = require('pub-util');
var inspect = require('util').inspect;

var sources = [{ path:__dirname + '/md', fragmentDelim:true }];
var opts = require('pub-resolve-opts')( { jquery:false, sources:sources } );

var generator = {};
require('../parsefiles')(generator);
require('../getsources')(generator);
var getSources = generator.getSources;

var makepages = require('../makepages');

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

var pages = [

{ _href: '/',
  _file: files[0],
  _hdr: '',
  _txt: '# root page\n- hello world\n\n## heading2\n\npara\n\n',
  name: '/',
  _fragments: [
    { _href: '/#fragment-1',
      _file: files[0],
      _hdr: '---- ----\n\n',
      _txt: '## fragment 1' }
  ]
},

{ _href: '/draft-page',
  _hdr: '---- (draft) ----\n\n',
  _txt: 'just some text\n',
  _draft: true,
  _file: files[1]
},

{ _hdr: '---- /page1-bis (update /page1) ----\n\n',
   _txt: '# page1-bis\nupdated content\ncontent\n',
   _file: files[2],
   _href: '/page1-bis',
   _update: {
     _hdr: '',
     _txt: '# page1\ncontent\ncontent\n',
     _file: files[3],
     _href: '/page1' },
   _fragments: [
   { _href: '/page1-bis#in-page3',
     _hdr: '---- /page1-bis#in-page3 ----\n\n',
     _txt: 'This fragment has to use the updated /page1-bis page qualifier (not the original /page1)\n\n',
     _file: files[5]}
  ]
},

{ _href: '/page2',
  _file: files[4],
  a: '1',
  _hdr: '---- ----\na:1\n\n',
  _txt: '# page2\ncontent\ncontent\n\n',
  name: 'page2~',
  _fragments: [
    { _href: '/page2#fragment-1',
      _file: files[4],
      _hdr: '---- ----\n\n',
      _txt: '# page2#1\ncontent\ncontent\n\n' }
  ]
},

{ _href: '/page3',
  _file: files[5],
  _hdr: '---- /page3 ----\n\n',
  _txt: '# page3\nhas 2 additional fragments and some detached fragments\n\n',
  _fragments: [
    { _href:'/page3#fragment-1',
      _file: files[5],
      _hdr: '---- /page3#fragment-1 ----\n\n',
      _txt: '# fragment 1\n\n'
    },
    { _href: '/page3#fragment-2',
      _file: files[5],
      _hdr: '---- /page3#fragment-2 ----\n\n',
      _txt: 'This fragment would end up on the same page as the previous fragment without the /page3 qualifier' }
  ]
},

{ _href: '/page4',
  _hdr: '---- (update) ----\n\n',
  _txt: '# page 4\n\nupdated text\n\n',
  _file: files[6],
  _update: {
    _href: '/page4',
    _hdr: '',
    _txt: '# page4\n\ninitial text\n\n',
    _file: files[6] }
},

{ _href: '/camelcase-sub-dir/',
  name: 'CamelCase Sub-Dir',
  _hdr: '',
  _txt: '## CamelCase Sub-Dir Heading\ncontent\n',
  _file: files[7]
},

{ _href: '/camelcase-sub-dir/nice-file-name',
  name: 'Nice File Name',
  _hdr: '',
  _txt: '## heading\ncontent',
  _file: files[8]
}
];

var orphans = [
{ _href: '/pagex#orphan-fragment-1',
  _file: files[5],
  _hdr: '---- /pagex#orphan-fragment-1 ----\n\n',
  _txt: 'This fragment is an orphan without a parent page\n\n' }
];

files[0].fragments = [pages[0],
                      pages[0]._fragments[0]];

files[1].fragments = [pages[1]];

files[2].fragments = [pages[2]];

files[3].fragments = [pages[2]._update];

files[4].fragments = [pages[3],
                      pages[3]._fragments[0]];

files[5].fragments = [pages[4],
                      pages[4]._fragments[0],
                      orphans[0],
                      pages[2]._fragments[0],
                      pages[4]._fragments[1]];

files[6].fragments = [pages[5]._update,
                      pages[5]];

files[7].fragments = [pages[6]];
files[8].fragments = [pages[7]];


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
sources[0].fragments = u.flatten(u.pluck(files, 'fragments')); // file fragments include originals and updates
sources[0].updates = [sources[0].fragments[3], sources[0].fragments[13]];
sources[0].fragments.splice(3,1); // remove update 1
sources[0].fragments.splice(12,1); // remove update 2
sources[0].drafts =  u.filter(sources[0].fragments, function(f) { return f._draft; });

pages[0]['#fragment-1'] = pages[0]._fragments[0];
pages[2]['#in-page3']   = pages[2]._fragments[0];
pages[3]['#fragment-1'] = pages[3]._fragments[0];
pages[4]['#fragment-1'] = pages[4]._fragments[0];
pages[4]['#fragment-2'] = pages[4]._fragments[1];

pages[0]._children = [
  pages[1],
  pages[2],
  pages[3],
  pages[4],
  pages[5],
  pages[6],
];

pages[6]._children = [
  pages[7],
];

pages[1]._next = pages[2];
pages[2]._next = pages[3];
pages[3]._next = pages[4];
pages[4]._next = pages[5];
pages[5]._next = pages[6];

pages[2]._prev = pages[1];
pages[3]._prev = pages[2];
pages[4]._prev = pages[3];
pages[5]._prev = pages[4];
pages[6]._prev = pages[5];

pages[1]._parent = pages[0];
pages[2]._parent = pages[0];
pages[3]._parent = pages[0];
pages[4]._parent = pages[0];
pages[5]._parent = pages[0];
pages[6]._parent = pages[0];

pages[7]._parent = pages[6];

test("read md directory tree and make pages", function(t) {

  t.timeoutAfter(10000);

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, fragments) {
    t.error(err);
    var actual = makepages(fragments);
    assertNoDiff(t, actual, pages);
    t.end();
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
