/**
 * parseHeaders.js
 *
 * mutates fragment by adding header properties from fragment._hdr
 * headers are simple name:string pairs - no number parsing etc
 * repeated headers turn into array values via util.setaVal()
 * header lines which don't parse are ignored
 * there is no header ordering
 *
 * WHY NOT YAML?
 * because quoting or escaping strings with '&' etc. is bothersome
 *
 * future maybe:
 * 1. JSON values
 * 2. match html5 data values (auto-lowercase? eat-dashes? in names to match dataset)
 *    http://www.w3.org/TR/html5/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes
 *    interop with http://api.jquery.com/data/#data-html5
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 */

var u = require('pub-util');

module.exports = function parseHeaders(fragment, opts) {
  opts = opts || {};

  var headerGrammar = opts.headerGrammar || /^\s*([^:]+?)\s*:\s*(\S.*?)\s*$/;

  var kv;

  if (fragment && fragment._hdr) {

    // skip 1st line
    fragment._hdr.split('\n').slice(1).forEach(function(line) {

      if (line && (kv = line.match(headerGrammar))) {

        // set fragment[key] = value or convert to Array and then push(value)
        u.setaVal(fragment, kv[1], kv[2]);

      }

    });

  }

  return fragment;
}
