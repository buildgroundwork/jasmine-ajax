const jasmineAjaxGlobal = (function(root) {
  'use strict';

  if (typeof module !== 'undefined' && module.exports && typeof exports !== 'undefined') {
    if (typeof global !== 'undefined') {
      module.exports = { jasmineAjaxGlobal: global, mockAjaxRequire: {} };
    } else {
      module.exports = { jasmineAjaxGlobal: root, mockAjaxRequire: {} };
    }
  } else if (typeof window !== 'undefined') {
    window.mockAjaxRequire = {};
    return window;
  } else {
    root.mockAjaxRequire = {};
    return root;
  }
})(this);

