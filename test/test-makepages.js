/**
 * test-makepages.js
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 * uses deep-diff so that errors produce something useful
**/

suite('test-makepages');

var assert = require('assert');
var u = require('pub-util');
var deepdiff = require('deep-diff');

var sources = [{ path:__dirname + '/md', fragmentDelim:true }];
var opts = require('pub-resolve-opts')( { sources:sources } );

var getSources = require('../getsources');

var makepages = require('../makepages');

var files = [
  { path: '/draft-page.md' },
  { path: '/index.md' },
  { path: '/page1-bis.md' },
  { path: '/page1.md' },
  { path: '/page2~.md' },
  { path: '/page3.md' },
  { path: '/page4.md' },
];

var pages = [

{ _href: '/draft-page',
  _hdr: '---- (draft) ----\n\n',
  _txt: 'just some text\n',
  _draft: true,
  _file: files[0]
},

{ _href: '/',
  _file: files[1],
  _hdr: '',
  _txt: '# root page\n- hello world\n\n## heading2\n\npara\n\n',
  _fragments: [
    { _href: '/#fragment-1',
      _file: files[1],
      _hdr: '---- ----\n\n',
      _txt: '## fragment 1' }
  ]
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
}

];

var orphans = [
{ _href: '/pagex#orphan-fragment-1',
  _file: files[5],
  _hdr: '---- /pagex#orphan-fragment-1 ----\n\n',
  _txt: 'This fragment is an orphan without a parent page\n\n' }
];

files[0].fragments = [pages[0]];

files[1].fragments = [pages[1],
                      pages[1]._fragments[0]];

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


files[0].source = sources[0];
files[1].source = sources[0];
files[2].source = sources[0];
files[3].source = sources[0];
files[4].source = sources[0];
files[5].source = sources[0];
files[6].source = sources[0];

sources[0].files = files;
sources[0].fragments = u.flatten(u.pluck(files, 'fragments')); // file fragments include originals and updates
sources[0].updates = [sources[0].fragments[3], sources[0].fragments[13]];
sources[0].fragments.splice(3,1); // remove update 1
sources[0].fragments.splice(12,1); // remove update 2
sources[0].drafts =  u.filter(sources[0].fragments, function(f) { return f._draft; });


// console.log(u.map(sources[0].fragments, function(f) { return f._href + ' = ' + f._hdr; }));

pages[1]['#fragment-1'] = pages[1]._fragments[0];
pages[2]['#in-page3']   = pages[2]._fragments[0];
pages[3]['#fragment-1'] = pages[3]._fragments[0];
pages[4]['#fragment-1'] = pages[4]._fragments[0];
pages[4]['#fragment-2'] = pages[4]._fragments[1];

pages[1]._children = [
  pages[0],
  pages[2],
  pages[3],
  pages[4],
  pages[5],
];

pages[0]._next = pages[2];
pages[2]._next = pages[3];
pages[3]._next = pages[4];
pages[4]._next = pages[5];

pages[2]._prev = pages[0];
pages[3]._prev = pages[2];
pages[4]._prev = pages[3];
pages[5]._prev = pages[4];

pages[0]._parent = pages[1];
pages[2]._parent = pages[1];
pages[3]._parent = pages[1];
pages[4]._parent = pages[1];
pages[5]._parent = pages[1];

test("read md directory tree and make pages", function(done) {

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, fragments) {
    if (err) return done(err);

    var actual = makepages(fragments);
    // console.log(u.map(actual[0]._file.source.fragments, function(f) { return f._href + ' = ' + f._hdr; }));

    assertNoDiff(actual, pages, 'makepages');
    done();
  });
});

function assertNoDiff(actual, expected, msg) {
  var diff = deepdiff(actual, expected);
  var maxdiff = 5;
  if (diff) {
    assert(false, 'deepDiff ' + msg + '\n'
      + u.inspect(diff.slice(0,maxdiff), {depth:3})
      + (diff.length > maxdiff ? '\n...(truncated)' : ''));
  }
}
