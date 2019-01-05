/**
 * fragment.js
 *
 * copyright 2015-2019, Jurgen Leschner - github.com/jldec - MIT license
**/

module.exports = Fragment;

function Fragment(hdr, txt) {
  if (!(this instanceof Fragment)) return new Fragment(hdr, txt);

  this._hdr = hdr || '';
  this._txt = txt || '';
}

Fragment.prototype.serialize = function serialize() {
  return this._hdr + this._txt;
};
