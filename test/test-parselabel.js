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
  assert.deepEqual(parseLabel('',true), {});
  assert.deepEqual(parseLabel('  ',true), {});
  assert.deepEqual(parseLabel('.',true), {_name:'.'});
  assert.deepEqual(parseLabel('(',true), {_name:'-', name:'('});
  assert.deepEqual(parseLabel('()',true), {_name:'-', name:'()'});
  assert.deepEqual(parseLabel('("")',true), {_name:'-', name:'("")'});
  assert.deepEqual(parseLabel('#',true), {_name:'-', name:'#'});
  assert.deepEqual(parseLabel('#(',true), {_name:'-', name:'#('});
  assert.deepEqual(parseLabel('#',false), {_fragname:'#'});
  assert.deepEqual(parseLabel('#(',false), {_fragname:'#'});
  assert.deepEqual(parseLabel('a',true), {_name:'a'});
  assert.deepEqual(parseLabel('.a',true), {_name:'.a'}); // note - dot-names are ok
  assert.deepEqual(parseLabel('.A',true), {_name:'.a', name:'.A'});
  assert.deepEqual(parseLabel('.A',true, {mixedCase:1}), {_name:'.A'});
  assert.deepEqual(parseLabel('/',true), {_path:'/'});
  assert.deepEqual(parseLabel('/a',true), {_path:'/', _name:'a'});
  assert.deepEqual(parseLabel('(home)/',true), {_path:'home/'});
  assert.deepEqual(parseLabel('/ (home)/',true), {_path:'/home/'});
  assert.deepEqual(parseLabel('/(Go)(Home)/',true), {_path:'/go-home/'});
  assert.deepEqual(parseLabel('/(Go)(Home)/',true, {mixedCase:1}), {_path:'/Go-Home/'});
  assert.deepEqual(parseLabel('(home)/',false), {func:'home'});
  assert.deepEqual(parseLabel('/ (home)/',false), {_path:'/', func:'home' });
  assert.deepEqual(parseLabel('/(Go)(Home)/',false), {func:'Go', _path:'/'});
  assert.deepEqual(parseLabel('/(Go)(Home)/',false, {mixedCase:1}), {func:'Go', _path:'/'});
  assert.deepEqual(parseLabel('/a/',true), {_path:'/a/'});
  assert.deepEqual(parseLabel('/1 a/2 b/',true), {_path:'/a/b/'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 c',true), {_path:'/a/b/', _name:'c'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 C',true), {_path:'/a/b/', _name:'c', name:'C'});
  assert.deepEqual(parseLabel('/1 a/2 b/3 C',true, {mixedCase:1}), {_path:'/a/b/', _name:'C'});
  assert.deepEqual(parseLabel('/a.b',true), {_path:'/', _name:'a', _ext:'.b'});
  assert.deepEqual(parseLabel('/a/.b',true), {_path:'/a/', _name:'.b'});
  assert.deepEqual(parseLabel('/a_/.b_',true), {_path:'/a/', _name:'.b', name:'.b_'});
  assert.deepEqual(parseLabel('/a_/.b_',true, {allow:'_'}), {_path:'/a_/', _name:'.b_'});
  assert.deepEqual(parseLabel('/a#b',false), {_path:'/', _name:'a', _fragname:'#b'});
  assert.deepEqual(parseLabel('/a.b#c',false), {_path:'/', _name:'a', _ext:'.b', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a.B#c',false, {mixedCase:1}), {_path:'/', _name:'a', _ext:'.B', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a d.b#c',false), {_path:'/', _name:'a-d', name:'a d', _ext:'.b', _fragname:'#c'});
  assert.deepEqual(parseLabel('/a d.b#c d',false), {_path:'/', _name:'a-d', name:'a d', _ext:'.b', _fragname:'#c-d'});
  assert.deepEqual(parseLabel('/a d.b d#c d',false), { _path:'/', _name:'a-d', name:'a d', _fragname:'#c-d', _ext:'.b d'});
  assert.deepEqual(parseLabel('/a#b',true), {_path:'/', _name:'a-b', name:'a#b'});
  assert.deepEqual(parseLabel('/a.b#c',true), {_path:'/', _name:'a', _ext:'.b#c'});
  assert.deepEqual(parseLabel('/a.B#c',true, {mixedCase:1}), {_path:'/', _name:'a', _ext:'.B#c'});
  assert.deepEqual(parseLabel('/a d.b#c',true), {_path:'/', _name:'a-d', name:'a d', _ext:'.b#c'});
  assert.deepEqual(parseLabel('/a d.b#c d',true), {_path:'/', _name:'a-d', name:'a d', _ext:'.b#c d'});
  assert.deepEqual(parseLabel('/a d.b d#c d',true), { _path:'/', _name:'a-d', name:'a d', _ext:'.b d#c d'});
  assert.deepEqual(parseLabel('("x")',true), {_name:'x', name:'("x")'});
  assert.deepEqual(parseLabel('(draft "x")',true), {_name:'draft-x', name:'(draft "x")'});
  assert.deepEqual(parseLabel('(draft a b c "x")',true), {_name:'draft-a-b-c-x', name:'(draft a b c "x")'});
  assert.deepEqual(parseLabel('(update /a/b/c)',true), {_path:'update/a/b/', _name:'c', name:'c)'});
  assert.deepEqual(parseLabel('/a/b/c (update /a/b/c)',true), {_path:'/a/b/c-update/a/b/', _name:'c', name:'c)'});
  assert.deepEqual(parseLabel('/a/b/c#d (update /a/b/c#d)',true), {_path:'/a/b/c-d-update/a/b/', _name:'c-d', name:'c#d)'});
  assert.deepEqual(parseLabel('("x")',false), {});
  assert.deepEqual(parseLabel('(draft "x")',false), {func:'draft'});
  assert.deepEqual(parseLabel('(draft a b c "x")',false), {func:'draft', ref:'a'});
  assert.deepEqual(parseLabel('(update /a/b/c)',false), {func:'update', ref:'/a/b/c'});
  assert.deepEqual(parseLabel('/a/b/c (update /a/b/c)',false), {_path:'/a/b/', _name:'c', func:'update', ref:'/a/b/c'});
  assert.deepEqual(parseLabel('/a/b/c#d (update /a/b/c#d)',false), {_path:'/a/b/', _name:'c', _fragname:'#d', func:'update', ref:'/a/b/c#d'});
  assert.deepEqual(parseLabel('index.md',true), {_name:'index', _ext:'.md'});
  assert.deepEqual(parseLabel('/index.md',true), {_path:'/', name:'/', _ext:'.md'});
  assert.deepEqual(parseLabel('/a/b/c/index.md',true), {_path:'/a/b/c/', name:'c', _ext:'.md'});
  assert.deepEqual(parseLabel('robots.txt.hbs',true), {_name:'robots.txt', _ext:'.hbs'});
  assert.deepEqual(parseLabel('/a.b/robots.txt.hbs',true), {_path:'/a.b/', _name:'robots.txt', _ext:'.hbs'});
  assert.deepEqual(parseLabel('/Nice dir/index.md',true), {_path:'/nice-dir/', name:'Nice dir', _ext:'.md'});
});




















