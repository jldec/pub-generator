# pub-generator

- markdown/handlebars site generator
- runs in node as part of pub-server, or in browser e.g. inside `pub-pkg-editor`

### installation

**pub-generator** is included with `pub-server` and runs as part of the server.

### server usage

the server instantiates a single generator as follows:

```js
// resolve config
var opts = require('pub-resolve-opts')(opts, __dirname);

// instatiate generator
var generator = require('pub-generator')(opts);

// install plugins
u.each(opts.generatorPlugins, function(plugin) {
  require(plugin.path)(generator);
});

// read all sources and compile
generator.load(cb)
```

a minimal express page renderer would look like this:

```js
app.get(function(req, res, next) {
  var page = generator.findPage(req.url);
  if (!page) return next();
  res.send(generator.renderDoc(page));
});
```


### browser usage
`pub-server` can deliver the generator to clients in browserified form at `/pub/_generator.js`.
Here is a slightly simplified version of this (jQuery) script. Options and plugins are retrieved separately for caching reasons.

```js
$.getJSON('/pub/_opts.json')
.fail(function(jqXHR) { alert('unable to load /pub/_opts.json'); })
.done(function(respData) {

  // opts includes source.file data for all sources
  // see pub-server serve-scripts
  var opts = respData;

  // start client-side pub-generator
  var generator = window.generator = require('pub-generator')(opts);

  // get browserified generator plugins - avoid caching across directories
  $.getScript('/pub/_generator-plugins.js?_=' + encodeURIComponent(opts.basedir))
  .fail(function(jqXHR) { alert('unable to load generator plugins'); })
  .done(function(script) {

    generator.load(function(err) {
      if (err) return opts.log(err);

      // slightly ugly way to notify client (editor) that generator is ready
      if (window.onGeneratorLoaded) {
        window.onGeneratorLoaded(generator);
      }
    });
  });
});
```

### generator API
The `pub-generator` API will be documented as soon as all modules in pub-server reach v1.0, which should be in a few weeks.

In the meantime, check out the code in `pub-server`, `pub-pkg-editor`, and `pub-generator`.