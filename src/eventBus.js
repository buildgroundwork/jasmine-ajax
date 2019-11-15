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

