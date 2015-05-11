/**
 * test-parsefragments
 *
 * TODO: make tests more complete, and easier to interpret
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
*/

suite('test-parsefragments');

var parseFragments = require('../parsefragments');
var parseHeaders = require('../parseheaders');

var assert = require('assert')
var u = require('pub-util');

var newstyle = [
  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\n', out:[ { _txt: 'abc\n', _hdr: '' } ]},
  {in:'a\nbc', out:[ { _txt: 'a\nbc', _hdr: '' } ]},
  {in:'\n\n\n', out:[ { _txt: '\n\n\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:'---\n---', out:[ { _txt: '---\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\n-----', out:[ { _txt: '-----\n-----', _hdr: '' } ]},
  {in:'--------\n', out:[ { _txt: '', _hdr: '--------\n' } ]},
  {in:'---- ----\n', out:[ { _txt: '', _hdr: '---- ----\n' } ]},
  {in:'---- (draft) ----\n', out:[ { _txt: '', _hdr: '---- (draft) ----\n', _lbl:'(draft)' } ]},
  {in:'---- ----\n\n', out:[ { _txt: '', _hdr: '---- ----\n\n'  } ]},
  {in:'---- ----\n nonsense \n', out:[ { _txt: '', _hdr: '---- ----\n nonsense \n' } ]},
  {in:'\n---- ----\n\n', out:[ { _txt: '\n', _hdr: '' },{ _txt: '', _hdr: '---- ----\n\n' } ]},
  {in:'abc\n---- ----\n\n', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: '', _hdr: '---- ----\n\n' } ]},
  {in:'---- ----\n\n\n', out:[ { _txt: '\n', _hdr: '---- ----\n\n' } ]},
  {in:'---- ----\n\n\n\n', out:[ { _txt: '\n\n', _hdr: '---- ----\n\n' } ]},
  {in:'---- ----\n\n\nabc', out:[ { _txt: '\nabc', _hdr: '---- ----\n\n' } ]},
  {in:'abc\n---- ----\n\n\ndef', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: '\ndef', _hdr: '---- ----\n\n' } ]},
  {in:'---- ----\n---------\n', out:[ { _txt: '', _hdr: '---- ----\n---------\n' } ]},
  {in:'---------\n\n----\nabc', out:[ { _hdr:'---------\n\n', _txt:'----\nabc', _lbl:'-' } ]},
  {in:'---- ----\n\n--------\nabc', out:[ { _txt: '--------\nabc', _hdr: '---- ----\n\n' } ]},
  {in:'---- ----\na:\n', out:[ { _txt: '', _hdr: '---- ----\na:\n' } ]},
  {in:'---- ----\na: \n', out:[ { _txt: '', _hdr: '---- ----\na: \n' } ]},
  {in:'---- ----\na:1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na:1\n' } ]},
  {in:'---- ----\na: 1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na: 1\n' } ]},
  {in:'---- ----\na :1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na :1\n' } ]},
  {in:'---- ----\na : 1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na : 1\n' } ]},
  {in:'---- ----\n a:1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\n a:1\n' } ]},
  {in:'---- ----\na:1 \n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na:1 \n' } ]},
  {in:'---- ----\n a :1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\n a :1\n' } ]},
  {in:'---- ----\na: 1 \n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na: 1 \n' } ]},
  {in:'---- ----\n a : 1\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\n a : 1\n' } ]},
  {in:'---- ----\n a : 1 \n', out:[ { _txt: '', a:'1', _hdr: '---- ----\n a : 1 \n' } ]},
  {in:'\n---- ----\na:1\n', out:[ { _txt: '\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '---- ----\na:1\n' } ]},
  {in:'abc\n---- ----\na:1\n', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '---- ----\na:1\n' } ]},
  {in:'---- ----\na:1\n\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\na:1\n\n' } ]},
  {in:'---- ----\na:1\n\n\n', out:[ { _txt: '\n', a:'1', _hdr: '---- ----\na:1\n\n' } ]},
  {in:'---- ----\na:1\n\nabc', out:[ { _txt: 'abc', a:'1', _hdr: '---- ----\na:1\n\n' } ]},
  {in:'abc\n---- ----\na:1\n\ndef', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: 'def', a:'1', _hdr: '---- ----\na:1\n\n' } ]},
  {in:'---- ----\na:1\nb:2\nc:3\n', out:[ { _txt: '', a:'1', b:'2', c:'3', _hdr: '---- ----\na:1\nb:2\nc:3\n' } ]},
  {in:'---- ----\na:1\nb2\nc:3\n', out:[ { _txt: '', a:'1', c:'3', _hdr: '---- ----\na:1\nb2\nc:3\n' } ]},
  {in:'---- ----\na:1\n-----\nc:3\n', out:[ { _txt: '', a:'1', c:'3', _hdr: '---- ----\na:1\n-----\nc:3\n' } ]},
  {in:'---- ----\na:1\nb:2\na:4\n', out:[ { _txt: '', a:['1','4'], b:'2', _hdr: '---- ----\na:1\nb:2\na:4\n' } ]},
  {in:'---- ----\npage:_-hello\n', out:[ { _txt: '', page:'_-hello', _hdr: '---- ----\npage:_-hello\n' } ]},
  {in:'---- ----\nfragment:#\n', out:[ { _txt: '', fragment:'#', _hdr: '---- ----\nfragment:#\n' } ]},
  {in:'---- ----\npage:/foo/bar#\n', out:[ { _txt: '', page:'/foo/bar#', _hdr: '---- ----\npage:/foo/bar#\n' } ]},
  {in:'---- ----\npage:/foo/bar/#\n', out:[ { _txt: '', page:'/foo/bar/#', _hdr: '---- ----\npage:/foo/bar/#\n' } ]},
  {in:'---- ----\n!:1\n', out:[ { _txt: '', '!':'1', _hdr: '---- ----\n!:1\n' } ]},
  {in:'---- ----\n!!:1\n', out:[ { _txt: '', '!!':'1', _hdr: '---- ----\n!!:1\n' } ]},
  {in:'---- ----\n(!!):1\n', out:[ { _txt: '', '(!!)':'1', _hdr: '---- ----\n(!!):1\n' } ]},
  {in:
      '---- ----\n\n' +
      '---- ----\n',
   out:[
      { _hdr: '---- ----\n\n', _txt: '' },
      { _hdr: '---- ----\n',   _txt: '' } ]},
  {in:
      '---- ----\n\nhello\n' +
      '---- ----\nworl:d\n\n'  +
      '----boo----\n\n',
   out:[
      { _hdr: '---- ----\n\n',         _txt: 'hello\n' },
      { _hdr: '---- ----\nworl:d\n\n', _txt: '', worl: 'd' },
      { _hdr: '----boo----\n\n',       _txt: '', _lbl: 'boo' } ]}
];

