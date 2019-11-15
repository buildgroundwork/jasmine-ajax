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

