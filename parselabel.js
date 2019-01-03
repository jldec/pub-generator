/**
 * parselabel.js
 * parse the identifiers at the top of fragments or a file pathname
 *
 * input format: path/name.ext#fragname (suffix)
 *
 * return:
 *      { _path      segments slugified
 *        _name      slugified
 *        _ext       extension (control processing e.g. handlebars)
 *        _fragname  slugified (not available in file paths)
 *        func       first word in suffix
 *        ref }      second token in suffix
 *
 * NOTE: fileNames never include #fragment or (suffix)
 *       non-fileName path/name.ext are assumed NOT to have spaces or #
 *       this keeps things nice and easy to understand :)
 *
 * ALSO: for fileNames only, strip ordering prefix from path/name
 *       and swallow names which match the string 'index' exactly (lowercase)
 *
 * copyright 2015-2019, Jurgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');
var path = require('path');

module.exports = function parseLabel(label, isFileName, slugifyOpts) {

  label = u.trim(label);

  var slugifyOpts = slugifyOpts || {}; // passed through to u.slugify
  var indexFile = 'indexFile' in slugifyOpts ? slugifyOpts.indexFile : 'index';

  var m;
  var suffix = '';
  var lbl = {};

  if (!isFileName) {

    // suffix is everything starting with the first '('
    if ((m = label.indexOf('(')) >= 0) {
      suffix = label.slice(m);
      label = label.slice(0, m);
    }

    // fragment is everything before that starting with the first '#'
    if ((m = label.indexOf('#')) >= 0) {
      lbl._fragname = '#' + u.slugify(label.slice(m+1), slugifyOpts);;
      label = label.slice(0, m);
    }
  }

  var segments = label.replace(/[\/\\]+/g,'/').split('/');
  var rawname = u.trim(segments.pop());

  if (segments.length) {
    var cleanSegments = u.map(segments, function(segment) {
      return u.slugify(isFileName ? noPrefix(segment) : segment, slugifyOpts);
    })
    cleanSegments.push(''); // put back the one we popped off
    lbl._path = cleanSegments.join('/');
  }

  var ext;
  if (ext = path.extname(rawname)) {
    lbl._ext = ext;
    rawname = rawname.slice(0, -ext.length);
  }

  if (rawname) {
    if (isFileName && segments.length && rawname === indexFile) {
      lbl.name = u.trim(segments[segments.length - 1]) || '/'; // use parent dir for index
    }
    else {
      rawname = isFileName ? noPrefix(rawname) : rawname;
      lbl._name = u.slugify(rawname, slugifyOpts);
      if (lbl._name !== rawname) { lbl.name = u.trim(rawname); } // remember original
    }
  }

  if (suffix) {
    var suffixGrammar = /^(\w+)?(?:\s+([^\s\"]+))?/;
    var s = u.trim(suffix.slice(1,-1)).match(suffixGrammar) || {};
    if (s[1]) { lbl.func  = s[1]; }
    if (s[2]) { lbl.ref   = s[2]; }
  }

  return lbl;
}

// remove numeric file-sort prefix only if there is something after it
function noPrefix(s) {
  return s.replace(/^[0-9-]+ +([^ ])/,'$1');
}


