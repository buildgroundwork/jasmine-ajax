/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe('EventBus', function() {
  'use strict';

  let event, progressEvent, xhr, bus;

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

    spyOn(mockAjaxRequire, 'buildEvent').and.returnValue(event);
    spyOn(mockAjaxRequire, 'buildProgressEvent').and.returnValue(progressEvent);

    xhr = jasmine.createSpy('xhr');
    bus = new mockAjaxRequire.EventBus(xhr);
  });

  it('calls an event listener with event object', function() {
    const callback = jasmine.createSpy('callback');

    bus.addEventListener('foo', callback);
    bus.trigger('foo');

    expect(callback).toHaveBeenCalledWith(progressEvent);
    expect(mockAjaxRequire.buildProgressEvent).toHaveBeenCalledWith(xhr, 'foo');
    expect(mockAjaxRequire.buildEvent).not.toHaveBeenCalled();
  });

  it('calls an readystatechange listener with event object', function() {
    const callback = jasmine.createSpy('callback');

    bus.addEventListener('readystatechange', callback);
    bus.trigger('readystatechange');

    expect(callback).toHaveBeenCalledWith(event);
    expect(mockAjaxRequire.buildEvent).toHaveBeenCalledWith(xhr, 'readystatechange');
    expect(mockAjaxRequire.buildProgressEvent).not.toHaveBeenCalled();
  });

  it('only triggers callbacks for the specified event', function() {
    const fooCallback = jasmine.createSpy('foo'),
      barCallback = jasmine.createSpy('bar');

    bus.addEventListener('foo', fooCallback);
    bus.addEventListener('bar', barCallback);

    bus.trigger('foo');

    expect(fooCallback).toHaveBeenCalled();
    expect(barCallback).not.toHaveBeenCalled();
  });

  it('calls all the callbacks for the specified event', function() {
    const callback1 = jasmine.createSpy('callback');
    const callback2 = jasmine.createSpy('otherCallback');

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
    const callback = jasmine.createSpy('callback');

    bus.addEventListener('foo', callback);
    bus.removeEventListener('foo', callback);
    bus.trigger('foo');

    expect(callback).not.toHaveBeenCalled();
  });

  it('only removes the specified callback', function() {
    const callback1 = jasmine.createSpy('callback');
    const callback2 = jasmine.createSpy('otherCallback');

    bus.addEventListener('foo', callback1);
    bus.addEventListener('foo', callback2);
    bus.removeEventListener('foo', callback2);

    bus.trigger('foo');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});

