/**
 * output.js
 * pub-generator mixin for file output
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator:output');
var u = require('pub-util');
var path = require('path');

module.exports = function output(generator) {

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
  // unthrottled single output output.
  // converts pages which are also directories into dir/index.html files
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

    var omit = output.omitRoutes;
    if (omit && !u.isArray(omit)) { omit = [omit]; }

    // TODO: re-use similar filter in server/serve-statics and server/serve-scripts
    var filterRe = new RegExp( '^(/admin/|/server/' +
                (opts.editor ? '' : '|/pub/') +
                       (omit ? '|' + u.map(omit, u.escapeRegExp).join('|') : '') +
                               ')');

    // pass1: collect files to generate (not /server or /admin or /pub)
    u.each(generator.pages, function(page) {
      if (filterRe.test(page._href)) return;
      var file = { page: page, path: page._href }
      if (page['http-header']) { file['http-header'] = page['http-header']; }
      files.push(file);
    });

    // pass2:
    fixOutputPaths(output, files);

    // pass3: generate using (possibly modified) file paths for relPaths
    // E.g. /adobe may live in the file /adobe/index.html so the relPath is '..'
    u.each(files, function(file) {
      var renderOpts =
        output.relPaths   ? { relPath:u.relPath(file.path) } :
        output.staticRoot ? { relPath:output.staticRoot } :
        opts.relPaths     ? { relPath:u.relPath(file.path) } :
        opts.staticRoot   ? { relPath:opts.staticRoot } :
        {};
      if (output.fqImages) { renderOpts.fqImages = output.fqImages };
      file.text = generator.renderDoc(file.page, renderOpts);
      delete file.page;
    });

    output.src.put(files, function(err, result) {
      if (err) return cb(log(err));
      // TODO - improve log output with relative output.path
      log('output %s %s generated files', output.path, result.length)
      cb();
    });
  }

  // convert file-paths to 'index' files where necessary
  function fixOutputPaths(output, files) {

    // map directories to use for index files
    var dirMap = {};
    u.each(files, function(file) {
      dirMap[path.dirname(file.path)] = true;

      // edge case - treat /foo/ as directory too
      if (/\/$/.test(file.path) && path.dirname(file.path) !== file.path) {
        dirMap[file.path] = true;
      }
    });

    // default output file extension is .html
    var extension = 'extension' in output ? (output.extension || '') : '.html';
    var indexFile = output.indexFile || 'index'

    u.each(files, function(file) {
      if (dirMap[file.path]) {
        debug('index file for %s', file.path);
        file.path = path.join(file.path, indexFile);
      }
      if (!/\.[^\/]*$/.test(file.path)) {
        file.path = file.path + extension;
      }
    });
  }

}
