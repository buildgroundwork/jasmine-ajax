/*

Jasmine-Ajax - v4.0.0: a set of helpers for testing AJAX requests under the Jasmine
BDD framework for JavaScript.

Jasmine Home page: http://jasmine.github.io/

*/

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

// 
(function() {
  // https://dom.spec.whatwg.org/#concept-event
  mockAjaxRequire.Event = function(xhr, type) {
    const self = this;

    self.type = type;
    self.bubbles = false;
    self.cancelable = false;
    self.timeStamp = now();

    self.isTrusted = false;
    self.defaultPrevented = false;

    // Event phase should be "AT_TARGET"
    // https://dom.spec.whatwg.org/#dom-event-at_target
    self.eventPhase = 2;

    self.target = xhr;
    self.currentTarget = xhr;

    self.preventDefault = noop;
    self.stopPropagation = noop;
    self.stopImmediatePropagation = noop;

    return self;
  };

  mockAjaxRequire.ProgressEvent = function(xhr, type) {
    const self = new mockAjaxRequire.Event(xhr, type);

    self.lengthComputable = false;
    self.loaded = 0;
    self.total = 0;

    return self;
  };


  function now() {
    return new Date().getTime();
  }

  function noop() {}
})();


(function() {
  mockAjaxRequire.EventBus = function(source) {
    const eventList = {};

    const self = this;

    self.addEventListener = function(event, callback) {
      ensureEvent(eventList, event).push(callback);
    };

    self.removeEventListener = function(event, callback) {
      const index = findIndex(eventList[event], callback);

      if (index >= 0) {
        eventList[event].splice(index, 1);
      }
    };

    self.trigger = function(name) {
      const Constructor = isProgressEvent(name) ? mockAjaxRequire.ProgressEvent : mockAjaxRequire.Event
        , event = new Constructor(source, name);

      const eventListeners = eventList[name];
      if (eventListeners) {
        eventListeners.forEach(function(listener) { listener.call(source, event); });
      }
    };

    return self;
  };

  function ensureEvent(eventList, name) {
    eventList[name] = eventList[name] || [];
    return eventList[name];
  }

  function findIndex(list, thing) {
    if (list.indexOf) {
      return list.indexOf(thing);
    }

    for (let i = 0; i < list.length; ++i) {
      if (thing === list[i]) {
        return i;
      }
    }

    return -1;
  }

  function isProgressEvent(name) {
    // Event 'readystatechange' is a simple event.
    // Others are progress events.
    // https://xhr.spec.whatwg.org/#events
    return name !== 'readystatechange';
  }
})();


