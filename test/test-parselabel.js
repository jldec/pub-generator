/**
 * test parselabel
 * Copyright (c) 2015-2022 Jürgen Leschner - github.com/jldec - MIT license
 *
**/

var test = require('tape');

var parseLabel = require('../parselabel');

test('parseLabel', function(t) {
  t.deepEqual(parseLabel(), {});
  t.deepEqual(parseLabel('',true), {});
  t.deepEqual(parseLabel('  ',true), {});
  t.deepEqual(parseLabel('.',true), {_name:'.'});
  t.deepEqual(parseLabel('(',true), {_name:'-', name:'('});
  t.deepEqual(parseLabel('()',true), {_name:'-', name:'()'});
  t.deepEqual(parseLabel('("")',true), {_name:'-', name:'("")'});
  t.deepEqual(parseLabel('#',true), {_name:'-', name:'#'});
  t.deepEqual(parseLabel('#(',true), {_name:'-', name:'#('});
  t.deepEqual(parseLabel('#',false), {_fragname:'#'});
  t.deepEqual(parseLabel('#(',false), {_fragname:'#'});
  t.deepEqual(parseLabel('a',true), {_name:'a'});
  t.deepEqual(parseLabel('.a',true), {_name:'.a'}); // note - dot-names are ok
  t.deepEqual(parseLabel('.A',true), {_name:'.a', name:'.A'});
  t.deepEqual(parseLabel('.A',true, {mixedCase:1}), {_name:'.A'});
  t.deepEqual(parseLabel('/',true), {_path:'/'});
  t.deepEqual(parseLabel('/a',true), {_path:'/', _name:'a'});
  t.deepEqual(parseLabel('(home)/',true), {_path:'home/'});
  t.deepEqual(parseLabel('/ (home)/',true), {_path:'/home/'});
  t.deepEqual(parseLabel('/(Go)(Home)/',true), {_path:'/go-home/'});
  t.deepEqual(parseLabel('/(Go)(Home)/',true, {mixedCase:1}), {_path:'/Go-Home/'});
  t.deepEqual(parseLabel('(home)/',false), {func:'home'});
  t.deepEqual(parseLabel('/ (home)/',false), {_path:'/', func:'home' });
  t.deepEqual(parseLabel('/(Go)(Home)/',false), {func:'Go', _path:'/'});
  t.deepEqual(parseLabel('/(Go)(Home)/',false, {mixedCase:1}), {func:'Go', _path:'/'});
  t.deepEqual(parseLabel('/a/',true), {_path:'/a/'});
  t.deepEqual(parseLabel('/1 a/2 b/',true), {_path:'/a/b/'});
  t.deepEqual(parseLabel('/1 a/2 b/3 c',true), {_path:'/a/b/', _name:'c'});
  t.deepEqual(parseLabel('/1 a/2 b/3 C',true), {_path:'/a/b/', _name:'c', name:'C'});
  t.deepEqual(parseLabel('/1 a/2 b/3 C',true, {mixedCase:1}), {_path:'/a/b/', _name:'C'});
  t.deepEqual(parseLabel('/a.b',true), {_path:'/', _name:'a', _ext:'.b'});
  t.deepEqual(parseLabel('/a/.b',true), {_path:'/a/', _name:'.b'});
  t.deepEqual(parseLabel('/a_/.b_',true), {_path:'/a/', _name:'.b', name:'.b_'});
  t.deepEqual(parseLabel('/a_/.b_',true, {allow:'_'}), {_path:'/a_/', _name:'.b_'});
  t.deepEqual(parseLabel('/a#b',false), {_path:'/', _name:'a', _fragname:'#b'});
  t.deepEqual(parseLabel('/a.b#c',false), {_path:'/', _name:'a', _ext:'.b', _fragname:'#c'});
  t.deepEqual(parseLabel('/a.B#c',false, {mixedCase:1}), {_path:'/', _name:'a', _ext:'.B', _fragname:'#c'});
  t.deepEqual(parseLabel('/a d.b#c',false), {_path:'/', _name:'a-d', name:'a d', _ext:'.b', _fragname:'#c'});
  t.deepEqual(parseLabel('/a d.b#c d',false), {_path:'/', _name:'a-d', name:'a d', _ext:'.b', _fragname:'#c-d'});
  t.deepEqual(parseLabel('/a d.b d#c d',false), { _path:'/', _name:'a-d', name:'a d', _fragname:'#c-d', _ext:'.b d'});
  t.deepEqual(parseLabel('/a#b',true), {_path:'/', _name:'a-b', name:'a#b'});
  t.deepEqual(parseLabel('/a.b#c',true), {_path:'/', _name:'a', _ext:'.b#c'});
  t.deepEqual(parseLabel('/a.B#c',true, {mixedCase:1}), {_path:'/', _name:'a', _ext:'.B#c'});
  t.deepEqual(parseLabel('/a d.b#c',true), {_path:'/', _name:'a-d', name:'a d', _ext:'.b#c'});
  t.deepEqual(parseLabel('/a d.b#c d',true), {_path:'/', _name:'a-d', name:'a d', _ext:'.b#c d'});
  t.deepEqual(parseLabel('/a d.b d#c d',true), { _path:'/', _name:'a-d', name:'a d', _ext:'.b d#c d'});
  t.deepEqual(parseLabel('("x")',true), {_name:'x', name:'("x")'});
  t.deepEqual(parseLabel('(draft "x")',true), {_name:'draft-x', name:'(draft "x")'});
  t.deepEqual(parseLabel('(draft a b c "x")',true), {_name:'draft-a-b-c-x', name:'(draft a b c "x")'});
  t.deepEqual(parseLabel('(update /a/b/c)',true), {_path:'update/a/b/', _name:'c', name:'c)'});
  t.deepEqual(parseLabel('/a/b/c (update /a/b/c)',true), {_path:'/a/b/c-update/a/b/', _name:'c', name:'c)'});
  t.deepEqual(parseLabel('/a/b/c#d (update /a/b/c#d)',true), {_path:'/a/b/c-d-update/a/b/', _name:'c-d', name:'c#d)'});
  t.deepEqual(parseLabel('("x")',false), {});
  t.deepEqual(parseLabel('(draft "x")',false), {func:'draft'});
  t.deepEqual(parseLabel('(draft a b c "x")',false), {func:'draft', ref:'a'});
  t.deepEqual(parseLabel('(update /a/b/c)',false), {func:'update', ref:'/a/b/c'});
  t.deepEqual(parseLabel('/a/b/c (update /a/b/c)',false), {_path:'/a/b/', _name:'c', func:'update', ref:'/a/b/c'});
  t.deepEqual(parseLabel('/a/b/c#d (update /a/b/c#d)',false), {_path:'/a/b/', _name:'c', _fragname:'#d', func:'update', ref:'/a/b/c#d'});
  t.deepEqual(parseLabel('index.md',true), {_name:'index', _ext:'.md'});
  t.deepEqual(parseLabel('/index.md',true), {_path:'/', name:'/', _ext:'.md'});
  t.deepEqual(parseLabel('/a/b/c/index.md',true), {_path:'/a/b/c/', name:'c', _ext:'.md'});
  t.deepEqual(parseLabel('robots.txt.hbs',true), {_name:'robots.txt', _ext:'.hbs'});
  t.deepEqual(parseLabel('/a.b/robots.txt.hbs',true), {_path:'/a.b/', _name:'robots.txt', _ext:'.hbs'});
  t.deepEqual(parseLabel('/Nice dir/index.md',true), {_path:'/nice-dir/', name:'Nice dir', _ext:'.md'});
  t.end();
});
