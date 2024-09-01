/**
 * pub-generator test-helpers
 * TODO: more
 * Copyright (c) 2015-2024 Jürgen Leschner - github.com/jldec - MIT license
 *
**/
var test = require('tape');

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
