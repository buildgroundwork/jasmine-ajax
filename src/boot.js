/*

Jasmine-Ajax - v<%= packageVersion %>: a set of helpers for testing AJAX requests under the Jasmine
BDD framework for JavaScript.

http://github.com/jasmine/jasmine-ajax

Jasmine Home page: http://jasmine.github.io/

Copyright (c) 2008-2015 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//Module wrapper to support both browser and CommonJS environment
(function (factory) {
  'use strict';

  const root = determineGlobal(this);

  if (typeof module !== 'undefined' && module.exports && typeof exports !== 'undefined') {
    const jasmineRequire = require('jasmine-core/lib/jasmine-core/jasmine.js');
    module.exports = factory(root, function() { return jasmineRequire; });
  } else {
    root.MockAjax = factory(root, root.getJasmineRequireObj);
  }

  function determineGlobal(self) {
    if (typeof global !== 'undefined') {
      return global;
    } else if (typeof window !== 'undefined') {
      return window;
    } else {
      return self;
    }
  }
}(function (global, getJasmineRequireObj) {
  'use strict';

// <% files.forEach(function(filename) { %>
//  include "<%= filename %>";<% }); %>

    const jRequire = getJasmineRequireObj()
      , MockAjax = jRequire.ajax(jRequire);
    jasmine.Ajax = new MockAjax(global);

    return MockAjax;
}));