(function() {
  mockAjaxRequire.buildFakeXMLHttpRequest = function(jasmine, realXMLHttpRequest, requestTracker, stubTracker, paramParser, DomParser, activeXObjFactory) {
    const STATUS_CODES = { UNSENT: 0, OPENED: 1, HEADERS_RECEIVED: 2, LOADING: 3, DONE: 4 };

    const FakeXMLHttpRequest = function() {
      let status = STATUS_CODES.UNSENT
        , statusText = ''
        , requestHeaders = {}
        , responseHeaders
        , overriddenMimeType = null
        , method, url, params, username, password
        , responseText, responseType, responseURL, responseXML;

      const self = this;
      const eventBus = new mockAjaxRequire.EventBus(self);

      const internal = (function() {
        const _self = {};

        let readyState = STATUS_CODES.UNSENT;
        Object.defineProperty(self, 'readyState', { configurable: true, get: function() { return readyState; } });
        Object.defineProperty(_self, 'readyState', {
          set: function(newState) {
            if (readyState !== newState) {
              readyState = newState;
              eventBus.trigger('readystatechange');
            }
          }
        });

        let response;
        Object.defineProperty(self, 'response', { configurable: true, get: function() { return response; } });
        Object.defineProperty(_self, 'response', {
          set: function(newResponse) {
            if ('response' in newResponse) {
              response = newResponse.response;
            } else {
              response = responseValue();
            }
          }
        });

        return _self;
      })();

      Object.defineProperty(self, 'requestHeaders', { get: function() { return combineHeaders(requestHeaders); } });
      Object.defineProperty(self, 'overriddenMimeType', { get: function() { return overriddenMimeType; } });
      Object.defineProperty(self, 'status', { configurable: true, get: function() { return status; } });
      Object.defineProperty(self, 'statusText', { get: function() { return statusText; } });
      Object.defineProperty(self, 'responseText', { get: function() { return responseText; } });
      Object.defineProperty(self, 'responseXML', { get: function() { return responseXML; } });
      Object.defineProperty(self, 'responseURL', { get: function() { return responseURL; } });

      requestTracker.track(self);
      initializeEvents();
      defineOriginalRequestMethods();

      self.addEventListener = eventBus.addEventListener;
      self.removeEventListener = eventBus.removeEventListener;

      self.open = function(method, url, _, username, password) {
        self.method = method;
        self.url = '' + url;
        self.username = username;
        self.password = password;

        requestHeaders = {};
        internal.readyState = STATUS_CODES.OPENED;
      };

      self.setRequestHeader = function(name, value) {
        if (self.readyState === STATUS_CODES.UNSENT) {
          throw new Error('DOMException: Failed to execute "setRequestHeader" on "XMLHttpRequest": The object\'s state must be OPENED.');
        }

        setHeader(requestHeaders, name, value);
      };

      self.overrideMimeType = function(mime) {
        overriddenMimeType = mime;
      };

      self.abort = function() {
        status = STATUS_CODES.UNSENT;
        statusText = "abort";

        internal.readyState = STATUS_CODES.UNSENT;
        eventBus.trigger('progress');
        eventBus.trigger('abort');
        eventBus.trigger('loadend');
      };

      self.send = function(params) {
        self.params = params;
        eventBus.trigger('loadstart');

        const stub = stubTracker.findStub(self.url, params, self.method);
        stub && stub.handleRequest(self);
      };

      self.contentType = function() {
        return findHeader('content-type', requestHeaders);
      };

      self.data = function() {
        if (self.params) {
          return paramParser.findParser(self).parse(self.params);
        } else {
          return {};
        }
      };

      self.getResponseHeader = function(name) {
        if (!responseHeaders) { return null; }
        return findHeader(name, responseHeaders);
      };

      self.getAllResponseHeaders = function() {
        if (!responseHeaders) { return null; }

        const combined = combineHeaders(responseHeaders)
          , results = [];
        for (let key in combined) {
          if (combined.hasOwnProperty(key)) {
            results.push(key + ': ' + combined[key]);
          }
        }
        return results.join('\r\n') + '\r\n';
      };

      self.respondWith = function(response) {
        if (self.readyState === STATUS_CODES.DONE) {
          throw new Error("FakeXMLHttpRequest already completed");
        }

        startResponse(response);
        processXmlResponse(response.responseText);
        processJsonResponse(response);

        internal.response = response;
        finishResponse('load');
      };

      self.responseTimeout = function() {
        if (self.readyState === STATUS_CODES.DONE) {
          throw new Error("FakeXMLHttpRequest already completed");
        }

        jasmine.clock().tick(30000);
        finishResponse('timeout');
      };

      self.responseError = function(response) {
        response = response || {};

        if (self.readyState === STATUS_CODES.DONE) {
          throw new Error("FakeXMLHttpRequest already completed");
        }
        status = response.status;
        statusText = response.statusText || "";

        finishResponse('error');
      };

      self.startStream = function(options) {
        if (self.readyState >= STATUS_CODES.LOADING) {
          throw new Error("FakeXMLHttpRequest already loading or finished");
        }

        options = options || {};
        const response = {
          status: 200
          , responseHeaders: options.responseHeaders
          , contentType: options.contentType
          , responseType: options.responseType
          , responseUrl: options.responseUrl
        };

        startResponse(response);

        internal.readyState = STATUS_CODES.LOADING;
      };

      self.streamData = function(data) {
        if (self.readyState !== STATUS_CODES.LOADING) {
          throw new Error("FakeXMLHttpRequest is not loading yet");
        }

        responseText += data;

        processXmlResponse(responseText);
        internal.response = { response: responseValue() };

        eventBus.trigger('progress');
      };

      self.completeStream = function(status) {
        if (self.readyState !== STATUS_CODES.LOADING) {
          throw new Error("FakeXMLHttpRequest is not loading");
        }

        finishResponse();
      };

      self.cancelStream = function () {
        if (self.readyState !== STATUS_CODES.LOADING) {
          throw new Error("FakeXMLHttpRequest is not loading");
        }

        status = STATUS_CODES.UNSENT;
        statusText = '';

        finishResponse();
      };

      return self;

      function initializeEvents() {
        eventBus.addEventListener('readystatechange', bindEvent('onreadystatechange'));
        eventBus.addEventListener('loadstart', bindEvent('onloadstart'));
        eventBus.addEventListener('load', bindEvent('onload'));
        eventBus.addEventListener('loadend', bindEvent('onloadend'));
        eventBus.addEventListener('progress', bindEvent('onprogress'));
        eventBus.addEventListener('error', bindEvent('onerror'));
        eventBus.addEventListener('abort', bindEvent('onabort'));
        eventBus.addEventListener('timeout', bindEvent('ontimeout'));
      }

      function bindEvent(eventName) {
        return function() {
          self[eventName] && self[eventName].apply(self, arguments);
        };
      }

      function defineOriginalRequestMethods() {
        const IE_PROPERTIES_THAT_CANNOT_BE_COPIED = ['responseBody', 'responseText', 'responseXML', 'status', 'statusText', 'responseTimeout', 'responseURL'];
        extend(self, realXMLHttpRequest, IE_PROPERTIES_THAT_CANNOT_BE_COPIED);
      }

      function combineHeaders(headers) {
        const combined = {};
        for (let key in headers) {
          if (headers.hasOwnProperty(key)) {
            combined[key] = headers[key].join(', ');
          }
        }

        return combined;
      }

      function setHeader(headers, name, value) {
        headers[name] = headers[name] || [];
        headers[name].push(value);
      }

      function findHeader(name, headers) {
        name = name.toLowerCase();
        let combinedHeaders = combineHeaders(headers);
        for (let key in combinedHeaders) {
          if (key.toLowerCase() === name) {
            return combinedHeaders[key];
          }
        }

        return null;
      }

      function startResponse(response) {
        status = response.status;
        statusText = response.statusText || '';

        responseHeaders = normalizeHeaders(response.responseHeaders, response.contentType);
        internal.readyState = STATUS_CODES.HEADERS_RECEIVED;

        responseText = response.responseText || '';
        responseType = response.responseType || '';
        responseURL = response.responseURL || null;
      }

      function processXmlResponse(responseText) {
        responseXML = null;

        const xmlParsables = ['text/xml', 'application/xml']
          , contentType = self.getResponseHeader('content-type') || '';

        if (xmlParsables.includes(contentType.toLowerCase())) {
          responseXML = parseXml(responseText, contentType);
        } else if (contentType.match(/\+xml$/)) {
          responseXML = parseXml(responseText, 'text/xml');
        }
        if (responseXML) {
          responseType = 'document';
        }
      }

      function parseXml(xmlText, contentType) {
        if (DOMParser) {
          return (new DOMParser()).parseFromString(xmlText, contentType);
        } else {
          const xml = activeXObjFactory();
          xml.async = "false";
          xml.loadXML(xmlText);
          return xml;
        }
      }

      function processJsonResponse(response) {
        if (response.responseJSON) {
          responseText = JSON.stringify(response.responseJSON);
        }
      }

      function finishResponse(event) {
        internal.readyState = STATUS_CODES.DONE;
        eventBus.trigger('progress');
        if (event) { eventBus.trigger(event); }
        eventBus.trigger('loadend');
      }

      function responseValue() {
        switch(responseType) {
          case null:
          case "":
          case "text":
            return responseText;
          case "json":
            return JSON.parse(responseText);
          case "arraybuffer":
          case "blob":
            throw "Can't build XHR.response for XHR.responseType of '" + responseType +
              "'. XHR.response must be explicitly stubbed";
          case "document":
            return responseXML;
        }
      }

      function normalizeHeaders(rawHeaders, contentType) {
        let headers = {};

        if (rawHeaders) {
          if (rawHeaders instanceof Array) {
            for (let i = 0; i < rawHeaders.length; ++i) {
              setHeader(headers, rawHeaders[i].name, rawHeaders[i].value);
            }
          } else {
            for (let name in rawHeaders) {
              if (rawHeaders.hasOwnProperty(name)) {
                setHeader(headers, name, rawHeaders[name]);
              }
            }
          }
        } else {
          setHeader(headers, 'Content-Type', contentType || 'application/json');
        }

        return headers;
      }
    };

    extend(FakeXMLHttpRequest, STATUS_CODES);
    extend(FakeXMLHttpRequest.prototype, {
      onloadstart: null,
      onprogress: null,
      onabort: null,
      onerror: null,
      onload: null,
      ontimeout: null,
      onloadend: null,
      onreadystatechange: null
    });

    return FakeXMLHttpRequest;
  };

  function extend(destination, source, propertiesToSkip) {
    propertiesToSkip = propertiesToSkip || [];
    for (let property in source) {
      if (source.hasOwnProperty(property) && !propertiesToSkip.includes(property)) {
        destination[property] = source[property];
      }
    }
    return destination;
  }
})();


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


