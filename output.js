/**
 * output.js
 * pub-generator mixin for file output
 *
 * Copyright (c) 2015-2022 Jürgen Leschner - github.com/jldec - MIT license
 **/

var debug = require('debug')('pub:generator:output');
var u = require('pub-util');
var npath = require('path');
var ppath = npath.posix || npath; // in browser path is posix

var fs = require('fs');
var parseHeaders = require('./parseheaders');
var yaml = require('js-yaml');

module.exports = function output(generator) {
  var opts = generator.opts;
  var log = opts.log;

  generator.outputPages = outputPages;
  generator.migratePages = migratePages;

  return;

  //--//--//--//--//--//--//--//--//--//

  // migratePages()
  // migrates markdown files to pub3 format
  // writes to output.path
  function migratePages(output, cb) {
    if (typeof output === 'function') {
      cb = output;
      output = null;
    }
    cb = u.maybe(cb);
    output = output || opts.outputs[0];

    var files = [];

    var omit = output.omitRoutes;
    if (omit && !u.isArray(omit)) {
      omit = [omit];
    }
    if (omit) console.log('omitting routes', omit);

    if (!output.templates) {
      console.log('no templates specified');
      return cb();
    } else {
      console.log('migrating', Object.keys(output.templates));
    }

    var filterRe = new RegExp(
      '^(/admin/|/server/|/pub/|/pub-editor-help' +
        (omit ? '|' + u.map(omit, u.escapeRegExp).join('|') : '') +
        ')'
    );

    // pass1: collect files to generate (not /server or /admin or /pub)
    u.each(generator.pages, function (page) {
      if (filterRe.test(page._href)) return;

      // skip pages with no template or template not in output.templates
      let tpl = output.templates[page.template];
      if (!tpl) return;

      if (page.nopublish) return;

      files.push(mkfile(page._href, page._txt, page._hdr, tpl));

      if (tpl.filefragments) {
        let patterns = Object.keys(tpl.filefragments);
        u.each(page._fragments, function (fragment) {
          let pat = patterns.find((p) => fragment.fragment.startsWith(p));
          if (!pat) return;
          if (fragment.nopublish) return;
          files.push(
            mkfile(
              fragment._href.replace(pat, '/'),
              fragment._txt,
              fragment._hdr,
              tpl.filefragments[pat]
            )
          );
        });
      }
    });
    files.forEach(writefile);
    cb();

    function mkfile(path, text, _hdr, cfg) {
      debug(path);
      var file = { path, text };
      file.frontmatter = u.omit(parseHeaders({ _hdr }), '_hdr', 'fragment', 'page', 'alias', 'template');
      if (cfg.morph) {
        Object.keys(cfg.morph).forEach((k) => {
          if (file.frontmatter[k]) {
            if (typeof cfg.morph[k] === 'function') {
              let obj = cfg.morph[k](file.frontmatter[k]);
              if (obj) {
                debug('morph', k, '>fn', JSON.stringify(obj));
                delete file.frontmatter[k];
                file.frontmatter = { ...file.frontmatter, ...obj };
              } else {
                console.error('morph failed for', path, k + ':', cfg.morph[k], file.frontmatter[k]);
              }
            } else if (typeof cfg.morph[k] === 'string') {
              // simple rename
              debug('morph', k, '>', cfg.morph[k]);
              let val = file.frontmatter[k];
              delete file.frontmatter[k];
              file.frontmatter[cfg.morph[k]] = val;
            }
          }
        });
      }
      if (cfg.add) {
        Object.keys(cfg.add).forEach((k) => {
          debug('add', k, '>', JSON.stringify(cfg.add[k]));
          file.frontmatter[k] = cfg.add[k];
        });
      }
      return file;
    }

    function writefile(file) {
      let path = ppath.join(output.path, file.path);
      let dirname = ppath.dirname(path);
      if (!/\.[^/]*$/.test(path)) {
        path = path + '.md';
      }
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
      fs.writeFileSync(
        path,
        `---
${yaml.dump(file.frontmatter, { lineWidth: -1 })}
---
${file.text}`
      );

      debug(path.slice(output.path.length + 1));
    }
  }

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
    if (typeof output === 'function') {
      cb = output;
      output = null;
    }
    cb = u.maybe(cb);
    output = output || opts.outputs[0];

    var files = (output.files = []);
    var filemap = [];

    var omit = output.omitRoutes;
    if (omit && !u.isArray(omit)) {
      omit = [omit];
    }

    // TODO: re-use similar filter in server/serve-statics and server/serve-scripts
    var filterRe = new RegExp(
      '^(/admin/|/server/' +
        (opts.editor ? '' : '|/pub/') +
        (omit ? '|' + u.map(omit, u.escapeRegExp).join('|') : '') +
        ')'
    );

    // pass1: collect files to generate (not /server or /admin or /pub)
    u.each(generator.pages, function (page) {
      if (filterRe.test(page._href)) return;
      if (output.match && !output.match(page)) return; // used by tel
      var file = { page: page, path: page._href };
      if (page['http-header']) {
        file['http-header'] = page['http-header'];
      }
      if (page['noextension']) {
        file['noextension'] = page['noextension'];
      }
      files.push(file);
      debug('pages file:', file.path);
    });

    if (output.outputAliases && generator.template$.redirect) {
      u.each(generator.aliase$, function (to, path) {
        var page = {
          _href: path,
          redirect_to: to,
          nolayout: 1,
          template: 'redirect',
        };
        files.push({ page: page, path: path });
        debug('aliases file:', path);
      });
    }

    // pass2:
    fixOutputPaths(output, files);

    // pass3: generate using (possibly modified) file paths for relPaths
    // E.g. /adobe may live in the file /adobe/index.html so the relPath is '..'
    u.each(files, function (file) {
      var renderOpts = output.relPaths
        ? { relPath: u.relPath(file.path) }
        : output.staticRoot
        ? { relPath: output.staticRoot }
        : opts.relPaths
        ? { relPath: u.relPath(file.path) }
        : opts.staticRoot
        ? { relPath: opts.staticRoot }
        : {};
      if (output.fqImages) {
        renderOpts.fqImages = output.fqImages;
      }
      try {
        file.text = generator.renderDoc(file.page, renderOpts);
      } catch (err) {
        log(err);
        file.text = err;
      }
      // insert entry into filemap
      var fm = { path: file.path };
      if (file.page._href) {
        fm.href = file.page._href;
      }
      if (file.page.redirect_to) {
        fm.redirect_to = file.page.redirect_to;
      }
      filemap.push(fm);
      delete file.page;
    });

    output.src.put(files, function (err) {
      if (err) return cb(err, filemap);
      cb(null, filemap);
    });
  }

  // convert file-paths to 'index' files where necessary
  function fixOutputPaths(output, files) {
    // map directories to use for index files
    var dirMap = {};
    u.each(files, function (file) {
      dirMap[ppath.dirname(file.path)] = true;

      // edge case - treat /foo/ as directory too
      if (/\/$/.test(file.path) && ppath.dirname(file.path) !== file.path) {
        dirMap[file.path] = true;
      }
    });

    // default output file extension is .html
    var extension = 'extension' in output ? output.extension || '' : '.html';
    var indexFile = output.indexFile || 'index';

    var i = 0;
    u.each(files, function (file) {
      if (dirMap[file.path]) {
        i++;
        debug('index file %d for %s', i, file.path);
        file.path = ppath.join(file.path, indexFile);
      }
      if (!file.noextension && !/\.[^/]*$/.test(file.path)) {
        file.path = file.path + extension;
      }
    });
  }
};
