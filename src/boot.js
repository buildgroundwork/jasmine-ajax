/*

Jasmine-Ajax - v<%= packageVersion %>: a set of helpers for testing AJAX requests under the Jasmine
BDD framework for JavaScript.

Jasmine Home page: http://jasmine.github.io/

*/

//  include "src/global.js";

(function (factory) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports && typeof exports !== 'undefined') {
    const { jasmineAjaxGlobal, mockAjaxRequire } = require('src/global');
    module.exports = factory(jasmineAjaxGlobal, mockAjaxRequire);
  } else {
    jasmineAjaxGlobal.MockAjax = factory(jasmineAjaxGlobal, jasmineAjaxGlobal.mockAjaxRequire);
  }
}(function (global, mockAjaxRequire) {
  'use strict';

// <% files.forEach(function(filename) { %>
//  include "<%= filename %>";<% }); %>

  return new mockAjaxRequire.MockAjax(global);
}));

