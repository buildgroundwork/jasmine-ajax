(function() {
  const RETURN = 0,
    ERROR = 1,
    TIMEOUT = 2,
    CALL = 3;

  mockAjaxRequire.RequestStub = function(url, data, method) {
    let query, handleRequest;

    const self = this;

    initialize();

    Object.defineProperty(self, 'handleRequest', { get: function() { return handleRequest; } });

    self.andReturn = function(options) {
      options.status = (typeof options.status !== 'undefined') ? options.status : 200;
      handleRequest = function(request) { request.respondWith(options); };
    };

    self.andError = function(options) {
      options = options || {};
      options.status = options.status || 500;
      handleRequest = function(request) { request.responseError(options); };
    };

    self.andTimeout = function() {
      handleRequest = function(request) { request.responseTimeout(); };
    };

    self.andCallFunction = function(functionToCall) {
      handleRequest = function(request) { functionToCall(request); };
    };

    self.matches = function(fullUrl, data, method) {
      return urlMatches(fullUrl) && dataMatches(data) && methodMatches(method);
    };

    return self;

    function initialize() {
      if (!(url instanceof RegExp)) {
        const split = url.split('?');
        url = split[0];
        if (split.length > 1) {
          query = normalizeQuery(split[1]);
        }
      }

      if (!(data instanceof RegExp)) {
        data = normalizeQuery(data);
      }
    }

    function urlMatches(potential) {
      potential = potential.toString();
      if (url instanceof RegExp) {
        return url.test(potential);
      } else {
        const urlSplit = potential.split('?');
        return url === urlSplit[0] && query === normalizeQuery(urlSplit[1]);
      }
    }

    function dataMatches(potential) {
      if (data instanceof RegExp) {
        return data.test(potential);
      } else {
        return !data || data === normalizeQuery(potential);
      }
    }

    function methodMatches(potential) {
      return !method || method === potential;
    }
  };

  function normalizeQuery(query) {
    return query && query.split('&').sort().join('&');
  }
})();

