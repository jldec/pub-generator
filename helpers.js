/**
 * helpers.js
 *
 * template rendering helpers
 * registers each helper with generator.handlebars
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

var u = require('pub-util');
var path = require('path');

module.exports = function helpers(generator) {

  var opts = generator.opts;

  var hb = generator.handlebars;

  // document templates call {{{renderLayout}}} to generate main body html for a page
  hb.registerHelper('renderLayout', function(frame) {
    return generator.renderLayout(this);
  });

  // layout templates call {{{renderPage}}} to generate inner html for a page using page.template
  hb.registerHelper('renderPage', function(frame) {
    return generator.renderPage(this);
  });

  // return html for the current page/fragment
  hb.registerHelper('html', function(frame) {
    return generator.renderHtml(this, renderOpts(frame));
  });

  // like 'html' without wrapping in an editor div (for menus)
  hb.registerHelper('html-noWrap', function(frame) {
    return generator.renderHtml(this, renderOpts(frame, { noWrap:true }));
  });

  // like 'html-noedit' with fully qualified urls (for feeds)
  hb.registerHelper('html-fq', function(frame) {
    return generator.renderHtml(this, renderOpts(frame,
    { noWrap:true,
      fqLinks:opts.appUrl,
      fqImages:(opts.fqImages || opts.appUrl) }));
  });

  // return html for a referenced page or page-fragment
  hb.registerHelper('fragmentHtml', function(fragment, frame) {
    return generator.renderHtml(resolve(fragment, this), renderOpts(frame));
  });

  // pull _renderOpts from page, and merge with optional input opts - see renderDoc()
  function renderOpts(frame, opts) {
    var renderOpts = frame.data.root && frame.data.root._renderOpts;
    return u.merge(renderOpts || {}, opts)
  }

  // expose to plugins
  hb.renderOpts = renderOpts;

  // return html from applying another template
  hb.registerHelper('partial', function(template, frame) {
    return generator.renderTemplate(this, template);
  });

  // block-helper for all pages (todo - filter on patterns)
  hb.registerHelper('eachPage', function(frame) {
    var rg = u.filter(generator.pages, function(page) {
      return !page.nocrawl && !page.nopublish &&
        !/^\/admin\/|^\/pub\/|^\/server\//.test(page._href);
    });
    var map = u.map(rg, function(page, index) {
      frame.data.index = index;
      return frame.fn(page, frame);
    });
    return map.join('');
  });

  // block-helper for fragments matching pattern
  // fragment pattern should start with #... or /page#...
  hb.registerHelper('eachFragment', function(pattern, frame) {
    pattern = hbp(pattern); frame = pattern ? frame : pattern;
    var rg = selectFragments(pattern, this);
    var map = u.map(rg, function(fragment, index) {
      frame.data.index = index;
      return frame.fn(fragment, frame);
    });
    return map.join('');
  });

  // return link html for this
  hb.registerHelper('pageLink', function(frame) {
    return generator.renderLink(renderOpts(frame, { href:this._href }));
  });

  // return link href for this
  hb.registerHelper('pageHref', function(frame) {
    return generator.renderLink(renderOpts(frame, { href:this._href, hrefOnly:true }));
  });

  // return link html for a url/name
  hb.registerHelper('linkTo', function(url, name, frame) {
    return generator.renderLink(renderOpts(frame, { href:url, text:name }));
  });

  // return link to next page
  hb.registerHelper('next', function(frame) {
    return (this._next ? generator.renderLink(renderOpts(frame, { href:this._next._href })) : '');
  });

  // return link to previous page
  hb.registerHelper('prev', function(frame) {
    return (this._prev ? generator.renderLink(renderOpts(frame, { href:this._prev._href })) : '');
  });

  // encode URI component
  hb.registerHelper('uqt', u.uqt);

  // escape csv values containing , or "
  hb.registerHelper('csvqt', u.csvqt);

  // page titles use page.title or page.name by convention allowing SEO override of title different from name
  hb.registerHelper('title', function(frame) {
    return this.title || this.name || u.unslugify(this._href);
  });

  // return scripts tags for socket.io and pub-ux
  // TODO: configurable endpoint and more sensible logic for controlling production/static
  hb.registerHelper('pub-ux', function(frame) {
    if (!opts.production && opts.editor) {
      return (opts['no-sockets'] ? '' : '<script src="' + relPath(frame) + '/socket.io/socket.io.js"></script>\n') +
             '<script src="' + relPath(frame) + '/server/pub-ux.js"></script>';
    }
    return '';
  });

  // block helper applies headers for values with pattern meta-<name>: <value>
  hb.registerHelper('eachMeta', function(frame) {
    var metakeys = u.filter(u.keys(this), function(key) { return /^meta-/.test(key); });
    return u.map(u.pick(this, metakeys), function(val, key) {
      return frame.fn({ name:key.slice(5), content:val }); }).join('');
  });

  hb.registerHelper('fqurl', function(frame) {
    return opts.appUrl + this._href;
  });

  hb.registerHelper('option', function(opt, frame) {
    return opts[opt];
  });

  hb.registerHelper('ifOption', function(opt, frame) {
    if (opts[opt]) { return frame.fn(this); }
    else { return frame.inverse(this); }
  });

  hb.registerHelper('ifDev', function(frame) {
    if (!opts.production) { return frame.fn(this); }
    else { return frame.inverse(this); }
  });

  hb.registerHelper('eachwith', function(context, frame) {
    var oh = frame && frame.hash;
    var rg = (u.keys(oh)[0] && oh[u.keys(oh)[0]]) ? u.where(context, oh) : context; // filter iff oh has a value
    return u.map(rg, frame.fn).join('');
  });

  hb.registerHelper('ifeq',    function(a, b, frame) {
    if (a==b) return frame.fn(this);
    return frame.inverse(this);
  });

  hb.registerHelper('ifnoteq', function(a, b, frame) {
    if (a!=b) return frame.fn(this);
    return frame.inverse(this);
  });

  hb.registerHelper('url1', function() {
    return url1(this._href);
  });

  // returns name in first level of url
  function url1(url){
    var match = (url).match(/^\/([^\/]*)/);
    return match && match[1] || '';
  }

  hb.registerHelper('pageTree', function(frame) { return generator.renderPageTree(); });

  hb.registerHelper('eachPageWithTemplate', function(tname, frame) {
    return u.map(generator.templatePages$[tname], frame.fn).join('');
  });

  hb.registerHelper('eachLinkIn', function(ref, frame) {
    var fragment = resolve(ref, this);
    return u.map(generator.parseLinks(fragment), frame.fn).join('');
  });

  // resolve references to fragments directly or via href string
  function resolve(ref, context) {
    if (typeof ref !== 'string') return ref;
    if (/^#/.test(ref)) { ref = (context._href || '/') + ref; }
    return generator.fragment$[ref];
  }

  // lookup multiple fragments via href pattern match
  // works like resolve with a wildcard
  // careful using this without #
  function selectFragments(refpat, context) {
    refpat = refpat || '#';
    if (/^#/.test(refpat)) { refpat = (context._href || '/') + refpat; }
    var re = new RegExp(u.escapeRegExp(refpat));
    return u.filter(generator.fragments, function(fragment) { return re.test(fragment._href); });
  }

  // determine language string for a page
  function pageLang(page) {
    return page.lang ||
      opts.lang ||
      (opts.langDirs && !u.isRootLevel(page._href) && u.topLevel(page._href)) ||
      'en';
  }

  // expose to plugins
  hb.pageLang = pageLang;

  function rtl(page) {
    var code = pageLang(page).replace(/-.*/,'');
    var rtlcodes = ['ar','arc','dv','ha','he','khw','ks','ku','ps','ur','yi'];
    return page.rtl || u.contains(rtlcodes, code);
  }

  hb.registerHelper('lang', function(frame) {
    return 'lang="' + pageLang(this) + '"';
  });


  hb.registerHelper('rtl', function(frame) {
    return 'dir="' + (rtl(this) ? 'rtl' : 'auto') + '"';
  });

  hb.registerHelper('layout-class', function(frame) {
    var list = [];
    if (this['layout-class']) { list.push(this['layout-class']); }
    list.push(this._href === '/' ? 'root' : u.slugify(this._href));
    return 'class="' + list.join(' ') + '"';
  });

  function githubText(page) {
    switch (pageLang(page)) {
      case 'fr':    return 'Forkez-moi sur GitHub';
      case 'he':    return 'צור פיצול בGitHub';
      case 'id':    return 'Fork saya di Github';
      case 'ko':    return 'Github에서 포크하기';
      case 'pt-br': return 'Faça um fork no Github';
      case 'pt-pt': return 'Faz fork no Github';
      case 'tr':    return 'Github üstünde Fork edin';
      case 'uk':    return 'скопіювати на Github';
      default:      return 'Fork me on Github';
    }
  }

  hb.registerHelper('githubBadge', function(frame) {
    if (opts.github) {
      return u.format(
        '<p class="badge"><a href="%s">%s</a></p>',
        opts.github,
        this['github-text'] || githubText(this)
      );
    }
  });

  // turn list into single string of values separated by commas
  hb.registerHelper('csv', u.csv);

  // return current fragment ID or ''
  hb.registerHelper('fragmentID', function() {
    var h = u.parseHref(this._href);
    return (h.fragment && h.fragment.slice(1)) || '';
  });

  // return relPath for prefixing static links when generating output with relPaths:true
  function relPath(frame) {
    return renderOpts(frame).relPath || '';
  }

  // expose to plugins
  hb.relPath = relPath;

  hb.registerHelper('relPath', function(frame) {
    return relPath(frame);
  });

  // inject CSS from themes and packages
  hb.registerHelper('injectCss', function(frame) {
    return u.map(opts.injectCss, function(css) {
      return '<link rel="stylesheet" href="' + relPath(frame) + css.path + '">';
    }).join('\n');
  });

  // inject javascript from themes and packages
  hb.registerHelper('injectJs', function(frame) {
    // inject this relPath always - not just when output.relPaths - see pub-ux
    var rp = JSON.stringify(relPath(frame) || u.relPath(this._href));
    return '<script>window.relPath = ' + rp + ';</script>\n' +
      u.map(opts.injectJs, function(js) {
      return '<script src="' + relPath(frame) + js.path + '"></script>';
    }).join('\n');
  });

  // turn text with line breaks into escaped html with <br>
  hb.registerHelper('hbr', u.hbreak);

  // minimal text-only diff renderer (for use inside hover or title tag)
  // not accurate - TODO fragment-level diffing
  hb.registerHelper('difftext', function() {
    var s = '';
    var context = '';
    var page = ''
    u.each(this.diff, function(v) {
      // grab last page or fragment id before change
      if (m = v.value.match(/\n\s*(page|fragment):([^\n]*\n)/g)) {
        context = m.slice(-1)[0];
        if (!page) { page = u.trim(context); }
      }
      if (v.added) {
        s += context + '\nadded: '+v.value;
        context = '';
      }
      if (v.removed) {
        s += context + '\nremoved: '+v.value;
        context = '';
      }
    });
    this.difftext = s || 'no change';
    this.diffpage = page || this.file;
    return this.difftext;
  });

  // try user-provided fragment, then faMarkdown with font-awesome, then html
  function defaultFragmentHtml(fragmentName, faMarkdown, html, frame) {

    var f = generator.fragment$[fragmentName];
    if (f) return fragmentHtml(f, frame);

    if (faMarkdown && u.find(opts.pkgs, function(pkg) {
      return ('pub-pkg-font-awesome' === pkg.pkgName);
    })) {
      return fragmentHtml( {_txt:faMarkdown,
        _href:'/#synthetic' }, frame, {noWrap:1});
    }

    return html;
  }

  function fragmentHtml(fragment, frame, opts) {
    return generator.renderHtml(fragment, hb.renderOpts(frame, opts));
  }

  function githubUrl(pkgJson) {
    pkgJson = pkgJson || opts.pkgJson;
    var url = pkgJson && pkgJson.repository && pkgJson.repository.url;
    var match;
    if (url && (match = url.match(/git:\/\/(github\.com.*)\.git$/i))) {
      return 'https://' + match[1];
    }
  }

  hb.defaultFragmentHtml = defaultFragmentHtml;
  hb.githubUrl = githubUrl;

  //--//--//--//--//--//--//--//--//--//--//
  // the following helpers are variadic   //
  //--//--//--//--//--//--//--//--//--//--//

  hb.registerHelper('fullDate',    function(d) { return u.date(hbp(d)).format('fullDate'); });
  hb.registerHelper('mediumDate',  function(d) { return u.date(hbp(d)).format('mediumDate'); });
  hb.registerHelper('longDate',    function(d) { return u.date(hbp(d)).format('longDate'); });
  hb.registerHelper('shortDate',   function(d) { return u.date(hbp(d)).format('m/d/yyyy'); });
  hb.registerHelper('isoDateTime', function(d) { return u.date(hbp(d)).format('isoDateTime'); });
  hb.registerHelper('xmlDateTime', function(d) { return u.date(hbp(d)).format('yyyy-mm-dd\'T\'HH:MM:ss'); });
  hb.registerHelper('dateTime',    function(d) { return u.date(hbp(d)).format(); });

  // render img using markdown renderer
  // src defaults to this.image or this.icon - returns '' if no src
  // text defaults to this.name and is optional
  // title is optional
  hb.registerHelper('image', function(src, text, title) {
    src = hbp(src) || this.image || this.icon;
    if (!src) return '';
    text = hbp(text) || this.name || '';
    title = hbp(title);
    return generator.renderer.image(src, title, text);
  });

  // render option or page-property as an HTML comment
  hb.registerHelper('comment', function(prop) {
    prop = hbp(prop);
    if (prop) return '<!-- ' + u.escape(this[prop] || opts[prop] || prop) + ' -->';
  });

  // helper helper to make undefined the frame arg passed to all helpers
  // useful for simulating variadic helpers that call variadic functions like u.date()
  // assumes that the hash + data props are unique to hb frame objects
  function hbp(x) { return (x && x.hash && x.data) ? undefined : x; }

  // expose to plugins
  hb.hbp = hbp;

  //--//--//--//--//--//--//--//--//--//--//--//--//--//
  // the following helpers require generator state    //
  // will not work correctly except on live server    //
  //--//--//--//--//--//--//--//--//--//--//--//--//--//

  hb.registerHelper('route', function(frame) {
    return generator.route || '/';
  });

  hb.registerHelper('if-authenticated', function(frame) {
    var user = generator.req && generator.req.user;
    if (user) return frame.fn(this);
    else return frame.inverse(this);
  });

  hb.registerHelper('user', function() {
    return (generator.req && generator.req.user) || '';
  });

}
