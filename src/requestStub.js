(function() {
  mockAjaxRequire.AjaxRequestStub = function() {
    const RETURN = 0,
      ERROR = 1,
      TIMEOUT = 2,
      CALL = 3;

    const normalizeQuery = function(query) {
      return query ? query.split('&').sort().join('&') : undefined;
    };

    const timeoutRequest = function(request) {
      request.responseTimeout();
    };

    function RequestStub(url, stubData, method) {
      if (url instanceof RegExp) {
        this.url = url;
        this.query = undefined;
      } else {
        const split = url.split('?');
        this.url = split[0];
        this.query = split.length > 1 ? normalizeQuery(split[1]) : undefined;
      }

      this.data = (stubData instanceof RegExp) ? stubData : normalizeQuery(stubData);
      this.method = method;
    }

    RequestStub.prototype = {
      andReturn: function(options) {
        options.status = (typeof options.status !== 'undefined') ? options.status : 200;
        this.handleRequest = function(request) {
          request.respondWith(options);
        };
      },

      andError: function(options) {
        if (!options) {
          options = {};
        }
        options.status = options.status || 500;
        this.handleRequest = function(request) {
          request.responseError(options);
        };
      },

      andTimeout: function() {
        this.handleRequest = timeoutRequest;
      },

      andCallFunction: function(functionToCall) {
        this.handleRequest = function(request) {
          functionToCall(request);
        };
      },

      matches: function(fullUrl, data, method) {
        let urlMatches = false;
        fullUrl = fullUrl.toString();
        if (this.url instanceof RegExp) {
          urlMatches = this.url.test(fullUrl);
        } else {
          const urlSplit = fullUrl.split('?'),
              url = urlSplit[0],
              query = urlSplit[1];
          urlMatches = this.url === url && this.query === normalizeQuery(query);
        }
        let dataMatches = false;
        if (this.data instanceof RegExp) {
          dataMatches = this.data.test(data);
        } else {
          dataMatches = !this.data || this.data === normalizeQuery(data);
        }
        return urlMatches && dataMatches && (!this.method || this.method === method);
      }
    };

    return RequestStub;
  };
})();

