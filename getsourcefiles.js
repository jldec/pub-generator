/**
 * pub-generator getsourcefiles.js
 *
 * Copyright (c) 2015-2024 Jürgen Leschner - github.com/jldec - MIT license
**/

module.exports = function getSourceFiles(source, cb) {

  // test and set this atomically
  var fromSource = source._reloadFromSource;
  delete source._reloadFromSource;

  // check for memoized files (this is how browser typically gets files)
  if (source.files && !fromSource) {
    return process.nextTick(function() {
      cb(null, source.files);
    });
  }

  if (!source.src) return cb(new Error('No src for ' + source.name));

  source.src.get( { fromSource:fromSource }, function(err, files) {
    if (err) return cb(err);
    source.files = files;
    cb(null, files);
  });

};
