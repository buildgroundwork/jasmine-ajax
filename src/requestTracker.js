(function() {
  mockAjaxRequire.RequestTracker = function() {
    let requests = [];

    const self = this;

    self.track = function(request) {
      requests.push(request);
    };

    self.first = function() {
      return requests[0];
    };

    self.count = function() {
      return requests.length;
    };

    self.reset = function() {
      requests = [];
    };

    self.mostRecent = function() {
      return requests[requests.length - 1];
    };

    self.at = function(index) {
      return requests[index];
    };

    self.filter = function(predicate) {
      const matchingRequests = [];

      for (let i = 0; i < requests.length; ++i) {
        if (matchRegexp(requests[i], predicate) ||
          matchFn(requests[i], predicate) ||
          matchUrl(requests[i], predicate)) {
          matchingRequests.push(requests[i]);
        }
      }

      return matchingRequests;
    };

    return self;

    function matchRegexp(request, predicate) {
      return predicate instanceof RegExp && predicate.test(request.url);
    }

    function matchFn(request, predicate) {
      return predicate instanceof Function && predicate(request);
    }

    function matchUrl(request, predicate) {
      return request.url === predicate;
    }
  };
})();

