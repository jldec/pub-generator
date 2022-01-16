/**
 * test-parsefragments
 *
 * TODO: make tests more complete, and easier to interpret
 * Copyright (c) 2015-2022 Jürgen Leschner - github.com/jldec - MIT license
 *
*/
/* eslint indent: "off" */

var test = require('tape');

var parseFragments = require('../parsefragments');
var parseHeaders = require('../parseheaders');

var inspect = require('util').inspect;

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

var windows_newstyle = [
  {in:'---- ----\r\n\r\n--------\r\nabc', out:[ { _txt: '--------\r\nabc', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\n\n--------\nabc', out:[ { _txt: '--------\nabc', _hdr: '---- ----\n\n' } ]},

  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\r\n', out:[ { _txt: 'abc\r\n', _hdr: '' } ]},
  {in:'a\r\nbc', out:[ { _txt: 'a\r\nbc', _hdr: '' } ]},
  {in:'\r\n\r\n\r\n', out:[ { _txt: '\r\n\r\n\r\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:'---\r\n---', out:[ { _txt: '---\r\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\r\n-----', out:[ { _txt: '-----\r\n-----', _hdr: '' } ]},
  {in:'--------\r\n', out:[ { _txt: '', _hdr: '--------\r\n' } ]},
  {in:'---- ----\r\n', out:[ { _txt: '', _hdr: '---- ----\r\n' } ]},
  {in:'---- (draft) ----\r\n', out:[ { _txt: '', _hdr: '---- (draft) ----\r\n', _lbl:'(draft)' } ]},
  {in:'---- ----\r\n\r\n', out:[ { _txt: '', _hdr: '---- ----\r\n\r\n'  } ]},
  {in:'---- ----\r\n nonsense \r\n', out:[ { _txt: '', _hdr: '---- ----\r\n nonsense \r\n' } ]},
  {in:'\r\n---- ----\r\n\r\n', out:[ { _txt: '\r\n', _hdr: '' },{ _txt: '', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'abc\r\n---- ----\r\n\r\n', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: '', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\r\n\r\n\r\n', out:[ { _txt: '\r\n', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\r\n\r\n\r\n\r\n', out:[ { _txt: '\r\n\r\n', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\r\n\r\n\r\nabc', out:[ { _txt: '\r\nabc', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'abc\r\n---- ----\r\n\r\n\r\ndef', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: '\r\ndef', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\r\n---------\r\n', out:[ { _txt: '', _hdr: '---- ----\r\n---------\r\n' } ]},
  {in:'---------\r\n\r\n----\r\nabc', out:[ { _hdr:'---------\r\n\r\n', _txt:'----\r\nabc', _lbl:'-' } ]},
  {in:'---- ----\r\n\r\n--------\r\nabc', out:[ { _txt: '--------\r\nabc', _hdr: '---- ----\r\n\r\n' } ]},
  {in:'---- ----\r\na:\r\n', out:[ { _txt: '', _hdr: '---- ----\r\na:\r\n' } ]},
  {in:'---- ----\r\na: \r\n', out:[ { _txt: '', _hdr: '---- ----\r\na: \r\n' } ]},
  {in:'---- ----\r\na:1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na:1\r\n' } ]},
  {in:'---- ----\r\na: 1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na: 1\r\n' } ]},
  {in:'---- ----\r\na :1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na :1\r\n' } ]},
  {in:'---- ----\r\na : 1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na : 1\r\n' } ]},
  {in:'---- ----\r\n a:1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\n a:1\r\n' } ]},
  {in:'---- ----\r\na:1 \r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na:1 \r\n' } ]},
  {in:'---- ----\r\n a :1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\n a :1\r\n' } ]},
  {in:'---- ----\r\na: 1 \r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na: 1 \r\n' } ]},
  {in:'---- ----\r\n a : 1\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\n a : 1\r\n' } ]},
  {in:'---- ----\r\n a : 1 \r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\n a : 1 \r\n' } ]},
  {in:'\r\n---- ----\r\na:1\r\n', out:[ { _txt: '\r\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '---- ----\r\na:1\r\n' } ]},
  {in:'abc\r\n---- ----\r\na:1\r\n', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '---- ----\r\na:1\r\n' } ]},
  {in:'---- ----\r\na:1\r\n\r\n', out:[ { _txt: '', a:'1', _hdr: '---- ----\r\na:1\r\n\r\n' } ]},
  {in:'---- ----\r\na:1\r\n\r\n\r\n', out:[ { _txt: '\r\n', a:'1', _hdr: '---- ----\r\na:1\r\n\r\n' } ]},
  {in:'---- ----\r\na:1\r\n\r\nabc', out:[ { _txt: 'abc', a:'1', _hdr: '---- ----\r\na:1\r\n\r\n' } ]},
  {in:'abc\r\n---- ----\r\na:1\r\n\r\ndef', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: 'def', a:'1', _hdr: '---- ----\r\na:1\r\n\r\n' } ]},
  {in:'---- ----\r\na:1\r\nb:2\r\nc:3\r\n', out:[ { _txt: '', a:'1', b:'2', c:'3', _hdr: '---- ----\r\na:1\r\nb:2\r\nc:3\r\n' } ]},
  {in:'---- ----\r\na:1\r\nb2\r\nc:3\r\n', out:[ { _txt: '', a:'1', c:'3', _hdr: '---- ----\r\na:1\r\nb2\r\nc:3\r\n' } ]},
  {in:'---- ----\r\na:1\r\n-----\r\nc:3\r\n', out:[ { _txt: '', a:'1', c:'3', _hdr: '---- ----\r\na:1\r\n-----\r\nc:3\r\n' } ]},
  {in:'---- ----\r\na:1\r\nb:2\r\na:4\r\n', out:[ { _txt: '', a:['1','4'], b:'2', _hdr: '---- ----\r\na:1\r\nb:2\r\na:4\r\n' } ]},
  {in:'---- ----\r\npage:_-hello\r\n', out:[ { _txt: '', page:'_-hello', _hdr: '---- ----\r\npage:_-hello\r\n' } ]},
  {in:'---- ----\r\nfragment:#\r\n', out:[ { _txt: '', fragment:'#', _hdr: '---- ----\r\nfragment:#\r\n' } ]},
  {in:'---- ----\r\npage:/foo/bar#\r\n', out:[ { _txt: '', page:'/foo/bar#', _hdr: '---- ----\r\npage:/foo/bar#\r\n' } ]},
  {in:'---- ----\r\npage:/foo/bar/#\r\n', out:[ { _txt: '', page:'/foo/bar/#', _hdr: '---- ----\r\npage:/foo/bar/#\r\n' } ]},
  {in:'---- ----\r\n!:1\r\n', out:[ { _txt: '', '!':'1', _hdr: '---- ----\r\n!:1\r\n' } ]},
  {in:'---- ----\r\n!!:1\r\n', out:[ { _txt: '', '!!':'1', _hdr: '---- ----\r\n!!:1\r\n' } ]},
  {in:'---- ----\r\n(!!):1\r\n', out:[ { _txt: '', '(!!)':'1', _hdr: '---- ----\r\n(!!):1\r\n' } ]},
  {in:
      '---- ----\r\n\r\n' +
      '---- ----\r\n',
   out:[
      { _hdr: '---- ----\r\n\r\n', _txt: '' },
      { _hdr: '---- ----\r\n',   _txt: '' } ]},
  {in:
      '---- ----\r\n\r\nhello\r\n' +
      '---- ----\r\nworl:d\r\n\r\n'  +
      '----boo----\r\n\r\n',
   out:[
      { _hdr: '---- ----\r\n\r\n',         _txt: 'hello\r\n' },
      { _hdr: '---- ----\r\nworl:d\r\n\r\n', _txt: '', worl: 'd' },
      { _hdr: '----boo----\r\n\r\n',       _txt: '', _lbl: 'boo' } ]}
];


