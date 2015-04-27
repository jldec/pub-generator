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
var actual, expected;

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

newstyle.forEach(function(t) { run('newstyle', t, { fragmentDelim:true }); });
oldstyle.forEach(function(t) { run('oldstyle', t, { fragmentDelim:true, leftDelim:'----', rightDelim:'', headerDelim:'----' } ); });

function run(name, t, opts){
  opts = opts || {};
  test(name + ': ' + u.inspect(t.in) + ' → ' + u.inspect(t.out), function(){
    actual = parseFragments(t.in, opts);
    actual.forEach(function(fragment) { parseHeaders(fragment); });
    expected = t.out;
    assert.deepEqual(actual, expected);
    assert(rebuild(t.out) === t.in, 'source string cannot be rebuilt from fragments');
  });
}

function rebuild(fragments) {
  s = '';
  fragments.forEach(function(fragment) { s += fragment._hdr + fragment._txt; });
  return s;
}

