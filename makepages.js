/**
 * makepages.js
 *
 * compiles/collects markdown source fragments into an array of pages with child fragments
 * input = fragments array from getsources
 * return = array of pages in file/fragment order
 *
 * NOTES
 * - respect nopublish flag (omits page) if opts.production - feels hacky - TODO: find better way
 * - JL 11/21 - TODO: fix to support regen now that files are hidden?
 *
 * for each page
 *   *:          named values (via parseheaders)
 *   _href:      fully qualified path or path#fragment
 *   _file:      reference to source file object for saving edits
 *               only exists on non-synthetic pages ()
 *               note: last _file wins for merged pages (editing headers on merged pages may be problematic)
 *   _parent:    reference to page above in page hierarchy (none for root)
 *   _children:  array of references to pages below in page hierarchy if any
 *   _prev:      reference to previous sibling page if any
 *   _next:      reference to next sibling page if any
 *   _fragments: array of references to page fragments (for auto-rendering fragments in order)
 *   #*:         #name references to each page fragment (for rendering fragment by name)
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');

// compile fragments into pages
module.exports = function makepages(fragments, opts) {
  opts = opts || {};
  opts.log = opts.log || console.log;

  var pages = [];   // array to return
  var page$ = {};   // hash for lookups
  var nopage$ = {}; // hash of unpublished pages (production only) to filter out fragments

  u.each(fragments, function(fragment, idx) {
    if (/#/.test(fragment._href)) {
      processPageFragment(fragment);
    } else {
      processPage(fragment);
    }
  });

  function processPageFragment(fragment) {
    var href = u.parseHref(fragment._href);
    if (nopage$[href.path]) return; // ignore fragments belonging to unpublished pages
    var page = page$[href.path];
    if (!page) return opts.log('WARNING: makepages - no matching page found for fragment %s', fragment._href);
    if (!page._fragments) { page._fragments = []; }
    page._fragments.push(fragment);
    if (page[href.fragment]) return opts.log('WARNING: makepages - duplicate fragment %s', fragment._href);
    page[href.fragment] = fragment;
  }

  function processPage(page) {
    if (page$[page._href]) return opts.log('WARNING: makepages - duplicate page %s', page._href);
    if (page.static || (opts.production && page.nopublish)) return nopage$[page._href] = page; // legacy
    page$[page._href] = page;
    pages.push(page);
  }

  // add _parent and _children[] and _prev and _next in page order
  // orphans end up under parent = '/'
  u.each(pages, function(page) {
    var pHref = u.parentHref(page._href);
    var parent = page$[pHref];
    while (pHref && !parent) {
      pHref = u.parentHref(pHref)
      parent = page$[pHref]
    }
    if (parent) {
      page._parent = parent;
      if (!parent._children) { parent._children = []; }
      var cnt = parent._children.push(page);
      if (cnt > 1) {
        var prev =  parent._children[cnt-2]
        page._prev = prev;
        prev._next = page;
      }
    }
  });

  return pages;
}
