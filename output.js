/**
 * output.js
 * pub-generator mixin for file output
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator:output');
var u = require('pub-util');
var path = require('path');

module.exports = function update(generator) {

  var opts = generator.opts;
  var log = opts.log;

  // add throttled output() function to each output
  u.each(opts.outputs, function(output) {
    var fn = function() { outputOutput(output); }
    output.output = u.throttleMs(fn, output.throttle || '10s');
  });

  generator.outputPages = outputPages;

  return;

  //--//--//--//--//--//--//--//--//--//

  // trigger specified (or all) outputs
  function outputPages(names) {
    names = u.isArray(names) ? names :
           names ? [names] :
           u.keys(opts.output$);

    var results = [];

    u.each(names, function(name) {
     var output = opts.output$[name];
     if (output) {
       output.output();
       results.push(name);
     } else {
       results.push(log('outputPages unknown output ' + name));
     }
    });

    return results;
  }


  // outputOutput()
  // unthrottled single output output with path-rewriting for index files.
  //
  // TODO
  // - smarter diffing, incremental output
  // - omit dynamic pages
  // - render headers or other page metadata e.g. for publishing to s3

  function outputOutput(output, cb) {
    cb = u.maybe(cb);

    if (!output) return cb(log('no output specified'));

    debug('output %s', output.name);
    var files = output.files = [];

    // generate only static pages (not /server or /admin or /pub)
    u.each(generator.pages, function(page) {
      if (/^\/(admin|pub|server)(\/|$)/.test(page._href)) return;
      var file = { path: page._href, text: generator.renderDoc(page) }
      if (page['http-header']) { file['http-header'] = page['http-header']; }
      files.push(file);
    });

    fixOutputPaths(output, files);

    output.src.put(files, function(err, result) {
      if (err) return cb(log(err));
      log('output %s (%s pages)', output.name, result.length || result);
      cb();
    });
  }

  // convert file-paths to 'index' files where necessary
  function fixOutputPaths(output, files) {

    var dirIndex = {};
    u.each(files, function(file) {
      dirIndex[path.dirname(file.path)] = true;
    });

    u.each(files, function(file) {
      if (dirIndex[file.path]) {
        debug('index file for %s', file.path);
        file.path = path.join(file.path, 'index');
      }
      if (output.ext && !path.extname(file.path)) {
        file.path = file.path + output.ext;
      }
    });
  }

}






























