/**
 * test-parsefiles single-file
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

var test = require('tape')
var deepDiff = require('deep-diff').diff;

var u = require('pub-util');

var sources = [{ path:__dirname + '/single-file-source.md', fragmentDelim:true }];
var opts = require('pub-resolve-opts')( { jquery:false, sources:sources } );

var getSources = require('../getsources');
var serializeFiles = require('../serialize')().serializeFiles;

var file = { path: '/single-file-source.md'  };

var fragments = [

{ _hdr: '---- / ----\n\n',
  _txt: '# home page\n- [david](/people/david-cook)\n\n',
  _file: file,
  _href: '/' },

{ _hdr: '---- /people/david-cook ----\nname: David\ntemplate: bio\nbirthday: 1-1-1989\nnote: this is a markdown fragment\n\n',
  _txt: '# David Cook\n- engineer\n\n',
  name: 'David Cook',
  _file: file,
  name: 'David',
  template: 'bio',
  birthday: '1-1-1989',
  note: 'this is a markdown fragment',
  _href: '/people/david-cook' },

{ _hdr: '---- (update /people/david-cook#fragment1) ----\n\n',
  _txt: '## this is an update for #fragment1\n\n',
  _file: file,
  _href: '/people/david-cook#fragment1',
  _update:
  { _hdr: '---- #fragment1 ----\n\n',
    _txt: '## This is a named markdown fragment\n\n',
    _file: file,
    _href: '/people/david-cook#fragment1' }},

{ _hdr: '---- ----\n\n',
  _txt: '## this is an unnamed markdown fragment\n\n',
  _file: file,
  _href: '/people/david-cook#fragment-3' },

{ _hdr: '---- (update) ----\nnote: this is an update for the previous unnamed markdown fragment\n\n',
  _txt: '<h2>David</h2>\n\n',
  _file: file,
  note: 'this is an update for the previous unnamed markdown fragment',
  _href: '/people/david-cook#fragment-4',
  _update:
  { _hdr: '--------\n\n',
    _txt: '<h2>this is another unnamed markdown fragment</h2>\n\n',
    _file: file,
    _href: '/people/david-cook#fragment-4' }},

{ _hdr: '---- (update /bar david 1/1/2011 \'correct price\') ----\nhref:\nprice: 2.99\n\n',
  _txt: 'text\nwithout break\n\n',
  _file: file,
  price: '2.99',
  _href: '/bar',
  _update:
  { _hdr: '---- /Bar ----\nprice: 1.99\n\n',
    _txt: 'text\nwithout break\n\n',
    name: 'Bar',
    _file: file,
    price: '1.99',
    _href: '/bar' }},

{ _hdr: '---- /new-page (draft) ----\n\n',
  _txt: '## this is draft new page\n\n',
  _draft: true,
  _file: file,
  _href: '/new-page' },

{ _hdr: '---- (draft) ----\npage: /new-page2\n\n',
  _txt: '## this is another draft new page\n\n',
  _draft: true,
  _file: file,
  page: '/new-page2',
  _href: '/new-page#fragment-11' },

{ _hdr: '---- /default.hbs ----\n\n',
  _txt: '{{{html}}}\n{{#each _fragments}}{{{html}}}{{/each}}\n\n',
  _file: file,
  _compile: 'handlebars',
  _href: '/default.hbs' },

{ _hdr: '---- /bio.hbs ----\n\n',
  _txt: '{{{html}}}\n\n',
  _file: file,
  _compile: 'handlebars',
  _href: '/bio.hbs' },

{ _hdr: '---- /doc-layout.hbs ----\n\n',
  _txt: '<html>\n<head>\n<title>minimal</title>\n</head>\n<body>\n\n{{{renderPage}}}\n\n<script src="/js/jquery.js"></script>\n{{{pub-ux}}}\n</body>\n</html>\n\n',
  _file: file,
  _compile: 'handlebars',
  _href: '/doc-layout.hbs' },

{ _hdr: '---- /css/styles.css ----\n\n',
  _txt: '',
  _file: file,
  notemplate:true,
  nocrawl:true,
  _href: '/css/styles.css' },

{ _hdr: '---- /js/jquery.js ----\nsrc: http://...\n\n',
  _txt: '',
  _file: file,
  src: 'http://...',
  notemplate:true,
  nocrawl:true,
  _href: '/js/jquery.js' },

{ _hdr: '---- /sitemap.xml ----\ntemplate: sitemap\n\n',
  _txt: '',
  _file: file,
  template: 'sitemap',
  nocrawl:true,
  _href: '/sitemap.xml' },

{ _hdr: '---- /robots.txt ----\ntemplate: robots\n\n',
  _txt: '',
  _file: file,
  template: 'robots',
  nocrawl:true,
  _href: '/robots.txt' }
];

snapshots = [
  { _href: '',
    _hdr: '---- (snapshot /bar - 1/1/2011-14:33) ----\nname: Bar some time ago\n\n',
    _txt: 'text\n\n',
    _lbl: { func:'snapshot', ref:'/bar' },
    _file: file,
    name: 'Bar some time ago' }
];


file.fragments = [
    fragments[0],
    fragments[1],
    fragments[2]._update,
    fragments[3],
    fragments[4]._update,
    fragments[4],
    fragments[2],
    fragments[5]._update,
    fragments[5],
    snapshots[0],
    fragments[6],
    fragments[7],
    fragments[8],
    fragments[9],
    fragments[10],
    fragments[11],
    fragments[12],
    fragments[13],
    fragments[14]
  ];

file.source = sources[0];

sources[0].files = [file];
sources[0].fragments =  u.map(fragments, function(f) { return f._update || f; }); // unswap
sources[0].updates = [fragments[4],fragments[2],fragments[5]]; // note order
sources[0].drafts =  u.filter(fragments, function(f) { return f._draft; });
sources[0].snapshots =  snapshots;


test('single file', function(t) {

  // start from clone of sources without files
  var _sources = [u.omit(sources[0], 'files')];

  getSources(_sources, opts, function(err, actual) {
    t.error(err);
    // console.log(u.inspect(actual, {depth:4}));
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