var windows_oldstyle = [
  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\r\n', out:[ { _txt: 'abc\r\n', _hdr: '' } ]},
  {in:'a\r\nbc', out:[ { _txt: 'a\r\nbc', _hdr: '' } ]},
  {in:'\r\n\r\n\r\n', out:[ { _txt: '\r\n\r\n\r\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:'---\r\n---', out:[ { _txt: '---\r\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\r\n-----', out:[ { _txt: '-----\r\n-----', _hdr: '' } ]},
  {in:'----\r\n----', out:[ { _txt: '', _hdr: '----\r\n----' } ]},
  {in:'---- \r\n----', out:[ { _txt: '', _hdr: '---- \r\n----' } ]},
  {in:'---- (draft)\r\n----', out:[ { _txt: '', _hdr: '---- (draft)\r\n----', _lbl:'(draft)' } ]},
  {in:'----\r\n\r\n----', out:[ { _txt: '', _hdr: '----\r\n\r\n----'  } ]},
  {in:'----\r\n nonsense \r\n----', out:[ { _txt: '', _hdr: '----\r\n nonsense \r\n----' } ]},
  {in:'\r\n----\r\n\r\n----', out:[ { _txt: '\r\n', _hdr: '' },{ _txt: '', _hdr: '----\r\n\r\n----' } ]},
  {in:'abc\r\n----\r\n\r\n----', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: '', _hdr: '----\r\n\r\n----' } ]},
  {in:'----\r\n\r\n----\r\n', out:[ { _txt: '', _hdr: '----\r\n\r\n----\r\n' } ]},
  {in:'----\r\n\r\n----\r\n\r\n', out:[ { _txt: '\r\n', _hdr: '----\r\n\r\n----\r\n' } ]},
  {in:'----\r\n\r\n----\r\nabc', out:[ { _txt: 'abc', _hdr: '----\r\n\r\n----\r\n' } ]},
  {in:'abc\r\n----\r\n\r\n----\r\ndef', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: 'def', _hdr: '----\r\n\r\n----\r\n' } ]},
  {in:'----\r\n---------\r\n----', out:[ { _txt: '', _hdr: '----\r\n---------\r\n----' } ]},
  {in:'---------\r\n----\r\n----\r\nabc', out:[ { _hdr:'---------\r\n----\r\n', _txt:'----\r\nabc', _lbl:'-----' } ]},
  {in:'----\r\n----\r\n--------\r\nabc', out:[ { _txt: '--------\r\nabc', _hdr: '----\r\n----\r\n' } ]},
  {in:'----\r\na:\r\n----', out:[ { _txt: '', _hdr: '----\r\na:\r\n----' } ]},
  {in:'----\r\na: \r\n----', out:[ { _txt: '', _hdr: '----\r\na: \r\n----' } ]},
  {in:'----\r\na:1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na:1\r\n----' } ]},
  {in:'----\r\na: 1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na: 1\r\n----' } ]},
  {in:'----\r\na :1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na :1\r\n----' } ]},
  {in:'----\r\na : 1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na : 1\r\n----' } ]},
  {in:'----\r\n a:1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\n a:1\r\n----' } ]},
  {in:'----\r\na:1 \r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na:1 \r\n----' } ]},
  {in:'----\r\n a :1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\n a :1\r\n----' } ]},
  {in:'----\r\na: 1 \r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\na: 1 \r\n----' } ]},
  {in:'----\r\n a : 1\r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\n a : 1\r\n----' } ]},
  {in:'----\r\n a : 1 \r\n----', out:[ { _txt: '', a:'1', _hdr: '----\r\n a : 1 \r\n----' } ]},
  {in:'\r\n----\r\na:1\r\n----', out:[ { _txt: '\r\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '----\r\na:1\r\n----' } ]},
  {in:'abc\r\n----\r\na:1\r\n----', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: '', a:'1', _hdr: '----\r\na:1\r\n----' } ]},
  {in:'----\r\na:1\r\n----\r\n', out:[ { _txt: '', a:'1', _hdr: '----\r\na:1\r\n----\r\n' } ]},
  {in:'----\r\na:1\r\n----\r\n\r\n', out:[ { _txt: '\r\n', a:'1', _hdr: '----\r\na:1\r\n----\r\n' } ]},
  {in:'----\r\na:1\r\n----\r\nabc', out:[ { _txt: 'abc', a:'1', _hdr: '----\r\na:1\r\n----\r\n' } ]},
  {in:'abc\r\n----\r\na:1\r\n----\r\ndef', out:[ { _txt: 'abc\r\n', _hdr: '' },{ _txt: 'def', a:'1', _hdr: '----\r\na:1\r\n----\r\n' } ]},
  {in:'----\r\na:1\r\nb:2\r\nc:3\r\n----', out:[ { _txt: '', a:'1', b:'2', c:'3', _hdr: '----\r\na:1\r\nb:2\r\nc:3\r\n----' } ]},
  {in:'----\r\na:1\r\nb2\r\nc:3\r\n----', out:[ { _txt: '', a:'1', c:'3', _hdr: '----\r\na:1\r\nb2\r\nc:3\r\n----' } ]},
  {in:'----\r\na:1\r\n-----\r\nc:3\r\n----', out:[ { _txt: '', a:'1', c:'3', _hdr: '----\r\na:1\r\n-----\r\nc:3\r\n----' } ]},
  {in:'----\r\na:1\r\nb:2\r\na:4\r\n----', out:[ { _txt: '', a:['1','4'], b:'2', _hdr: '----\r\na:1\r\nb:2\r\na:4\r\n----' } ]},
  {in:'----\r\npage:_-hello\r\n----', out:[ { _txt: '', page:'_-hello', _hdr: '----\r\npage:_-hello\r\n----' } ]},
  {in:'----\r\nfragment:#\r\n----', out:[ { _txt: '', fragment:'#', _hdr: '----\r\nfragment:#\r\n----' } ]},
  {in:'----\r\npage:/foo/bar#\r\n----', out:[ { _txt: '', page:'/foo/bar#', _hdr: '----\r\npage:/foo/bar#\r\n----' } ]},
  {in:'----\r\npage:/foo/bar/#\r\n----', out:[ { _txt: '', page:'/foo/bar/#', _hdr: '----\r\npage:/foo/bar/#\r\n----' } ]},
  {in:'----\r\n!:1\r\n----', out:[ { _txt: '', '!':'1', _hdr: '----\r\n!:1\r\n----' } ]},
  {in:'----\r\n!!:1\r\n----', out:[ { _txt: '', '!!':'1', _hdr: '----\r\n!!:1\r\n----' } ]},
  {in:'----\r\n(!!):1\r\n----', out:[ { _txt: '', '(!!)':'1', _hdr: '----\r\n(!!):1\r\n----' } ]},
  {in:
      '----\r\n----\r\n' +
      '----\r\n----',
   out:[
      { _hdr: '----\r\n----\r\n', _txt: '' },
      { _hdr: '----\r\n----',   _txt: '' } ]},
  {in:
      '----\r\n----\r\nhello\r\n' +
      '----\r\nworl:d\r\n----\r\n'  +
      '----boo\r\n----\r\n',
   out:[
      { _hdr: '----\r\n----\r\n',         _txt: 'hello\r\n' },
      { _hdr: '----\r\nworl:d\r\n----\r\n', _txt: '', worl: 'd' },
      { _hdr: '----boo\r\n----\r\n',      _txt: '', _lbl: 'boo' } ]}
];

