(function() {
  mockAjaxRequire.AjaxStubTracker = function() {
    function StubTracker() {
      let stubs = [];

      this.addStub = function(stub) {
        stubs.push(stub);
      };

      this.reset = function() {
        stubs = [];
      };

      this.findStub = function(url, data, method) {
        for (let i = stubs.length - 1; i >= 0; i--) {
          const stub = stubs[i];
          if (stub.matches(url, data, method)) {
            return stub;
          }
        }
      };
    }

    return StubTracker;
  };
})();

