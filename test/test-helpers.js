/**
 * pub-generator test-helpers
 * TODO: more
 * copyright 2015-2019, Jurgen Leschner - github.com/jldec - MIT license
 *
**/
var test = require('tape')

var u = require('pub-util');

var tests = [
  {
    name: 'dummy',
  }
];

tests.reverse().forEach(function run(tst) {
  test(tst.name, function(t) {
    t.assert(true);
    t.end();
  });
});
