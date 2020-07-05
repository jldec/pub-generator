/**
 * pub-generator.js
 *
 * - compiles markdown source, handlebars templates, etc
 * - renders finished pages
 * - handles updates from editor
 *
 * copyright 2015-2020, Jürgen Leschner - github.com/jldec - MIT license
**/

var debug = require('debug')('pub:generator');

var u = require('pub-util');

var events = require('events');
u.inherits(Generator, events.EventEmitter);

module.exports =  Generator;

function Generator(opts) {
  if (!(this instanceof Generator)) return new Generator(opts);
  events.EventEmitter.call(this);

  opts = require('pub-resolve-opts')(opts || {});
  var log = opts.log;

  // defaults
  opts.fqImages       =  opts.fqImages ||
                         (process.env.IMG ? { url:process.env.IMG } : '');
  opts.linkNewWindow  =  opts.linkNewWindow || false;

  // generator API
  var generator = u.assign(this, {

    // properties
    opts:              opts,
    fragments:         [],           // flat ordered fragment array
    fragment$:         {},           // map fragments by _href
    pages:             [],           // flat ordered page array from makepages()
    page$:             {},           // map pages by _href
    aliase$:           {},           // map 301 aliases to pages
    redirect$:         {},           // map 302 redirects to pages
    template$:         {},           // map compiled templates by name
    templatePages$:    {},           // group pages by template name
    sourcePages$:      {},           // group pages by source
    contentPages:      [],           // all crawlable pages for nav, toc etc.
    home:              null,         // root page
    pagegroups:        [],           // categorization of root-level pages - useful for generic navigation

    // -- WARNING -- load and reload invalidate all existing fragment references
    load:              load,
    reload:            u.throttleMs(load, (opts.throttleReload || '3s')),

    listen:            listen,       // init generator listeners and intervals
    unload:            unload,       // disconnect from sources (like redis)

    // other methods
    compilePages:      compilePages, // sync recompile pages from source
    logPages:          logPages,     // log pages and templates
    getPage:           getPage,      // async get page
    findPage:          findPage,     // sync get page
    redirect:          redirect,     // lookup alias or redirect url
    debug:             debug,        // help debug plugins etc.

    // other modules
    Fragment:          require('./fragment'),
    handlebars:        require('handlebars').create(), // handlebars instance
    util:              u                               // lighten browserified plugins

  } );

  // mixins
  require('./render')(generator);
  require('./helpers')(generator);
  require('./parsefiles')(generator);
  require('./getsources')(generator);
  require('./serialize')(generator);
  require('./update')(generator);
  require('./output')(generator);

  // - // - // - // - // - // - // - // - // - // - // - // - // - // - // -

  // generator.load() called repeatedly
  function load(cb) {
    var timer = u.timer();
    generator.getSources(opts.sources, opts, function(err, fragments) {

      if (err) return cb && cb(err);

      generator.fragments = fragments;
      generator.fragment$ = u.indexBy(generator.fragments, '_href');

      var pageFragments = u.filter(fragments, function(fragment) {
        return !fragment._compile;
      });
      compilePages(pageFragments);

      var templateFragments = u.where(fragments, { _compile: 'handlebars' } );
      compileTemplates(templateFragments);

      generator.emit('load');    // hook custom loaders
      generator.emit('loaded');  // then announce loaded

      debug('loaded %sms', timer());
      cb && cb();
    });
  }

  function logPages() {
    u.each(generator.pages, function(page) {
      log('page: ' + page._href);
    });
    u.each(generator.template$, function(t, name) {
      log('template: ' + name);
    });
  }

  function listen(isServer) {
    if (isServer) {
      u.each(opts.outputs, function(output) {
        if (output.interval) {
          u.setIntervalMs(output.output, output.interval);
        }
        if (output.auto) {
          log('auto-output to %s', output.path);
          generator.on('loaded', output.output);
        }
      });
    }

    // hook for custom listeners and intervals
    generator.emit('init-timers', isServer);
  }

  // disconnect all sources and cancel all throttled functions
  function unload() {
    u.each(opts.sources, function(source) {
      if (source.src && source.src.unref) { source.src.unref(); }
      if (source.cache && source.cache.unref) { source.cache.unref(); }
      if (source.cache2 && source.cache2.unref) { source.cache2.unref(); }
    });
    u.each(opts.outputs, function(output) {
      if (output.output && output.output.cancel) { output.output.cancel(); }
    });
    if (generator.reload && generator.reload.cancel) { generator.reload.cancel(); }
    if (generator.clientSave && generator.clientSave.cancel) { generator.clientSave.cancel(); }
  }

  function compilePages(pageFragments) {
    var pgs = generator.pages = require('./makepages')(pageFragments, opts);
    var p$  = generator.page$ = u.indexBy(pgs, '_href');

    generator.home = p$['/'];

    // no '/', look for a de-facto home
    if (!generator.home) {
      generator.home =
        p$['/index']       ||
        p$['/index.html']  ||
        p$['/index.htm']   ||
        p$['/readme']      ||
        p$['/readme.html'] ||
        p$['/readme.htm']  ||
        (pgs[0] && !/^\/pub\/|^\/admin\/|^\/server\//.test(pgs[0]._href) ? pgs[0] : null);

      if (!generator.home) {
        log('no generated pages');
      }
      else {
        // redirect / to de-facto home
        u.setaVal(generator.home, 'redirect', '/');
      }
    }

    generator.aliase$         =  indexPages('alias');
    generator.redirect$       =  indexPages('redirect');
    generator.templatePages$  =  u.groupBy(pgs, 'template');
    generator.sourcePage$     =  u.groupBy(pgs, function(page) { return page._file.source.name; });
    generator.contentPages    =  u.filter(pgs, function(page) {
      return !page.nocrawl && !page.nopublish && !/^\/admin\/|^\/pub\/|^\/server\//.test(page._href);
    });
    generator.emit('pages-ready');
  }

  // index page[header] -> page._href with support for multi-val headers
  function indexPages(header) {
    var map = {};
    u.each(generator.pages, function(page) {
      u.each(u.getaVals(page, header), function(val) {
        map[val] = page._href;
      });
    });
    // inject redirect for trailing slash on editorPrefix (TODO - logic for other pages)
    if (header === 'redirect' && opts.editor) {
      map[opts.editorPrefix] = opts.editorPrefix + '/';
      if (opts.editorPrefix !== '/pub') {
        map['/pub'] = map['/pub/'] = opts.editorPrefix + '/';
      }
    }
    return map;
  }

  function compileTemplates(templateFragments) {
    var t = {};
    u.each(templateFragments, function(fragment) {
      var tname = fragment._href.slice(1,-4);
      var template = fragment._txt;
      if (template) {
        if (t[tname]) { return log('WARNING: duplicate template %s in %s', tname, fragment._file.path); }
        t[tname] = generator.handlebars.compile(template); // todo: handle compile-time errors
      }});
    if (!t.default) {
      t.default = generator.handlebars.compile('{{{html}}}{{#each _fragments}}{{{html}}}{{/each}}');
      // log('auto-generated "default" template');
    }
    generator.template$ = t;
  }

  // potentially async page retrieval
  // returns /pub/ for <editorPrefix/... urls, and sets generator.route
  // does not match naked <editorPrefix> without trailing / -- see redirect() below
  function getPage(url, cb) {
    var href = u.urlPath(url);

    if(opts.editor) {
      var prefix = opts.editorPrefix;
      if (u.startsWith(url, prefix + '/') && generator.page$[u.urlPath(u.unPrefix(url, prefix))]) {
        generator.route = u.unPrefix(url, prefix);
        href = '/pub/';
      }
      else if (href === '/pub/' && prefix !== '/pub') { href = '/pub~>' + prefix; } // force redirect
    }
    // debug('getPage', href);
    process.nextTick(function() { cb(null, generator.page$[href]); });
  }

  // sugar
  function findPage(url) {
    return generator.page$[u.urlPath(url)];
  }

  // compute alias or custom redirect for a url - returns falsy if none
  // 302 redirects are temporary - browsers won't try to remember them
  // 301 redirects are permanent - browsers will cache and avoid re-requesting
  function redirect(url) {
    var path = u.urlPath(url);
    var params = u.urlParams(url);

    var pg = generator.aliase$[path];
    if (pg) { debug('alias %s to %s', url, pg); return { status:301, url:pg + params }; }

    pg = generator.redirect$[path];
    if (pg) { debug('redirect %s to %s', url, pg); return { status:302, url:pg + params }; }

    // customRedirects return pg with params
    pg = generator.customRedirect && generator.customRedirect(url);
    if (pg) { debug('customRedirect %s to %s', url, pg); return { status:301, url:pg }; }
  }

}
