/**
 * test parselabel
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

suite('test parselabel');

var parseLabel = require('../parselabel');
var should = require('should');

test('parseLabel', function() {
  parseLabel().should.match({});
  parseLabel('').should.match({});
  parseLabel('  ').should.match({});
  parseLabel('.').should.match({});
  parseLabel('(').should.match({});
  parseLabel('()').should.match({});
  parseLabel('("")').should.match({});
  parseLabel('#').should.match({_fragname:'#'});
  parseLabel('#(').should.match({_fragname:'#-', fragname:'#('});
  parseLabel('a').should.match({_name:'a'});
  parseLabel('.a').should.match({_ext:'.a'}); // note - no dot-names
  parseLabel('.A').should.match({_ext:'.a'});
  parseLabel('/').should.match({_path:'/'});
  parseLabel('/a').should.match({_path:'/', _name:'a'});
  parseLabel('(home)/').should.match({});
  parseLabel('/ (home)/').should.match({_path:'/home/'});
  parseLabel('/(Go)(Home)/').should.match({_path:'/go-home/'});
  parseLabel('/(Go)(Home)/',{mixedCase:true}).should.match({_path:'/Go-Home/'});
  parseLabel('/a/').should.match({_path:'/a/'});
  parseLabel('/1 a/2 b/').should.match({_path:'/a/b/'});
  parseLabel('/1 a/2 b/3 c').should.match({_path:'/a/b/', _name:'c'});
  parseLabel('/1 a/2 b/3 C').should.match({_path:'/a/b/', _name:'c', name:'C'});
  parseLabel('/1 a/2 b/3 C', {mixedCase:true}).should.match({_path:'/a/b/', _name:'C'});
  parseLabel('/a.b').should.match({_path:'/', _name:'a', _ext:'.b'});
  parseLabel('/a/.b').should.match({_path:'/a/', _ext:'.b'});
  parseLabel('/a_/.b_').should.match({_path:'/a/', _ext:'.b'});
  parseLabel('/a_/.b_', {allow:'_'}).should.match({_path:'/a_/', _ext:'.b_'});
  parseLabel('/a#b').should.match({_path:'/', _name:'a', _fragname:'#b'});
  parseLabel('/a#c.b').should.match({_path:'/', _name:'a', _ext:'.b', _fragname:'#c'});
  parseLabel('/a#c.B',{mixedCase:1}).should.match({_path:'/', _name:'a', _ext:'.B', _fragname:'#c'});
  parseLabel('/a d#c.b').should.match({_path:'/', _name:'a-d', name: 'a d', _ext:'.b', _fragname:'#c'});
  parseLabel('/a d#c d.b').should.match({_path:'/', _name:'a-d', name: 'a d', _ext:'.b', _fragname:'#c-d', fragname:'#c d'});
  parseLabel('/a d#c d.b d').should.match({ _path: '/', _name: 'a-d', name: 'a d', _fragname: '#c-d', _ext: '.b-d', fragname: '#c d' });
  parseLabel('("x")').should.match({cmnt:'x'});
  parseLabel('(draft "x")').should.match({func:'draft', cmnt:'x'});
  parseLabel('(draft a b c "x")').should.match({func:'draft', ref:'a', user:'b', date:'c', cmnt:'x'});
  parseLabel('(update /a/b/c)').should.match({func:'update', ref:'/a/b/c'});
  parseLabel('/a/b/c (update /a/b/c)').should.match({_path:'/a/b/', _name:'c', func:'update', ref:'/a/b/c'});
  parseLabel('/a/b/c#d (update /a/b/c#d)').should.match({_path:'/a/b/', _name:'c', _fragname:'#d', func:'update', ref:'/a/b/c#d'});
});




