var windows_mdstyle = [
  {in:'', out:[ { _txt: '', _hdr: '' } ]},
  {in:'abc', out:[ { _txt: 'abc', _hdr: '' } ]},
  {in:'abc\r\n', out:[ { _txt: 'abc\r\n', _hdr: '' } ]},
  {in:'a\r\nbc', out:[ { _txt: 'a\r\nbc', _hdr: '' } ]},
  {in:'\r\n\r\n\r\n', out:[ { _txt: '\r\n\r\n\r\n', _hdr: '' } ]},
  {in:'---', out:[ { _txt: '---', _hdr: '' } ]},
  {in:' #---', out:[ { _txt: ' #---', _hdr: '' } ]},
  {in:'\r\n-#--', out:[ { _txt: '\r\n-#--', _hdr: '' } ]},
  {in:'\r\n #', out:[ { _txt: '\r\n #', _hdr: '' } ]},
  {in:'\r\n #\r\n', out:[ { _txt: '\r\n #\r\n', _hdr: '' } ]},
  {in:'---\r\n---', out:[ { _txt: '---\r\n---', _hdr: '' } ]},
  {in:'-----', out:[ { _txt: '-----', _hdr: '' } ]},
  {in:'------', out:[ { _txt: '------', _hdr: '' } ]},
  {in:'-----\r\n-----', out:[ { _txt: '-----\r\n-----', _hdr: '' } ]},
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
  {in:' \r\n#', out:[ { _txt: ' \r\n', _hdr: '' },{ _txt: '#', _hdr: '' } ]},
  {in:'#\r\n#', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '#', _hdr: '' } ]},
  {in:'#\r\n##', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '##', _hdr: '' } ]},
  {in:'#\r\n## x', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '## x', _hdr: '', _lbl: 'x'} ]},
  {in:'#\r\n## x\r\n', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '## x\r\n', _hdr: '', _lbl: 'x' } ]},
  {in:'#\r\n## x\r\nhello', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '## x\r\nhello', _hdr: '', _lbl: 'x' } ]},
  {in:'#\r\n## x\r\nhello\r\nline2', out:[ { _txt: '#\r\n', _hdr: '' },{ _txt: '## x\r\nhello\r\nline2', _hdr: '', _lbl: 'x' } ]},
  {in:
      '# doc heading\r\nhello\r\n' +
      '## sub-heading 1\r\nworld\r\n'  +
      '## sub-heading 2\r\nout there\r\n',
   out:[
      { _hdr: '', _txt: '# doc heading\r\nhello\r\n',        _lbl:'doc heading'   },
      { _hdr: '', _txt: '## sub-heading 1\r\nworld\r\n',     _lbl:'sub-heading 1' },
      { _hdr: '', _txt: '## sub-heading 2\r\nout there\r\n', _lbl:'sub-heading 2' } ]}
];