var oldstyle = [
  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\n', out:[ { _txt: 'abc\n', _hdr: '' } ]},
  {in:'a\nbc', out:[ { _txt: 'a\nbc', _hdr: '' } ]},
  {in:'\n\n\n', out:[ { _txt: '\n\n\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:'---\n---', out:[ { _txt: '---\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\n-----', out:[ { _txt: '-----\n-----', _hdr: '' } ]},
  {in:'----\n----', out:[ { _txt: '', _hdr: '----\n----' } ]},
  {in:'---- \n----', out:[ { _txt: '', _hdr: '---- \n----' } ]},
  {in:'---- (draft)\n----', out:[ { _txt: '', _hdr: '---- (draft)\n----', _lbl:'(draft)' } ]},
  {in:'----\n\n----', out:[ { _txt: '', _hdr: '----\n\n----'  } ]},
  {in:'----\n nonsense \n----', out:[ { _txt: '', _hdr: '----\n nonsense \n----' } ]},
  {in:'\n----\n\n----', out:[ { _txt: '\n', _hdr: '' },{ _txt: '', _hdr: '----\n\n----' } ]},
  {in:'abc\n----\n\n----', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: '', _hdr: '----\n\n----' } ]},
  {in:'----\n\n----\n', out:[ { _txt: '', _hdr: '----\n\n----\n' } ]},
  {in:'----\n\n----\n\n', out:[ { _txt: '\n', _hdr: '----\n\n----\n' } ]},
  {in:'----\n\n----\nabc', out:[ { _txt: 'abc', _hdr: '----\n\n----\n' } ]},
  {in:'abc\n----\n\n----\ndef', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: 'def', _hdr: '----\n\n----\n' } ]},
  {in:'----\n---------\n----', out:[ { _txt: '', _hdr: '----\n---------\n----' } ]},
  {in:'---------\n----\n----\nabc', out:[ { _hdr:'---------\n----\n', _txt:'----\nabc', _lbl:'-----' } ]},
  {in:'----\n----\n--------\nabc', out:[ { _txt: '--------\nabc', _hdr: '----\n----\n' } ]},
  {in:'----\na:\n----', out:[ { _txt: '', _hdr: '----\na:\n----' } ]},
  {in:'----\na: \n----', out:[ { _txt: '', _hdr: '----\na: \n----' } ]},
  {in:'----\na:1\n----', out:[ { _txt: '', a:'1', _hdr: '----\na:1\n----' } ]},
  {in:'----\na: 1\n----', out:[ { _txt: '', a:'1', _hdr: '----\na: 1\n----' } ]},
  {in:'----\na :1\n----', out:[ { _txt: '', a:'1', _hdr: '----\na :1\n----' } ]},
  {in:'----\na : 1\n----', out:[ { _txt: '', a:'1', _hdr: '----\na : 1\n----' } ]},
  {in:'----\n a:1\n----', out:[ { _txt: '', a:'1', _hdr: '----\n a:1\n----' } ]},
  {in:'----\na:1 \n----', out:[ { _txt: '', a:'1', _hdr: '----\na:1 \n----' } ]},
  {in:'----\n a :1\n----', out:[ { _txt: '', a:'1', _hdr: '----\n a :1\n----' } ]},
  {in:'----\na: 1 \n----', out:[ { _txt: '', a:'1', _hdr: '----\na: 1 \n----' } ]},
  {in:'----\n a : 1\n----', out:[ { _txt: '', a:'1', _hdr: '----\n a : 1\n----' } ]},
  {in:'----\n a : 1 \n----', out:[ { _txt: '', a:'1', _hdr: '----\n a : 1 \n----' } ]},
  {in:'\n----\na:1\n----', out:[ { _txt: '\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '----\na:1\n----' } ]},
  {in:'abc\n----\na:1\n----', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '----\na:1\n----' } ]},
  {in:'----\na:1\n----\n', out:[ { _txt: '', a:'1', _hdr: '----\na:1\n----\n' } ]},
  {in:'----\na:1\n----\n\n', out:[ { _txt: '\n', a:'1', _hdr: '----\na:1\n----\n' } ]},
  {in:'----\na:1\n----\nabc', out:[ { _txt: 'abc', a:'1', _hdr: '----\na:1\n----\n' } ]},
  {in:'abc\n----\na:1\n----\ndef', out:[ { _txt: 'abc\n', _hdr: '' },{ _txt: 'def', a:'1', _hdr: '----\na:1\n----\n' } ]},
  {in:'----\na:1\nb:2\nc:3\n----', out:[ { _txt: '', a:'1', b:'2', c:'3', _hdr: '----\na:1\nb:2\nc:3\n----' } ]},
  {in:'----\na:1\nb2\nc:3\n----', out:[ { _txt: '', a:'1', c:'3', _hdr: '----\na:1\nb2\nc:3\n----' } ]},
  {in:'----\na:1\n-----\nc:3\n----', out:[ { _txt: '', a:'1', c:'3', _hdr: '----\na:1\n-----\nc:3\n----' } ]},
  {in:'----\na:1\nb:2\na:4\n----', out:[ { _txt: '', a:['1','4'], b:'2', _hdr: '----\na:1\nb:2\na:4\n----' } ]},
  {in:'----\npage:_-hello\n----', out:[ { _txt: '', page:'_-hello', _hdr: '----\npage:_-hello\n----' } ]},
  {in:'----\nfragment:#\n----', out:[ { _txt: '', fragment:'#', _hdr: '----\nfragment:#\n----' } ]},
  {in:'----\npage:/foo/bar#\n----', out:[ { _txt: '', page:'/foo/bar#', _hdr: '----\npage:/foo/bar#\n----' } ]},
  {in:'----\npage:/foo/bar/#\n----', out:[ { _txt: '', page:'/foo/bar/#', _hdr: '----\npage:/foo/bar/#\n----' } ]},
  {in:'----\n!:1\n----', out:[ { _txt: '', '!':'1', _hdr: '----\n!:1\n----' } ]},
  {in:'----\n!!:1\n----', out:[ { _txt: '', '!!':'1', _hdr: '----\n!!:1\n----' } ]},
  {in:'----\n(!!):1\n----', out:[ { _txt: '', '(!!)':'1', _hdr: '----\n(!!):1\n----' } ]},
  {in:
      '----\n----\n' +
      '----\n----',
   out:[
      { _hdr: '----\n----\n', _txt: '' },
      { _hdr: '----\n----',   _txt: '' } ]},
  {in:
      '----\n----\nhello\n' +
      '----\nworl:d\n----\n'  +
      '----boo\n----\n',
   out:[
      { _hdr: '----\n----\n',         _txt: 'hello\n' },
      { _hdr: '----\nworl:d\n----\n', _txt: '', worl: 'd' },
      { _hdr: '----boo\n----\n',      _txt: '', _lbl: 'boo' } ]}
];

