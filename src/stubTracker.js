(function() {
  mockAjaxRequire.StubTracker = function() {
    let stubs = [];

    const self = this;

    self.addStub = function(stub) {
      stubs.push(stub);
    };

    self.reset = function() {
      stubs = [];
    };

    self.findStub = function(url, data, method) {
      for (let i = stubs.length - 1; i >= 0; --i) {
        const stub = stubs[i];
        if (stub.matches(url, data, method)) {
          return stub;
        }
      }
    };

    return self;
  };
})();

