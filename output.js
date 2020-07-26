/**
 * output.js
 * pub-generator mixin for file output
 *
 * copyright 2015-2020, Jürgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator:output');
var u = require('pub-util');
var path = require('path');
var ppath = path.posix || path; // in browser path is posix

var asyncbuilder = require('asyncbuilder');

module.exports = function output(generator) {

  var opts = generator.opts;
  var log = generator.log;

  // add throttled output() function to each output
  u.each(opts.outputs, function(output) {
    var fn = function(cb) { outputOutput(output, cb); };
    output.output = u.throttleMs(fn, output.throttle || '10s');
  });

  generator.outputPages = outputPages;

  return;

  //--//--//--//--//--//--//--//--//--//

  // trigger specified (or all) outputs
  function outputPages(names, cb) {
    if (typeof names === 'function') { cb = names; names = ''; }

    names = u.isArray(names) ? names :
           names ? [names] :
           u.keys(opts.output$);

    var ab = asyncbuilder(cb);

    u.each(names, function(name) {
      var output = opts.output$[name];
      if (output) {
        output.output(ab.asyncAppend());
      } else {
        ab.append('outputPages called with unknown output: ' + name);
      }
    });

    ab.complete();
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

    if (!output) return cb(new Error('no output specified'));

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
      if (output.match && !output.match(page)) return;
      var file = { page: page, path: page._href };
      if (page['http-header']) { file['http-header'] = page['http-header']; }
      files.push(file);
    });

    // for now all dynamic routes are extensionless, JSON
    // route objects look like { route:string, fn:string }
    // fn is assumed to be a function/method of generator
    u.each(output.dynamicRoutes, function(route) {
      files.push( { route:route, path:route.route + '.json' } );
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
      if (output.fqImages) { renderOpts.fqImages = output.fqImages; }
      try {
        file.text =
        file.page ? generator.renderDoc(file.page, renderOpts) :
        file.route ? JSON.stringify(generator[file.route.fn].call(generator)) : '';
      }
      catch(err) {
        log(err);
        file.text = err;
      }
      delete file.page;
      delete file.route;
    });

    output.src.put(files, cb);
  }

  // convert file-paths to 'index' files where necessary
  function fixOutputPaths(output, files) {

    // map directories to use for index files
    var dirMap = {};
    u.each(files, function(file) {
      dirMap[ppath.dirname(file.path)] = true;

      // edge case - treat /foo/ as directory too
      if (/\/$/.test(file.path) && ppath.dirname(file.path) !== file.path) {
        dirMap[file.path] = true;
      }
    });

    // default output file extension is .html
    var extension = 'extension' in output ? (output.extension || '') : '.html';
    var indexFile = output.indexFile || 'index';

    u.each(files, function(file) {
      if (dirMap[file.path]) {
        debug('index file for %s', file.path);
        file.path = ppath.join(file.path, indexFile);
      }
      if (!/\.[^/]*$/.test(file.path)) {
        file.path = file.path + extension;
      }
    });
  }

};
