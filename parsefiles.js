/**
 * parsefiles.js
 * pub-generator mixin - parses source.files for a single PUB-format source
 * populates source.fragments, source.updates, source.drafts, and source.snapshots
 * includes drafts in fragments if !production (updates processed separately)
 *
 * input:  source.files [{path, text},...] from readfiles
 * result: source.fragments[] etc. with parsed headers, and fully qualified _href
 *
 * side-effects (in addition to source)
 * - file.fragments[] contains refs to fragments from that file
 * - file.text is deleted
 * - file.source contains ref to source
 *
 * copyright 2015-2020, Jürgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');
var parseFragments = require('./parsefragments');
var parseHeaders = require('./parseheaders');
var parseLabel = require('./parselabel');


module.exports = function parsefiles(generator) {
  generator = generator || {};
  generator.parseFilesPUB = parseFilesPUB;
  return generator;
};

function parseFilesPUB(source, opts) {

  opts = opts || {};
  opts.log = opts.log || console.log;

  source.fragments = []; // main data structure
  source.updates = [];   // merged into fragments (possibly across sources) later
  source.snapshots = []; // not currently exposed
  source.drafts = [];    // not currently exposed

  u.each(source.files, function(file) {

    var fileLbl = parseLabel(file.path, true, source.slugify);
    var prevFragment = {};
    var prevLabel = {};

    file.source = source;

    // if file.text exists, parsing file with new text e.g. from serverSave()
    // else, processing possibly-modified fragments e.g. from clientUpdateFragmentText()
    // have to parseFragments() in both cases
    file.fragments = Object.prototype.hasOwnProperty.call(file,'text') ?
      parseFragments(file.text, source) :
      parseFragments(
        u.map(file.fragments, function(fragment) {
          return fragment.serialize();
        }).join(''), source);

    // now figure out where to put fragment based on its label
    u.each(file.fragments, function(fragment, idx) {

      fragment._file = file;
      parseHeaders(fragment, source);

      var lbl = source.fragmentDelim !== 'md-headings' ?
        // .page and .fragment headers also treated as labels for now
        parseLabel(fragment._lbl || fragment.page || fragment.fragment, false, source.slugify) :
        // md-headings - treat entire header text as name - no label parsing
        { _name:file._name, name:fragment._lbl };

      delete fragment._lbl;

      // first fragment can inherit path/name/ext from file
      // TODO: extend this to support (draft) files etc.
      if (idx === 0) {
        if (!lbl._name && !lbl._path) {
          if (fileLbl._name) { lbl._name = fileLbl._name; }
          if (fileLbl.name && !lbl.name) { lbl.name = fileLbl.name; }
        }
        lbl._path = lbl._path || fileLbl._path;
        lbl._ext  = lbl._ext  || fileLbl._ext;
      }
      // updates/snapshots just inherit ref, figure out rest later
      else if (lbl.func === 'update' || lbl.func == 'snapshot') {
        lbl.ref = lbl.ref || prevFragment;
      }
      else {
        // use unqualified name as #fragname
        // files and pages always have path/name
        if (!lbl._path && lbl._name && !lbl._fragname) {
          lbl._fragname = '#' + lbl._name;
          lbl._name = '';
        }
        // else synthesize #fragname
        else if (!lbl._path && !lbl._name && !lbl._fragname) {
          lbl._fragname = '#fragment-' + idx;
        }
        // only #fragments can inherit name, path and extension
        if (lbl._fragname) {
          if (!lbl._name && !lbl._path && prevLabel._name) { lbl._name = prevLabel._name; }
          lbl._path = lbl._path || prevLabel._path;
          lbl._ext  = lbl._ext  || prevLabel._ext;
        }
      }

      // default page type is markdown with no extension
      if (/^\.(md|mdown|mdwn|mkd|mkdn|mkdown|markdown)$/i.test(lbl._ext) || !lbl._ext) {
        delete lbl._ext;
      }
      // templates and other compiled fragments don't turn into pages
      else if (/^\.hbs$|^\.handlebars$/.test(lbl._ext) ||
          source.compile === 'handlebars') {
        lbl._ext = '.hbs';
        fragment._compile = 'handlebars';
      }
      else {
        // everything else defaults to literal text
        if (!fragment.template && !fragment.layout) {
          fragment.notemplate = true;
        }
        if (! /^\.(htm|html)$/i.test(lbl._ext)) {
          fragment.nocrawl = true;
        }
      }

      // record ._href
      fragment._href = (lbl._path || '') + (lbl._name || '') +
                       (lbl._fragname || '') + (lbl._ext || '');

      // record name from label
      if (lbl.name && !fragment.name) { fragment.name = lbl.name; }

      // show visible fragments
      if (!lbl.func || (lbl.func === 'draft' && !opts.production)) {
        source.fragments.push(fragment);
      }

      if (lbl.func === 'draft') {
        fragment._draft = true;
        source.drafts.push(fragment);
      }

      if (lbl.func !== 'update' && lbl.func !== 'snapshot') {
        prevLabel = lbl;
        prevFragment = fragment;
        if (!fragment._href) {
          opts.log('no href for fragment %s in file %s', idx, file.path);
        }
        else if (source.route) {
          fragment._href = source.route + fragment._href;
        }
      }
      else if (lbl.func === 'update') {
        fragment._lbl = lbl;
        source.updates.push(fragment);
      }
      else if (lbl.func === 'snapshot') {
        fragment._lbl = lbl;
        source.snapshots.push(fragment);
      }


    });

    // if necessary file.text will be recreated from fragments during serialization
    delete file.text;

  });

  !source.fragments.length && delete source.fragments;
  !source.updates.length   && delete source.updates;
  !source.snapshots.length && delete source.snapshots;
  !source.drafts.length    && delete source.drafts;

  return source;

}
