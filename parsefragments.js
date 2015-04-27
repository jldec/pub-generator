/**
 * parsefragments.js
 * parses a string containing one or more fragments
 * (NOTE: this code does not yet support streams)
 *
 * returns an array of fragments, each with
 *  _txt: unparsed body text
 *  _hdr: unparsed header
 *
 * concatenated these properties reconstitute the original source exactly
 * (see Fragment.serialize)
 *
 * fragments are delimited by a label line followed by headers and a blank line
 *
 *    ---- label ----
 *    header: val
 *    header2: val2
 *
 * label can be used for 'name._ext' and to denote (draft) (update) etc.
 * headers are optional, but the blank line after the headers is not
 * left, right and end-of-header delimiters can be customized with opts
 * no extra fragment is generated for a header section at the very top
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 */

var Fragment = require('./fragment');
var u = require('pub-util');

module.exports = function parseFragments(srctext, opts) {
  var leftDelim, rightDelim, headerDelim, delimiterGrammar;

  // experimental - TODO, fix fenced blocks
  if (opts.fragmentDelim === 'md-headings') {
    delimiterGrammar = /^#+(.*)$/m;
  }
  else if (opts.fragmentDelim) {

    // use 'in' to handle case where delim is set to ''
    leftDelim   = 'leftDelim'   in opts ? u.escapeRegExp(opts.leftDelim)   : '----';
    rightDelim  = 'rightDelim'  in opts ? u.escapeRegExp(opts.rightDelim)  : '----';
    headerDelim = 'headerDelim' in opts ? u.escapeRegExp(opts.headerDelim) : '';

    delimiterGrammar = new RegExp(
      '^' + leftDelim + '(.*)' + rightDelim + '$' +  // delimiter line
      '[\\s\\S]*?' +                                 // non-hungry multi-line
      '^' + headerDelim + '$\\n?', 'm');             // blank line
  }

  var match;
  var pos = 0;          // current offset in srctext
  var fragments = [];   // array of fragments to return

  var currentFragment = fragments[0] = new Fragment();

  while (srctext) {

    if (match = (opts.fragmentDelim && delimiterGrammar.exec(srctext))) {
      processFragment(match); // replaces srctext with leftover text
      continue;
    }

    currentFragment._txt += srctext;
    break;
  }

  return fragments;

  function processFragment(match) {
    var hpos = match.index;
    var txtbefore = srctext.slice(0, hpos);
    var isfirst = (pos === 0 && hpos === 0);
    var hlen = match[0].length;
    var label = u.trim(match[1]);

    currentFragment._txt += txtbefore;

    if (!isfirst) {
      currentFragment = new Fragment();
      fragments.push(currentFragment);
    }

    currentFragment._hdr = match[0];
    if (label) { currentFragment._lbl = label; }

    srctext = srctext.slice(hpos + hlen);
    pos += hpos + hlen;
  }

}