newstyle.forEach(function(t) { run('newstyle', t, { fragmentDelim:true }); });
oldstyle.forEach(function(t) { run('oldstyle', t, { fragmentDelim:true, leftDelim:'----', rightDelim:'', headerDelim:'----' } ); });
mdstyle.forEach(function(t)  { run('mdstyle',  t, { fragmentDelim:'md-headings' } ); });

windows_newstyle.forEach(function(t) { run('windows_newstyle', t, { fragmentDelim:true }); });
windows_oldstyle.forEach(function(t) { run('windows_oldstyle', t, { fragmentDelim:true, leftDelim:'----', rightDelim:'', headerDelim:'----' }); });
windows_mdstyle.forEach(function(t) { run('windows_mdstyle', t, { fragmentDelim:'md-headings' }); });

function run(name, tst, opts){
  opts = opts || {};
  test(name + ': ' + inspect(tst.in) /* + ' → ' + inspect(tst.out) */, function(t){
    var actual = parseFragments(tst.in, opts);
    actual.forEach(function(fragment) { parseHeaders(fragment); });
    // console.log(actual);
    t.deepLooseEqual(actual, tst.out, 'match expected');
    t.equal(rebuild(tst.out), tst.in, 'rebuild from fragments');
    t.end();
  });
}

function rebuild(fragments) {
  var s = '';
  fragments.forEach(function(fragment) { s += fragment._hdr + fragment._txt; });
  return s;
}
