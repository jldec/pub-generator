/**
 * parselabel.js
 * parse the identifiers at the top of fragments or file path
 *
 * input format: path/name#fragname.ext (func ref user date "comment text")
 * e.g.  ==== Some Heading Text .md (draft) ====
 *
 * return:
 *      { _path      segments slugified
 *        _name      slugified
 *        _fragname  slugified (not available in file paths)
 *        _ext       extension (controls processing)
 *        func       tag for update, draft etc
 *        ref        href for update
 *        user       optional who dun it
 *        date       optional when
 *        cmnt }     optional why
 *
 * the / # . ( ) characters are treated as special
 * TODO: provide mechanism to escape - markdown uses \
 *
 * - path ends with / and cannot start with # or ( and cannot contain #
 * - name cannot start with . or ( or / or # and cannot contain # or /
 * - fragname starts with the first # and may contain any characters
 *   fragname will cede to an extension or a suffix at the end of the label
 * - extension starts with . and may not contain .
 * - suffix starts with ( and ends with ) at the end of the label
 * e.g. (update / david@example.com 4-11-2001 "ran spellcheck on homepage")
 *
 * NOTE: path/name#fragname are slugified into ._path ._name and ._fragname
 *       so that text headings can be used as separators, and generate labels
 *
 * ALSO: since filenames may be labels, strip ordering prefix from path/name
 *       and swallow names which match the string 'index' exactly (lowercase)
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');

module.exports = function parseLabel(label, opts) {

  var opts = opts || {}; // passed through to u.slugify
  var indexFile = 'indexFile' in opts ? opts.indexFile : 'index';

  var labelGrammar =
    /^(\/|[^#\(][^#]*?\/)?([^#\/\(\.][^#\/]*?)?(#.*?)?(\.[^\.]+)?(?:\s*\(([^\(\)]*)\))?$/;  // omg!

  var m = u.trim(label).match(labelGrammar) || {};

  var lbl = {};

  if (m[1]) { lbl._path = slugifyPath(m[1], opts); }

  if (m[2]) {
    var rawname = noPrefix(m[2]);
    if (m[1] && rawname === indexFile) {
      lbl.name = u.trim(m[1].replace(/^.*\/([^\/]+)\/$/, '$1')); // use parent dir for index
    }
    else {
      lbl._name = u.slugify(rawname, opts);
      if (lbl._name !== rawname) { lbl.name = u.trim(rawname); } // remember original
    }
  }

  if (m[3]) {
    lbl._fragname = '#' + u.slugify(m[3].slice(1), opts);
    if (m[3] !== lbl._fragname) { lbl.fragname = u.trim(m[3]); } // remember original
  }

  if (m[4]) { lbl._ext = '.' + u.slugify(m[4].slice(1), opts); }

  if (m[5]) {

    var suffixGrammar =
/^(\w+)?(?:\s+([^\s\"]+))?(?:\s+([^\s\"]+))?(?:\s+([^\s\"]+))?(?:\s*\"([^\"]*)\")?/;

    var s = u.trim(m[5]).match(suffixGrammar) || {};

    if (s[1]) { lbl.func  = s[1]; }
    if (s[2]) { lbl.ref   = s[2]; }
    if (s[3]) { lbl.user  = s[3]; }
    if (s[4]) { lbl.date  = s[4]; }
    if (s[5]) { lbl.cmnt  = s[5]; }
  }

  return lbl;
}


// slugify all segments in a path with noPrefix
function slugifyPath(s, opts) {
  opts = opts || {};
  var a = s.split('/');
  return u.map(a, function(segment) { return u.slugify(noPrefix(segment), opts); }).join('/');
};

// remove numeric file-sort prefix only if there is something after it
function noPrefix(s) {
  return s.replace(/^[0-9-]+ +([^ ])/,'$1');
}


