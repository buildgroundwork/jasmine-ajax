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

