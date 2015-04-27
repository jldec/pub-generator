---- / ----

# home page
- [david](/people/david-cook)

---- /people/ David Cook ----
name: David
template: bio
birthday: 1-1-1989
note: this is a markdown fragment

# David Cook
- engineer

---- #fragment1 ----

## This is a named markdown fragment

---- ----

## this is an unnamed markdown fragment

---- .md ----

<h2>this is another unnamed markdown fragment</h2>

---- (update) ----
note: this is an update for the previous unnamed markdown fragment

<h2>David</h2>

---- (update /people/david-cook#fragment1) ----

## this is an update for #fragment1

---- /Bar ----
price: 1.99

text
without break

---- (update /bar david 1/1/2011 'correct price') ----
href:
price: 2.99

text
without break

---- (snapshot /bar - 1/1/2011-14:33) ----
name: Bar some time ago

text

---- /new-page (draft) ----

## this is draft new page

---- (draft) ----
page: /new-page2

## this is another draft new page

---- /default.hbs ----

{{{html}}}
{{#each _fragments}}{{{html}}}{{/each}}

---- /bio.hbs ----

{{{html}}}

---- /doc-layout.hbs ----

<html>
<head>
<title>minimal</title>
</head>
<body>

{{{renderPage}}}

<script src="/js/jquery.js"></script>
{{{pub-ux}}}
</body>
</html>

---- /css/styles.css ----

---- /js/jquery.js ----
src: http://...

---- /sitemap.xml ----
template: sitemap

---- /robots.txt ----
template: robots

