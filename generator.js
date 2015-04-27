/**
 * pub-generator.js
 * 
 * - compiles markdown source, handlebars templates, etc
 * - renders finished pages
 * - handles updates from editor
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
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
  opts.fqImages       =  opts.fqImages || process.env.IMG || '';
  opts.linkNewWindow  =  opts.linkNewWindow || false;

  // generator API
  var generator = u.extend (this, {

    // properties
    opts:              opts,
    fragments:         [],           // flat ordered fragment array
    fragment$:         {},           // map fragments by _href
    pages:             [],           // flat ordered page array from makepages()
    page$:             {},           // map pages by _href
    aliase$:           {},           // map 301 aliases to pages
    redirect$:         {},           // map 302 redirects to pages
    template$:         {},           // map compiled templates by name
    templatePages$:    {},           // map pages by template name
    home:              null,         // root page
    pagegroups:        [],           // categorization of root-level pages - useful for generic navigation

    // -- WARNING -- load and reload invalidate all existing fragment references
    load:              load,
    reload:            u.throttleMs(load, (opts.throttleReload || '3s')),

    listen:            listen,       // init generator listeners and intervals
    unload:            unload,       // disconnect from sources (like redis)

    // other methods
    compilePages:      compilePages, // sync recompile pages from source
    getPage:           getPage,      // async get page (respects getX headers)
    findPage:          findPage,     // sync get page (no getX headers support)
    redirect:          redirect,     // lookup alias or redirect url

    // other modules
    Fragment:          require('./fragment'),
    handlebars:        require('handlebars').create() // handlebars instance

  } );

  // mixins
  require('./render')(generator);
  require('./helpers')(generator);
  require('./serialize')(generator);
  require('./update')(generator);
  require('./output')(generator);

  // - // - // - // - // - // - // - // - // - // - // - // - // - // - // -

  // generator.load() called repeatedly
  function load(cb) {
    var timer = u.timer();
    require('./getsources')(opts.sources, opts, function(err, fragments) {

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

  // disconnect all sources
  function unload() {
    u.each(opts.sources, function(source) {
      if (source.src && source.src.unref) { source.src.unref(); }
      if (source.cache && source.cache.unref) { source.cache.unref(); }
    });
  }

  function compilePages(pageFragments) {
    generator.pages           =  require('./makepages')(pageFragments, opts);
    generator.page$           =  u.indexBy(generator.pages, '_href');

    generator.home = generator.page$['/'];

    // missing home - use readme or first page and redirect / to that
    if (!generator.home) {
      generator.home = generator.page$['/readme'] || generator.pages[0];
      if (!generator.home) return log('no pages');
      u.setaVal(generator.home, 'redirect', '/');
    }

    generator.aliase$         =  indexPages('alias');
    generator.redirect$       =  indexPages('redirect');
    generator.templatePages$  =  u.groupBy(generator.pages, 'template');
    generator.emit('pages-ready');
  }

  // index page[header] -> page with support for multi-val headers
  function indexPages(header) {
    var map = {};
    u.each(generator.pages, function(page) {
      var vals = page[header];
      if (!vals) return;
      if (!u.isArray(vals)) { vals = [ vals ]; }
      u.each(vals, function(val) {
        map[val] = page;
      });
    })
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

  // async page retrieval
  // hooks generator.getxxx(page, cb) if page.get = xxx
  function getPage(url, cb) {

    var page = generator.page$[u.urlPath(url)];
    var getFn = page && page.get && generator['get'+page.get];

    if (getFn) {
      getFn(page, function() { cb(null, page); });
    }
    else {
      process.nextTick(function() { cb(null, page); });
    }
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
    var pg;

    var pg = generator.aliase$[path];
    if (pg) return { status:301, url:pg._href + params };

    pg = generator.redirect$[path];
    if (pg) return { status:302, url:pg._href + params };

    // customRedirects return params also
    pg = generator.customRedirect && generator.customRedirect(url);
    if (pg) return { status:301, url:pg };
  }

}
