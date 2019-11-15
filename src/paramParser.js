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

