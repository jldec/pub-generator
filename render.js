/**
 * render.js
 *
 * pub-generator mixin
 * provides functions for rendering HTML using handlebars templates and marked
 *
 * Copyright (c) 2015-2022 Jürgen Leschner - github.com/jldec - MIT license
 *
**/

var u        = require('pub-util');
var marked   = require('marked');
var markedForms = require('marked-forms');
var esc      = u.escape;

module.exports = function render(generator) {

  var opts = generator.opts;
  var log = opts.log;

  marked.use( { renderer: { link: renderLink, image: renderImage } } );
  marked.use(markedForms( { allowSpacesInLinks: opts.allowSpacesInLinks } ));

  function defaultRenderOpts(docPage) {
    var o = {
      // staticRoot is automatically set in static-hosted editor
      fqLinks:       opts.fqLinks || opts.staticRoot,

      // use of `pub -r .` or opts.relPaths is not recommended - will not work in SPA/editor
      relPath:       (opts.relPaths && docPage) ? u.relPath(docPage._href) : opts.staticRoot,

      mangle:        opts.mangleEmails || false, // default to non-mangled autolinked emails
      fqImages:      opts.fqImages,
      linkNewWindow: opts.linkNewWindow,
      highlight:     opts.highlight };

    // docPage used by renderLink to highlight links to current page
    if (docPage) { o.docPage = docPage; }

    return o;
  }

  function renderMarkdown(txt, options) {
    options = u.assign({}, defaultRenderOpts(), options);
    return marked.marked(txt, options);
  }

  generator.renderOpts      = defaultRenderOpts;  // TODO: revisit (cannot renderDoc with staticRoot from editor)
  generator.marked          = marked;

  generator.renderMarkdown  = renderMarkdown;  // low level markdown renderer
  generator.renderTemplate  = renderTemplate;  // low level template renderer (used by renderDoc/Layout/Page)
  generator.renderDoc       = renderDoc;       // render page for publishing using a doc template (usually includes renderLayout)
  generator.renderLayout    = renderLayout;    // render layout html for a page using a layout template (usually includes renderPage)
  generator.renderPage      = renderPage;      // render page-specific html using a template (usually includes renderHtml)
  generator.renderHtml      = renderHtml;      // render html from fragment._txt (markdown)

  generator.docTemplate     = docTemplate;     // returns name of document template for a page
  generator.layoutTemplate  = layoutTemplate;  // returns name of layout template for a page
  generator.pageTemplate    = pageTemplate;    // returns name of page template for a page

  generator.renderLink      = renderLink;      // marked-compatible <a> renderer
  generator.renderImage     = renderImage;     // marked-compatible <img> renderer
  generator.rewriteLink     = rewriteLink;     // link rewriter for relPaths etc.

  generator.renderPageTree  = renderPageTree;  // render page hierarchy starting at /
  generator.parseLinks      = parseLinks;      // parse links from item._txt

  return;



  // template renderer
  // handles missing template and template runtime errors
  function renderTemplate(fragment, templateName) {
    if (templateName === 'none') return fragment._txt;
    var t = generator.template$[templateName];
    if (!t) {
      log('Unknown template %s for %s, using default.', templateName, fragment._href);
      t = generator.template$.default;
    }

    var out;
    try { out = t(fragment); }
    catch(err) {
      var msg = u.format('Error rendering %s\n\ntemplate: %s\n',
                         fragment._href, templateName, err.stack || err);
      log(msg);
      out = opts.production ? '' : '<pre>' + esc(msg) + '</pre>';
    }

    return out;
  }


  // render a complete page document
  // this is the primary function for static site/page generators and servers
  // also supports scenarios where there is no layout or no doc template
  function renderDoc(page, renderOpts) {
    if (generator.renderOpts !== defaultRenderOpts) return log(new Error('Recursive call to renderDoc'));
    var rOpts = generator.renderOpts = function() { return u.assign({}, defaultRenderOpts(page), renderOpts); };
    var out = renderTemplate(page, docTemplate(page), rOpts()); // synchronous
    generator.renderOpts = defaultRenderOpts;
    return out;
  }

  // render a layout using a layout template
  // typically only happens if there is a doc template which includes {{{renderLayout}}}
  // this enables offline navigation in multi-layout use cases
  // this function always wraps in marker divs
  function renderLayout(page) {
    var template = layoutTemplate(page);
    var html = renderTemplate(page, template);
    if (opts.renderPageLayoutOld) {
      return '<div data-render-layout="' + esc(template) + '">' + html + '</div>';
    }
    return '<div data-render-layout="' + esc(template) + '">\n' + html + '\n</div><!--layout-->';
  }

  // render a page with a non-layout page-specific template
  // this provides the primary mode of offline navigation on sites with a single layout
  // this function always wraps in marker divs
  function renderPage(page) {
    var template = pageTemplate(page);
    var html = renderTemplate(page, template);
    if (opts.renderPageLayoutOld) {
      return '<div data-render-page="' + esc(template) + '">' + html + '</div>';
    }
    return '<div data-render-page="' + esc(page._href) + '">\n' + html + '\n</div><!--page-->';
  }

  // return name of document template for a page
  // delegate to layoutTemplate if site has no doc template
  // page.notemplate bypasses default templates and returns literal text
  function docTemplate(page) {
    return page.doclayout ||
      (page.notemplate && 'none') ||
      (page.nolayout && page.template) ||
      (generator.template$['doc-layout'] && 'doc-layout') ||
      layoutTemplate(page);
  }

  // return name of layout template for a page
  // delegate to pageTemplate if site has no layout template
  // uses main-layout as soon as it exists
  function layoutTemplate(page) {
    return page.layout ||
      (generator.template$['main-layout'] && 'main-layout') ||
      pageTemplate(page);
  }

  // return name of page template
  function pageTemplate(page) {
    return page.template || 'default';
  }


  // render html from markdown in fragment._txt
  // rewrite local links using page names and https where necessary
  // NOTE: opts are also passed through to marked() - opts.fqLinks will qualify urls.
  function renderHtml(fragment, opts) {
    var html = (!fragment || !u.trim(fragment._txt)) ?
      '&nbsp;' : // show space for empty/missing to allow selection/editing
      renderMarkdown(fragment._txt, opts);
    // use opts.noWrap to avoid breaking CSS nested selectors like li > ul in menus
    if (opts && opts.noWrap) return html;
    var href = (fragment && esc(fragment._href)) || '';
    return '<div data-render-html="' + href + '"' + (fragment && fragment.nopublish ? ' class="nopublish"' : '') + '>' + html + '</div>';
  }


  // renderLink
  // function signature matches marked.js link renderer (href, title, text)
  // supports alternative signature using object {href, title, text, hrefOnly}
  // uses page.name or href for link text, if text is missing
  // and does reasonable things for missing name, href
  // NOTE: params passed as strings are assumed pre-html-escaped, params in {} are not.
  function renderLink(href, title, text) {
    var renderOpts;

    if (typeof href !== 'object') {
      renderOpts = this.options; // this -> marked renderer
    }
    else {
      renderOpts = href;
      href = esc(renderOpts.href);
      title = esc(renderOpts.title);
      text = esc(renderOpts.text);
    }

    // lookup page before munging href
    var page = generator.page$[href];

    var target = '';

    if (opts.linkNewWindow && /^http/i.test(href)) {
      target = ' target="_blank" rel="noopener"';
    }
    else if (/\^$/.test(u.str(title))) {
      title = title.slice(0,-1);
      target = ' target="_blank" rel="noopener"';
    }

    href = rewriteLink(href, renderOpts);

    if (renderOpts.hrefOnly) return href;

    var name = text ||
      (page && (page.htmlName ||    // htmlName may be generated by plugins
                esc(page.name) ||
                esc(page.title) ||
                esc((!page._hdr && page._file.path.slice(1)) || ''))) ||
      esc(u.unslugify(href)) ||
      '--';

    var onclick = (page && page.onclick) ? ' onclick="' + esc(page.onclick) + '"' : '';

    // auto-highlight link to current docPage with class="{opts.openClass}"
    var css = (renderOpts.openClass && page && renderOpts.docPage === page) ? ' class = "' + esc(renderOpts.openClass) + '"' : '';

    return '<a href="' + (href || '#') + '"' + (title ? ' title="' + title + '"' : '') + css + target + onclick + '>' + name + '</a>';
  }


  // renderImage (same as marked-image module but can call rewriteLink)
  // function signature matches marked.js image renderer (href, title, text)
  // supports alternative object param {href, title, text, renderOpts...}
  // NOTE: params passed as strings are assumed pre-html-escaped, params in {} are not.
  function renderImage(href, title, text) {
    var renderOpts;

    if (typeof href !== 'object') {
      renderOpts = this.options || defaultRenderOpts(); // this -> marked renderer
    }
    else {
      renderOpts = href;
      href = esc(renderOpts.href);
      title = esc(renderOpts.title);
      text = esc(renderOpts.text);
    }

    var out, iframe;

    href = rewriteLink(href, renderOpts);

    if (href && (m = href.match(/vimeo\/(\d+)/i))) {
      iframe = true;
      out = '<iframe src="//player.vimeo.com/video/' + m[1] + '"' +
              ' frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen';
    }
    else {
      out = '<img src="' + href + '" alt="' + text + '"';
    }

    var a = (title && title.split(/\s+/)) || [];
    var b = [];
    var classNames = [];
    var m;
    a.forEach(function(w) {
      if ((m = w.match(/^(\d+)x(\d+)$/))) return (out += ' width="' + m[1] + '" height="' + m[2] + '"');
      if ((m = w.match(/^(\w+)=([\w-]+)$/))) {
        if (m[1] === 'class') return classNames.push(m[2]);
        return (out += ' ' + m[1] + '="' + m[2] + '"');
      }
      if ((m = w.match(/^\.([\w-]+)$/))) return classNames.push(m[1]);
      if (w) return b.push(w);
    });

    if (classNames.length) {
      out += ' class="' + classNames.join(' ') + '"';
    }

    title = b.join(' ');

    if (title) {
      out += ' title="' + title + '"';
    }

    out += iframe ? '></iframe>' :
           renderOpts.xhtml ? '/>' :
           '>';

    return out;
  }


  // Link rewriting logic - shared by renderLink and renderImage and hb.fixPath
  function rewriteLink(href, renderOpts) {
    var imgRoute = renderOpts.fqImages && (renderOpts.fqImages.route || '/images/');
    var imgPrefix = renderOpts.fqImages && renderOpts.fqImages.url;
    var linkPrefix = renderOpts.fqLinks || renderOpts.relPath;

    if (imgPrefix && u.startsWith(href, imgRoute)) { href = imgPrefix + href; }
    else if (linkPrefix && /^\/([^/]|$)/.test(href)) { href = linkPrefix + href; }

    return href;
  }

  // recursively build ul-li tree starting with root._children
  // optionally groupBy top-level categories
  // TODO: detect/avoid cycles
  function renderPageTree(root, renderOpts) {

    renderOpts = u.assign({ openClass:'open' }, renderOpts);

    if (renderOpts.groupBy) {
      var folderPages =
        u.map(u.groupBy(root._children, renderOpts.groupBy), function(children, name) {
          if (name === 'undefined') { name = renderOpts.defaultGroup || ''; }
          return { folderPage: true,
                   _href:      name ? '/' + u.slugify(name) + '/' : '',
                   _children:  children,
                   name:       name };
        });
      return recurse(folderPages);
    }
    else return recurse(root._children);

    function recurse(children, pid) {
      pid = pid || renderOpts.pageTreeID || 'page-tree';
      var out = '\n<ul>';

      u.each(children, function(page) {
        var ppid = (pid + '-' + page._href).replace(/\W+/g, '-').replace(/^-|-$/g,'');
        out += '\n<li' + (page._children ? ' id="' + ppid + '" class="folder"' : '') + '>'
            + (page.folderPage ?
              ((page.name || page._href) ? '<span class="folderPage">' + (page.name || u.unslugify(page._href)) + '</span>' : '') :
              renderLink(u.assign({}, renderOpts, { href:page._href, title:(page.title || page.name) })))
            + (page._children ? recurse(page._children, ppid) : '')
            + '</li>';
      });
      return out + '\n</ul>';
    }
  }

  // parse links from item text as a side effect of rendering with marked
  // returns an array of hrefs (not fully qualified) usable for lookups in page$
  // does not use pages.renderer with extended images, forms etc.
  /*eslint no-unused-vars: "off"*/
  function parseLinks(item) {
    if (!item || !item._txt) return;
    var links = [];
    var renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
      links.push(href);
      return ''; // don't care about actual rendered result
    };
    marked.marked(item._txt, {renderer:renderer});
    return links;
  }
};
