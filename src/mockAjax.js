(function() {
  mockAjaxRequire.MockAjax = function(global) {
    const requestTracker = new mockAjaxRequire.RequestTracker(),
      stubTracker = new mockAjaxRequire.StubTracker(),
      paramParser = new mockAjaxRequire.ParamParser(),
      activeXObjFactory = function() { return new global.ActiveXObject('Microsoft.XMLDOM'); },
      RealXMLHttpRequest = global.XMLHttpRequest,
      realXMLHttpRequest = new RealXMLHttpRequest();
    let FakeXMLHttpRequest;

    const self = this;

    Object.defineProperty(self, 'stubs', { get: function() { return stubTracker; } });
    Object.defineProperty(self, 'requests', { get: function() { return requestTracker; } });

    self.install = function(jasmine) {
      FakeXMLHttpRequest = mockAjaxRequire.buildFakeXMLHttpRequest(jasmine, realXMLHttpRequest, requestTracker, stubTracker, paramParser, global.DOMParser, activeXObjFactory);
      if (global.XMLHttpRequest !== RealXMLHttpRequest) {
        throw new Error("Jasmine Ajax was unable to install over a custom XMLHttpRequest. Is Jasmine Ajax already installed?");
      }

      global.XMLHttpRequest = FakeXMLHttpRequest;
    };

    self.uninstall = function() {
      if (global.XMLHttpRequest !== FakeXMLHttpRequest) {
        throw new Error("MockAjax not installed.");
      }
      global.XMLHttpRequest = RealXMLHttpRequest;
      FakeXMLHttpRequest = void 0;

      stubTracker.reset();
      requestTracker.reset();
      paramParser.reset();
    };

    self.stubRequest = function(url, data, method) {
      const stub = new mockAjaxRequire.RequestStub(url, data, method);
      stubTracker.addStub(stub);
      return stub;
    };

    self.withMock = function(jasmine, closure) {
      self.install(jasmine);
      try {
        closure();
      } finally {
        self.uninstall();
      }
    };

    self.addCustomParamParser = function(parser) {
      paramParser.add(parser);
    };

    return self;
  };
})();

