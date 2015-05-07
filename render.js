/**
 * render.js
 *
 * pub-generator mixin
 * provides functions for rendering HTML using handlebars templates and marked
 *
 * copyright 2015, Jurgen Leschner - github.com/jldec - MIT license
 *
**/

var u        = require('pub-util');
var marked   = require('marked');
var esc      = u.escape;
var unesc    = u.unescape;


module.exports = function render(generator) {

  var opts = generator.opts;
  var log = opts.log;

  // configure markdown rendering
  var renderer = generator.renderer = new marked.Renderer();
  renderer.link = renderLink;
  require('marked-forms')(renderer);
  require('marked-images')(renderer);

  function renderMarkdown(txt, opts) {
    opts = u.extend( {
      renderer:      generator.renderer,
      fqImages:      generator.opts.fqImages,
      linkNewWindow: generator.opts.linkNewWindow }, opts);
    return marked(txt, opts);
  }

  generator.renderMarkdown  = renderMarkdown;  // low level markdown renderer
  generator.renderTemplate  = renderTemplate;  // low level template renderer (used by renderDoc/Layout/Page)
  generator.renderDoc       = renderDoc;       // render page for publishing using a doc template (usually includes renderLayout)
  generator.renderLayout    = renderLayout;    // render layout html for a page using a layout template (usually includes renderPage)
  generator.renderPage      = renderPage;      // render page-specific html using a template (usually includes renderHtml)
  generator.renderHtml      = renderHtml;      // render html from fragment._txt (markdown)

  generator.docTemplate     = docTemplate;     // returns name of document template for a page
  generator.layoutTemplate  = layoutTemplate;  // returns name of layout template for a page
  generator.pageTemplate    = pageTemplate;    // returns name of page template for a page

  generator.renderLink      = renderLink;      // render link given {href, name, title, noEscape}
  generator.renderPageTree  = renderPageTree;  // render page hierarchy starting at /

  generator.parseLinks      = parseLinks;      // parse links from fragment._txt
  generator.inventory       = inventory;       // scan all pages and compile inventory of images and links (!production)

  return;



  // template renderer
  // handles missing template and template runtime errors
  function renderTemplate(fragment, templateName) {
    var out;
    var t = generator.template$[templateName];
    if (!t) {
      log('Unknown template %s for %s, using default.', templateName, fragment._href);
      t = generator.template$.default;
    }
    try { return t(fragment); }
    catch(err) {
      var msg = u.format('Error rendering %s\n\ntemplate: %s\n', fragment._href, templateName, err.stack || err);
      log(msg);
      return '<pre>' + esc(msg) + '</pre>';
    }
  }


  // render a complete page document
  // this is the primary function for static site/page generators and servers
  // also supports scenarios where there is no layout or no doc template
  // this function never wraps in marker divs
  function renderDoc(page) {
    return renderTemplate(page, docTemplate(page));
  }

  // render a layout using a layout template
  // typically only happens if there is a doc template which includes {{{renderLayout}}}
  // this enables offline navigation in multi-layout use cases
  // this function always wraps in marker divs
  function renderLayout(page) {
    var template = layoutTemplate(page);
    var html = renderTemplate(page, template);
    return '<div data-render-layout="' + esc(template) + '">' + html + '</div>';
  }

  // render a page with a non-layout page-specific template
  // this provides the primary mode of offline navigation on sites with a single layout
  // this function always wraps in marker divs
  function renderPage(page) {
    var template = pageTemplate(page);
    var html = renderTemplate(page, template);
    return '<div data-render-page="' + esc(template) + '">' + html + '</div>';
  }

  // return name of document template for a page
  // delegate to layoutTemplate if site has no doc template
  // handle special pages like Sfragmentap and robots.txt with page.nolayout (use page.template)
  function docTemplate(page) {
    return page.doclayout ||
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
    if (!fragment || !fragment._txt) return '';
    var html = renderMarkdown(fragment._txt, opts);
    // use opts.noWrap to avoid breaking CSS nested selectors like li > ul in menus
    if (opts && opts.noWrap) return html;
    return '<div data-render-html="' + esc(fragment._href) + '">' + html + '</div>';
  };


  // renderLink
  // function signature matches marked.js link renderer (href, title, text)
  // supports alternative signature using object {href, title, text, hrefOnly}
  // uses page.name or href for link text, if text is missing
  // and does reasonable things for missing name, href
  // could be extended to rewrite links
  // NOTE: params passed as strings are assumed pre-html-escaped, params in {} are not.
  function renderLink(href, title, text) {
    var linkOpts;

    if (typeof href !== 'object') {
      linkOpts = this.options; // this -> marked renderer
    }
    else {
      linkOpts = href;
      href = esc(linkOpts.href);
      title = esc(linkOpts.title);
      text = esc(linkOpts.text);
    }

    var target = '';

    if (opts.linkNewWindow && /^http/i.test(href)) {
      target = ' target="_blank"';
    }
    else if (/\^$/.test(u.str(title))) {
      title = title.slice(0,-1);
      target = ' target="_blank"';
    }

    var imgPrefix = linkOpts.fqImages || linkOpts.relPaths;
    var linkPrefix = linkOpts.fqLinks || linkOpts.relPaths;

    // lookup page before munging href
    var page = generator.page$[href];

    // TODO - fix hardwired /images/ prefix
    if (imgPrefix && /^\/images\//.test(href)) { href = imgPrefix + href; }
    else if (linkPrefix && /^\/([^\/]|$)/.test(href)) { href = linkPrefix + href; }

    var name = text || (page && (page.name || (!page._hdr && page._file.path.slice(1)))) || href || '--';
    var onclick = (page && page.onclick) ? ' onclick="' + esc(page.onclick) + '"' : '';

    return '<a href="' + (href || '#') + '"' + (title ? ' title="' + title + '"' : '') + target + onclick + '>' + name + '</a>';
  }


  // recurse page._children starting at / and filtering out duplicates within each first level category
  function renderPageTree(pagelist, id$, category) {
    pagelist = pagelist || firstLevel();
    id$ = id$ || {}; // for uniqueid()
    var out = '\n<ul>';
    var pagecount = 0;
    pagelist.forEach(function(page) {
      pagecount++;
      var uid = (category || pagecount) + '-' + (page._href || u.slugify(page.name));
      if (!id$[uid]) {
        id$[uid] = true;
        out += '\n<li>'
          + '<div id="list-' + uid + '"><a href="'+ (page._href || '#') + '">' + esc(page.name || page._href) + '</a></div>'
          + (page._children ? renderPageTree(page._children, id$, (category || pagecount)) : '')
          + '</li>';
      }
    });
    return out + '</ul>';
  }

  // group first level pages into 'Home', generator.pagegroups, 'Other Groups', and 'Other Pages'
  function firstLevel() {
    var rootlevel = u.filter(generator.pages, function(page){ return u.rootlevel(page._href) });
    var tree = [{name:'Home', _href:'/'}];

    u.each(generator.pagegroups, function(category) {
      tree.push( {name:category.name, children:u.where(rootlevel, category.where)} );
    });

    var othergroups = u.difference(u.filter(rootlevel, function(page){ return !!page._children }), u.flatten(u.pluck(tree,'children'),true));
    if (othergroups.length) { tree.push({ name:'Other Groups', children:othergroups }); } // other pages with children

    var otherpages = u.difference(rootlevel, u.flatten(u.pluck(tree,'children'),true));
    if (otherpages.length) { tree.push({ name:'Other Pages', children:otherpages }); } // other pages without children

    return tree;
  }

  // parse links from fragment text as a side effect of rendering with marked
  // returns an array of hrefs (not fully qualified) usable for lookups in page$
  // does not use generator.renderer with extended images, forms etc.
  function parseLinks(fragment) {
    if (!fragment || !fragment._txt) return;
    var links = [];
    var renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
      links.push(href);
      return ''; // don't care about actual rendered result
    };
    marked(fragment._txt, {renderer:renderer});
    return links;
  }

  // similar to parseLinks
  // temporarily hooks generator renderer to compile images and links for all pages
  // this function assumes that templates and pages are ready for rendering
  function inventory() {
    var images = generator.images = {};
    var currentPage;

    var baseRenderImage = generator.renderer.image;

    generator.renderer.image = function(href, title, text) {
      if (!images[href]) { a = images[href] = []; }
      images[href].push(currentPage._href);
      return baseRenderImage(href, title, text);
    }

    u.each(generator.pages, function(pg) {
      currentPage=pg;
      renderDoc(pg);
    });

    generator.renderer.image = baseRenderImage;
  }
}



