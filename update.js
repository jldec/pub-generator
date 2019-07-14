/**
 * update.js
 * pub-generator mixin for fragment updates
 *
 * copyright 2015-2019, Jurgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator');

var u = require('pub-util');

var parseFragments = require('./parsefragments');
var parseHeaders = require('./parseheaders');
var parseLabel = require('./parselabel');

var httpClient = require('pub-src-http')( { writable:1, path:'/pub/_files' } );

module.exports = function update(generator) {

  var opts = generator.opts;
  var log = opts.log;
  var sources = opts.sources;

  generator.clientUpdateFragmentText = clientUpdateFragmentText;
  generator.clientSaveHoldText       = clientSaveHoldText;
  generator.clientSave               = u.throttleMs(clientSave, (opts.throttleClientSave || '5s'));
  generator.clientSaveUnThrottled    = clientSave;
  generator.serverSave               = serverSave;
  generator.flushCaches              = flushCaches;
  generator.reloadSources            = reloadSources;

  return;

  //--//--//--//--//--//--//--//--//--//

  // ## updates with drafts mode (TODO - please reduce complexity of this code)
  // in drafts mode the first update to a normal page creates an (update) copy of the page
  // this ensures the the "production" site can be generated from source until the update is committed
  // copy-on-write changes are treated like other structural changes and trigger a generator reload
  // after the reload, all the indexes (like generator.page$ and generator.fragment$) point to the new copy
  // this code handles the case where additional calls to clientUpdateFragmentText arrive before the reload
  // this can happen because reloads are throttled and happen asynchronously

  function clientUpdateFragmentText(href, newText, breakHold) {

    var oldFragment = href && generator.fragment$[href];
    if (!oldFragment) return log(new Error('update fragment not found'));

    // detached state - do nothing
    if (oldFragment._holdUpdates) {
      if (breakHold) {
        debug('update breaking hold on ' + href);
        delete oldFragment._holdUpdates;
        delete oldFragment._holdText;
      }
      else {
        oldFragment._holdText = newText;
        debug('update ignored - hold ' + href);
        return 'hold';
      }
    }

    // (update) fragment copy already exists, but not yet loaded
    if (oldFragment._updatePending) {
      debug('update pending reload ' + href);
      oldFragment = oldFragment._updatePending;
    }

    var oldText = oldFragment.serialize();
    if (newText === oldText) return; // noop

    var file = oldFragment._file;
    var source = file.source;

    if (!source.writable) return notify('this text cannot be modified');

    // capture file._oldtext on first update - see also clientSave()
    if (!Object.prototype.hasOwnProperty.call(file,'_oldtext')) {
      file._oldtext = generator.serializeTextFragments(file);
    }

    var newFragments = parseFragments(newText, source); // returns at least one fragment, even for ''
    if (newFragments.length > 1) return notify('extra fragment delimiter detected...\nPlease undo');

    var newFragment = newFragments[0];
    parseHeaders(newFragment, source);

    var diff = u.diff(newFragment, parseHeaders( { _hdr:oldFragment._hdr, _txt:oldFragment._txt }, source ));

    if (oldFragment._hdr && !newFragment._hdr) {
      return notify('fragment header broken...\nPlease undo');
    }

    if (diff._hdr && !breakHold) {
      oldFragment._holdUpdates = true;
      oldFragment._holdText = newText;
      notify('fragment header modified, autosave postponed until next navigation');
      return 'hold';
    }

    // make sure the new fragment ends with \n
    if (!/(^|\n)$/.test(newFragment._txt)) {
      newFragment._txt += '\n';
    }

    // apply edit...
    if (!opts.drafts || oldFragment._draft || oldFragment._update) {
      // simply overwrite
      debug('update overwrite ' + href);
      oldFragment._hdr = newFragment._hdr;
      oldFragment._txt = newFragment._txt;
    }
    else {
      // splice fresh (update) fragment right after oldFragment
      debug('update copy ' + href);

      // make sure the old fragment ends with at least \n\n
      if (!/(^|\n\n)$/.test(oldFragment._txt)) {
        oldFragment._txt += '\n\n';
      }

      if (!labelFragment(newFragment, 'update', source)) {
        return log(new Error('update error writing label: ' + newFragment._hdr));
      }
      var idx = u.indexOf(file.fragments, oldFragment);
      file.fragments.splice(idx + 1, 0, newFragment);


      oldFragment._updatePending = newFragment; // signal existence of copy
      newFragment._update = oldFragment; // prevent additional copies

      diff._hdr = true; // signal reload
    }

    // trigger save to server (throttled)
    file._dirty = 1;
    if (!opts.staticHost) { generator.clientSave(); }

    // signal heavyweight edit - reload will notify views
    if (diff._hdr || newFragment.recompileOnChange) {
      generator.reload(); // throttled
    }
    // signal lightweight edit, notify views explicitly
    else {
      generator.emit('updatedText', href);
    }
  }

  function clientSaveHoldText() {
    u.each(generator.fragment$, function(fragment) {
      if (fragment._holdUpdates) {
        clientUpdateFragmentText(fragment._href, fragment._holdText, true);
      }
    });
  }

  // should move into util or parsefragments.js
  function labelFragment(fragment, func, source) {

    // use 'in' to handle case where delim is set to ''
    var leftDelim   = 'leftDelim'   in source ? source.leftDelim   : '----';
    var rightDelim  = 'rightDelim'  in source ? source.rightDelim  : '----';
    var headerDelim = 'headerDelim' in source ? source.headerDelim : '';

    if (fragment._hdr) {
      var lines = fragment._hdr.split('\n');
      var fl = lines[0];

      // sanity check - make sure this fragments does not have a (func) label already
      var lbl = parseLabel(fl.slice(leftDelim.length, fl.length - rightDelim.length), false, source.slugify);
      if (lbl.func) return false;

      lines[0] = fl.slice(0, fl.length - rightDelim.length) + ' (' + func + ') ' + rightDelim;
      fragment._hdr = lines.join('\n');
    }
    else {
      fragment._hdr = leftDelim + ' (' + func + ') ' + rightDelim
                      + '\n' + headerDelim + '\n';
    }
    return true;
  }

  // clientSave currently used only in browser
  function clientSave() {

    u.each(sources, function(source) {

      var dirtyFiles = u.filter(source.files, function(file) {
        if (file._dirty) {  // 1 means unsaved, 2 means saving
          file._dirty = 2;  // side effect of filter
          return true;
        }
        return false;
      });

      if (dirtyFiles.length) {

        var files = u.map(dirtyFiles, generator.serializeFile);

        debug('clientSave %s files, %s...', files.length, files[0].text.slice(0,200));

        // static save from browser directly to source
        if (opts.staticHost && source.staticSrc && source.src) {

          // NOTE: subtle difference in data compared to httpClient.put()
          source.src.put(files, function(err, savedFiles) {

            if (err || (u.size(savedFiles) !== u.size(dirtyFiles))) {
              // notify user on save errors
              return notify('error saving files, please check your internet connection');
            }

            u.each(dirtyFiles, function(file) {

              // no collision detection support with static saves (for now)
              file._oldtext = file.text;

              // only mark as clean if unchanged while waiting for save
              if (file._dirty === 2) { delete file._dirty; }
            });

            return source.verbose && notify(u.size(savedFiles) + ' file(s) saved');
          });
        }

        // normal (non-static) save from browser to pub-server
        else {
          httpClient.put({ source:source.name, files:files }, function(err, savedFiles) {

            if (err || (u.size(savedFiles) !== u.size(dirtyFiles))) {
              if (err) { log(err); }
              // notify user on save errors
              return notify('error saving files, please check your internet connection');
            }

            u.each(dirtyFiles, function(file, idx) {

              var savedFile = savedFiles[idx];

              if (typeof savedFile !== 'object') {
                // most likely a collision - must notify user
                return notify('error saving file: ' + savedFile);
              }

              // preserve for next update
              file._oldtext = savedFile.text;

              // only mark as clean if unchanged while waiting for save
              if (file._dirty === 2) { delete file._dirty; }

            });

            return source.verbose && notify(u.size(savedFiles) + ' file(s) saved');
          });
        }
      }
    });
  }

  // server file save (async)
  // receives array of POSTed files from client
  // detects collisions by comparing with clientFile._oldtext
  // saves whatever it can before returning results
  function serverSave(filedata, user, cb) {

    var source = opts.source$[filedata.source];
    if (!source) return cb(log(user, 'save unknown source', filedata.source));
    var file$ = u.indexBy(source.files, 'path'); // redo on every save to avoid conflicts
    var filesToSave = [];

    var results = u.map(filedata.files, function(clientFile) {

      debug('save by %s, %s %s bytes', user, clientFile.path, clientFile.text.length);

      var serverFile = file$[clientFile.path];
      if (!serverFile) return log(user, 'save unknown file', clientFile.path);

      var serverText = serverFile.text || generator.serializeTextFragments(serverFile);
      if (serverText !== clientFile._oldtext) return log(user, 'save collision on', clientFile.path);

      // existence of file.text triggers new parseFragments() on reload
      serverFile.text = clientFile.text;

      filesToSave.push(serverFile); // side effect

      delete clientFile._oldtext;
      return clientFile;
    });

    // cannot src.put(filesToSave...) because src.put is async and reload() will delete file.text
    source.src.put(generator.serializeFiles(filesToSave), { commitMsg:user }, function(err) {
      if (err) return cb(err, results);
      cb(null, results);
    });

    // avoid double-reload after save when watching (or watching but cached without writethru)
    if (!source._watching || source.src.flush) {
      generator.reload();
    }
  }


  function flushCaches(cb) {
    cb = u.onceMaybe(cb);

    var results = []; // in order of cb's

    var ok = u.after(opts.sources.length, function() {
      cb(null, results);
    });

    u.each(opts.sources, function(source) {
      if (!source.src.flush) return ok();
      source.src.flush(function(err) {
        if (err) return cb(log(err));
        results.push(source.name);
        ok();
      });
    });
  }

  // trigger reload from source
  // input = string or array of source names, nothing => all
  function reloadSources(names) {

    names = u.isArray(names) ? names :
           names ? [names] :
           u.keys(opts.source$);

    var results = [];

    u.each(names, function(name) {
      var source = opts.source$[name];
      if (source) {
        source._reloadFromSource = true;
        results.push(name);
      } else {
        results.push(log('reloadSources unknown source ' + name));
      }
    });

    generator.reload(); // throttled
    return results;
  }

  function notify() {
    var s = u.format.apply(this, arguments);
    debug(s);
    generator.emit('notify', s);
    return s;
  }

};