var mdstyle = [
  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\n', out:[ { _txt: 'abc\n', _hdr: '' } ]},
  {in:'a\nbc', out:[ { _txt: 'a\nbc', _hdr: '' } ]},
  {in:'\n\n\n', out:[ { _txt: '\n\n\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:' #---', out:[ { _txt: ' #---', _hdr: '' } ]},
  {in:'\n-#--', out:[ { _txt: '\n-#--', _hdr: '' } ]},
  {in:'\n #', out:[ { _txt: '\n #', _hdr: '' } ]},
  {in:'\n #\n', out:[ { _txt: '\n #\n', _hdr: '' } ]},
  {in:'---\n---', out:[ { _txt: '---\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\n-----', out:[ { _txt: '-----\n-----', _hdr: '' } ]},
  {in:'#', out:[ { _txt: '#', _hdr: '' } ]},
  {in:'# #', out:[ { _txt: '# #', _hdr: '' } ]},
  {in:'#x#', out:[ { _txt: '#x#', _hdr: '', _lbl:'x' } ]},
  {in:'# x#', out:[ { _txt: '# x#', _hdr: '', _lbl:'x' } ]},
  {in:'#x #', out:[ { _txt: '#x #', _hdr: '', _lbl:'x' } ]},
  {in:'# x #', out:[ { _txt: '# x #', _hdr: '', _lbl:'x' } ]},
  {in:'# X #', out:[ { _txt: '# X #', _hdr: '', _lbl:'X' } ]},
  {in:'# ####', out:[ { _txt: '# ####', _hdr: ''} ]},
  {in:'# x ####', out:[ { _txt: '# x ####', _hdr: '', _lbl:'x' } ]},
  {in:'#######', out:[ { _txt: '#######', _hdr: ''} ]},
  {in:'####### x', out:[ { _txt: '####### x', _hdr: '', _lbl:'# x' } ]},
  {in:' \n#', out:[ { _txt: ' \n', _hdr: '' },{ _txt: '#', _hdr: '' } ]},
  {in:'#\n#', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '#', _hdr: '' } ]},
  {in:'#\n##', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '##', _hdr: '' } ]},
  {in:'#\n## x', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '## x', _hdr: '', _lbl: 'x'} ]},
  {in:'#\n## x\n', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '## x\n', _hdr: '', _lbl: 'x' } ]},
  {in:'#\n## x\nhello', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '## x\nhello', _hdr: '', _lbl: 'x' } ]},
  {in:'#\n## x\nhello\nline2', out:[ { _txt: '#\n', _hdr: '' },{ _txt: '## x\nhello\nline2', _hdr: '', _lbl: 'x' } ]},
  {in:
      '# doc heading\nhello\n' +
      '## sub-heading 1\nworld\n'  +
      '## sub-heading 2\nout there\n',
   out:[
      { _hdr: '', _txt: '# doc heading\nhello\n',        _lbl:'doc heading'   },
      { _hdr: '', _txt: '## sub-heading 1\nworld\n',     _lbl:'sub-heading 1' },
      { _hdr: '', _txt: '## sub-heading 2\nout there\n', _lbl:'sub-heading 2' } ]}
];



newstyle.forEach(function(t) { run('newstyle', t, { fragmentDelim:true }); });
oldstyle.forEach(function(t) { run('oldstyle', t, { fragmentDelim:true, leftDelim:'----', rightDelim:'', headerDelim:'----' } ); });
mdstyle.forEach(function(t)  { run('mdstyle',  t, { fragmentDelim:'md-headings' } ); });

function run(name, t, opts){
  opts = opts || {};
  test(name + ': ' + u.inspect(t.in) + ' → ' + u.inspect(t.out), function(){
    var actual = parseFragments(t.in, opts);
    actual.forEach(function(fragment) { parseHeaders(fragment); });

console.log(actual);
    assert.deepEqual(actual, t.out);
    assert(rebuild(t.out) === t.in, 'source string cannot be rebuilt from fragments');
  });
}

function rebuild(fragments) {
  s = '';
  fragments.forEach(function(fragment) { s += fragment._hdr + fragment._txt; });
  return s;
}

