/**
 * test parselabel
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test parselabel');

var parseLabel = require('../parselabel');
var assert = require('assert');

test('parseLabel', function() {
  assert.deepEqual(parseLabel(), {});
  assert.deepEqual(parseLabel(''), {});
  assert.deepEqual(parseLabel('  '), {});
  assert.deepEqual(parseLabel('.'), {});
  assert.deepEqual(parseLabel('('), {});
  assert.deepEqual(parseLabel('()'), {});
  assert.deepEqual(parseLabel('("")'), {});
  assert.deepEqual(parseLabel('#'), {_fragname:'#'});
  assert.deepEqual(parseLabel('#('), {_fragname:'#-', fragname:'#('});
  assert.deepEqual(parseLabel('a'), {_name:'a'});
  assert.deepEqual(parseLabel('.a'), {_ext:'.a'}); // note - no dot-names
  assert.deepEqual(parseLabel('.A'), {_ext:'.a'});
  assert.deepEqual(parseLabel('/'), {_path:'/'});
  assert.deepEqual(parseLabel('/a'), {_path:'/', _name:'a'});
  assert.deepEqual(parseLabel('(home)/'), {});
  assert.deepEqual(parseLabel('/ (home)/'), {_path:'/home/'});
  assert.deepEqual(parseLabel('/(Go)(Home)/'), {_path:'/go-home/'});
  assert.deepEqual(parseLabel('/(Go)(Home)/',{mixedCase:true}), {_path:'/Go-Home/'});
  assert.deepEqual(parseLabel('/a/'), {_path:'/a/'});
  assert.deepEqual(parseLabel('/1 a/2 b/'), {_path:'/a/b/'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 c'), {_path:'/a/b/', _name:'c'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 C'), {_path:'/a/b/', _name:'c', name:'C'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 C', {mixedCase:true}), {_path:'/a/b/', _name:'C'});
  assert.deepEqual(parseLabel('/a.b'), {_path:'/', _name:'a', _ext:'.b'});
  assert.deepEqual(parseLabel('/a/.b'), {_path:'/a/', _ext:'.b'});
  assert.deepEqual(parseLabel('/a_/.b_'), {_path:'/a/', _ext:'.b'});
  assert.deepEqual(parseLabel('/a_/.b_', {allow:'_'}), {_path:'/a_/', _ext:'.b_'});
  assert.deepEqual(parseLabel('/a#b'), {_path:'/', _name:'a', _fragname:'#b'});
  assert.deepEqual(parseLabel('/a#c.b'), {_path:'/', _name:'a', _ext:'.b', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a#c.B',{mixedCase:1}), {_path:'/', _name:'a', _ext:'.B', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a d#c.b'), {_path:'/', _name:'a-d', name: 'a d', _ext:'.b', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a d#c d.b'), {_path:'/', _name:'a-d', name: 'a d', _ext:'.b', _fragname:'#c-d', fragname:'#c d'});
  assert.deepEqual(parseLabel('/a d#c d.b d'), { _path: '/', _name: 'a-d', name: 'a d', _fragname: '#c-d', _ext: '.b-d', fragname: '#c d' });
  assert.deepEqual(parseLabel('("x")'), {cmnt:'x'});
  assert.deepEqual(parseLabel('(draft "x")'), {func:'draft', cmnt:'x'});
  assert.deepEqual(parseLabel('(draft a b c "x")'), {func:'draft', ref:'a', user:'b', date:'c', cmnt:'x'});
  assert.deepEqual(parseLabel('(update /a/b/c)'), {func:'update', ref:'/a/b/c'});
  assert.deepEqual(parseLabel('/a/b/c (update /a/b/c)'), {_path:'/a/b/', _name:'c', func:'update', ref:'/a/b/c'});
  assert.deepEqual(parseLabel('/a/b/c#d (update /a/b/c#d)'), {_path:'/a/b/', _name:'c', _fragname:'#d', func:'update', ref:'/a/b/c#d'});
  assert.deepEqual(parseLabel('index.md'), {_name:'index', _ext:'.md'});
  assert.deepEqual(parseLabel('/index.md'), {_path:'/', name:'/', _ext:'.md'});
  assert.deepEqual(parseLabel('/a/b/c/index.md'), {_path:'/a/b/c/', name:'c', _ext:'.md'});
  assert.deepEqual(parseLabel('/Nice dir/index.md'), {_path:'/nice-dir/', name:'Nice dir', _ext:'.md'});
});




















