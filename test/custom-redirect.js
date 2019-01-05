var u = require('pub-util');

module.exports = function(generator) {
  generator.customRedirect = function(url) {
    if (/^\/testRedirect/i.test(url)) {
      return '/new/url' +
             (u.urlParams(url) ? u.urlParams(url) + '&test=1' : '?test=1');
    }
  };
};