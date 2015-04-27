/**
 * pub-generator test-config1.js
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

suite('pub-generator test config1');

var u = require('pub-util');
var should = require('should');

var opts = require('./config1');
opts.sources = u.pathOpt(opts.sources, __dirname);

var generator = require('..')(opts);

generator.handlebars.registerHelper('test', function() { return opts.test; });

before(generator.load);

test('config1.json', function() {
  generator.pages.length.should.be.exactly(1);
  u.size(generator.template$).should.be.exactly(2);
  generator.home.should.be.an.instanceOf(generator.Fragment);
  generator.home._href.should.be.exactly('/');
  generator.renderDoc(generator.home).should.be.exactly(
'<html>\n<head><title>test-config1</title></head>\n<body>\n<h1 id=\"hello-world\">hello world</h1>\n\n</body>\n' );
});


var opts2 = require('./config1-');
opts2.sources = u.pathOpt(opts2.sources, __dirname);

var generator2 = require('..')(opts2);

generator2.handlebars.registerHelper('test', function() { return opts2.test; });

before(generator2.load);

test('config1-.js', function() {
  generator2.pages.length.should.be.exactly(1);
  u.size(generator2.template$).should.be.exactly(2);
  generator2.home.should.be.an.instanceOf(generator2.Fragment);
  generator2.home._href.should.be.exactly('/');
  generator2.renderDoc(generator2.home).should.be.exactly(
'<html>\n<head><title>test-config1</title></head>\n<body>\n<h1 id=\"hello-world\">hello world</h1>\n\n</body>\n' );
});