(function() {
  const DEFAULTS = [{
    test: function(xhr) {
      return (/^application\/json/).test(xhr.contentType());
    },
    parse: function jsonParser(paramString) {
      return JSON.parse(paramString);
    }
  }, {
    test: function(xhr) {
      return true;
    },
    parse: function naiveParser(paramString) {
      const data = {};
      const params = paramString.split('&');

      for (let i = 0; i < params.length; ++i) {
        const kv = params[i].replace(/\+/g, ' ').split('=');
        const key = decodeURIComponent(kv[0]);
        data[key] = data[key] || [];
        data[key].push(decodeURIComponent(kv[1]));
      }
      return data;
    }
  }];

  mockAjaxRequire.ParamParser = function() {
    let paramParsers;

    const self = this;

    self.add = function(parser) {
      paramParsers.unshift(parser);
    };

    self.findParser = function(xhr) {
      for (let i = 0; i < paramParsers.length; ++i) {
        const parser = paramParsers[i];
        if (parser.test(xhr)) {
          return parser;
        }
      }
    };

    self.reset = function() {
      paramParsers = [];
      for (let i = 0; i < DEFAULTS.length; ++i) {
        paramParsers.push(DEFAULTS[i]);
      }
    };

    self.reset();
  };
})();


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



  return new mockAjaxRequire.MockAjax(global);
}));

