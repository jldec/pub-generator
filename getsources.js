/**
 * pub-generator getsources.js
 * returns aggregated fragments across sources after applying updates
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');

var asyncbuilder = require('asyncbuilder');
var getsourcefiles = require('./getsourcefiles');
var parsefiles = require('./parsefiles');
var Fragment = require('./fragment');

module.exports = function getSources(sources, opts, cb) {

  opts = opts || {};
  var log = opts.log || console.log;

  var ab = new asyncbuilder(processFiles);

  u.each(sources, function(source) {

    var append = ab.asyncAppend();

   // try to get source files and report - don't bubble - errors
    getsourcefiles(source, function(err) {
      if (err) { log('ERROR: cannot load %s. %s', source.name, err.message); }

      if (source.type === 'FILE') {
        parsefiles(source, opts);
      }

      append(null, source)
    });
  });

  ab.complete();


  function processFiles(err) {
    if (err) return cb(err);

    var fragments = collect('fragments');

    if (!opts.production) {

      // apply updates by replacing "target" fragments
      var fragment$ = u.indexBy(fragments, '_href');
      u.each(collect('updates'), function(update) {

        var target = update._lbl.ref;
        delete update._lbl;

        if ( !(target instanceof Fragment) ) {
          target = fragment$[target];
        }
        if (target) {

          update._update = target;

          // inherit from target
          update._href = update._href || target._href;

          var i = u.indexOf(fragments, target);
          if (i >= 0) {
            fragments[i] = update;
            return;
          }
        }
        log('cannot find target of update', update._hdr,
          'from', update._file.path);
      });
    }

    cb(null, fragments);

    function collect(key) {
      return u.compact(u.flatten(u.pluck(sources, key), true));
    }

  }

}