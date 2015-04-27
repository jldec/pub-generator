/**
 * serializefiles.js
 * reverse of parsefiles.js: serializes fragments back into file.text
 * TODO: streaming
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
**/

var u = require('pub-util');

module.exports = function serialize(generator) {
  generator = generator || {};

  generator.serializeTextFragments = serializeTextFragments;
  generator.serializeFiles         = serializeFiles;
  generator.serializeFile          = serializeFile;
  generator.recreateFileText       = recreateFileText;

  return generator;
}

function serializeFiles(files) {
  return u.map(files, serializeFile);
}

// return serializable file object
function serializeFile(file) {

  // preserve path, source, and file-save props
  var o = u.pick(file, 'path', '_oldtext', '_dirty');

  // recreate file.text from serialized fragments
  // new or modifified fragments should delete file.text
  o.text = file.text || serializeTextFragments(file);

  return o;
}

function serializeTextFragments(file) {
  return u.map(file.fragments, function(fragment) { return fragment.serialize(); }).join('');
}

function recreateFileText(files) {
  u.each(files, function(file) {
    file.text = serializeTextFragments(file);
  });
}

