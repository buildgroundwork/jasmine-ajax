(function() {
  mockAjaxRequire.EventBus = function(source) {
    this.eventList = {};
    this.source = source;
  };

  mockAjaxRequire.EventBus.prototype.addEventListener = function(event, callback) {
    ensureEvent(this.eventList, event).push(callback);
  };

  mockAjaxRequire.EventBus.prototype.removeEventListener = function(event, callback) {
    const index = findIndex(this.eventList[event], callback);

    if (index >= 0) {
      this.eventList[event].splice(index, 1);
    }
  };

  mockAjaxRequire.EventBus.prototype.trigger = function(event) {
    let evt;

    // Event 'readystatechange' is should be a simple event.
    // Others are progress event.
    // https://xhr.spec.whatwg.org/#events
    if (event === 'readystatechange') {
      evt = mockAjaxRequire.buildEvent(this.source, event);
    } else {
      evt = mockAjaxRequire.buildProgressEvent(this.source, event);
    }

    const eventListeners = this.eventList[event];

    if (eventListeners) {
      for (let i = 0; i < eventListeners.length; i++) {
        eventListeners[i].call(this.source, evt);
      }
    }
  };

  function ensureEvent(eventList, name) {
    eventList[name] = eventList[name] || [];
    return eventList[name];
  }

  function findIndex(list, thing) {
    if (list.indexOf) {
      return list.indexOf(thing);
    }

    for(let i = 0; i < list.length; i++) {
      if (thing === list[i]) {
        return i;
      }
    }

    return -1;
  }
})();

