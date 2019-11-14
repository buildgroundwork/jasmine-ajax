/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect */

describe('Event', function() {
  'use strict';

  let eventFactory, xhr;

  beforeEach(function() {
    eventFactory = mockAjaxRequire.AjaxEvent();
    xhr = jasmine.createSpy('xhr');
  });

  it('create an event', function() {
    const event = eventFactory.event(xhr, 'readystatechange');

    expect(event.type).toBe('readystatechange');
    expect(event.currentTarget).toBe(xhr);
    expect(event.target).toBe(xhr);
    expect(event.cancelable).toBe(false);
    expect(event.bubbles).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(event.eventPhase).toBe(2);
    expect(event.timeStamp).toBeDefined();
    expect(event.isTrusted).toBe(false);
  });

  it('create a progress event', function() {
    const event = eventFactory.progressEvent(xhr, 'loadend');

    expect(event.type).toBe('loadend');
    expect(event.currentTarget).toBe(xhr);
    expect(event.target).toBe(xhr);
    expect(event.cancelable).toBe(false);
    expect(event.bubbles).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(event.eventPhase).toBe(2);
    expect(event.timeStamp).toBeDefined();
    expect(event.isTrusted).toBe(false);

    expect(event.lengthComputable).toBe(false);
    expect(event.loaded).toBe(0);
    expect(event.total).toBe(0);
  });
});

