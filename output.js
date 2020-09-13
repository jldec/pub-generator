/**
 * output.js
 * pub-generator mixin for file output
 *
 * copyright 2015-2020, Jürgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator:output');
var u = require('pub-util');
var npath = require('path');
var ppath = npath.posix || npath; // in browser path is posix

module.exports = function output(generator) {

  var opts = generator.opts;
  var log = opts.log;

  generator.outputPages = outputPages;

  return;

  //--//--//--//--//--//--//--//--//--//

  // outputPages()
  // converts pages which are also directories into dir/index.html files
  // returns array of { page:<href>, file:<output-path> }
  //
  // TODO
  // - smarter diffing, incremental output
  // - omit dynamic pages
  // - return headers or other page metadata e.g. for publishing to s3

  function outputPages(output, cb) {
    if (typeof output === 'function') { cb = output; output = null; }
    cb = u.maybe(cb);
    output = output || opts.outputs[0];

    var files = output.files = [];
    var filemap = [];

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
      var file = { page: page, path: page._href };
      if (page['http-header']) { file['http-header'] = page['http-header']; }
      if (page['noextension']) { file['noextension'] = page['noextension']; }
      files.push(file);
      debug('pages file:', file.path);
    });

    if (output.outputAliases && generator.template$.redirect) {
      u.each(generator.aliase$, function(to, path) {
        var page = { _href:path, redirect_to:to, nolayout:1, template:'redirect' };
        files.push({ page:page, path:path });
        debug('aliases file:', path);
      });
    }

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
        file.text = generator.renderDoc(file.page, renderOpts);
      }
      catch(err) {
        log(err);
        file.text = err;
      }
      // insert entry into filemap
      var fm = { path:file.path };
      if (file.page._href) { fm.href = file.page._href; }
      if (file.page.redirect_to) { fm.redirect_to = file.page.redirect_to; }
      filemap.push( fm );
      delete file.page;
    });

    output.src.put(files, function(err) {
      if (err) return cb(err, filemap);
      cb(null, filemap);
    });
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

    var i = 0;
    u.each(files, function(file) {
      if (dirMap[file.path]) {
        i++;
        log('index file %d for %s', i, file.path);
        file.path = ppath.join(file.path, indexFile);
      }
      if (!file.noextension && !/\.[^/]*$/.test(file.path)) {
        file.path = file.path + extension;
      }
    });
  }

};
