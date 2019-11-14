/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect */

describe('EventBus', function() {
  'use strict';

  var event, progressEvent, eventFactory, xhr, bus;

  beforeEach(function() {
    event = jasmine.createSpyObj('event', [
      'preventDefault',
      'stopPropagation',
      'stopImmediatePropagation'
    ]);

    progressEvent = jasmine.createSpyObj('progressEvent', [
      'preventDefault',
      'stopPropagation',
      'stopImmediatePropagation'
    ]);

    eventFactory = {
      event: jasmine.createSpy('event').and.returnValue(event),
      progressEvent: jasmine.createSpy('progressEvent').and.returnValue(progressEvent)
    };

    xhr = jasmine.createSpy('xhr');
    bus = mockAjaxRequire.AjaxEventBus(eventFactory)(xhr);
  });

  it('calls an event listener with event object', function() {
    var callback = jasmine.createSpy('callback');

    bus.addEventListener('foo', callback);
    bus.trigger('foo');

    expect(callback).toHaveBeenCalledWith(progressEvent);
    expect(eventFactory.progressEvent).toHaveBeenCalledWith(xhr, 'foo');
    expect(eventFactory.event).not.toHaveBeenCalled();
  });

  it('calls an readystatechange listener with event object', function() {
    var callback = jasmine.createSpy('callback');

    bus.addEventListener('readystatechange', callback);
    bus.trigger('readystatechange');

    expect(callback).toHaveBeenCalledWith(event);
    expect(eventFactory.event).toHaveBeenCalledWith(xhr, 'readystatechange');
    expect(eventFactory.progressEvent).not.toHaveBeenCalled();
  });

  it('only triggers callbacks for the specified event', function() {
    var fooCallback = jasmine.createSpy('foo'),
        barCallback = jasmine.createSpy('bar');

    bus.addEventListener('foo', fooCallback);
    bus.addEventListener('bar', barCallback);

    bus.trigger('foo');

    expect(fooCallback).toHaveBeenCalled();
    expect(barCallback).not.toHaveBeenCalled();
  });

  it('calls all the callbacks for the specified event', function() {
    var callback1 = jasmine.createSpy('callback');
    var callback2 = jasmine.createSpy('otherCallback');

    bus.addEventListener('foo', callback1);
    bus.addEventListener('foo', callback2);

    bus.trigger('foo');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('works if there are no callbacks for the event', function() {
    expect(function() {
      bus.trigger('notActuallyThere');
    }).not.toThrow();
  });

  it('does not call listeners that have been removed', function() {
    var callback = jasmine.createSpy('callback');

    bus.addEventListener('foo', callback);
    bus.removeEventListener('foo', callback);
    bus.trigger('foo');

    expect(callback).not.toHaveBeenCalled();
  });

  it('only removes the specified callback', function() {
    var callback1 = jasmine.createSpy('callback');
    var callback2 = jasmine.createSpy('otherCallback');

    bus.addEventListener('foo', callback1);
    bus.addEventListener('foo', callback2);
    bus.removeEventListener('foo', callback2);

    bus.trigger('foo');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});

