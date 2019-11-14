/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe('RequestTracker', function() {
  'use strict';

  var tracker;

  beforeEach(function() {
    var Constructor = mockAjaxRequire.AjaxRequestTracker();
    tracker = new Constructor();
  });

  it('tracks the number of times ajax requests are made', function() {
    expect(tracker.count()).toBe(0);

    tracker.track();

    expect(tracker.count()).toBe(1);
  });

  it('simplifies access to the last (most recent) request', function() {
    tracker.track();
    tracker.track('request');

    expect(tracker.mostRecent()).toEqual('request');
  });

  it('returns a useful falsy value when there is no last (most recent) request', function() {
    expect(tracker.mostRecent()).toBeFalsy();
  });

  it('simplifies access to the first (oldest) request', function() {
    tracker.track('request');
    tracker.track();

    expect(tracker.first()).toEqual('request');
  });

  it('returns a useful falsy value when there is no first (oldest) request', function() {
    expect(tracker.first()).toBeFalsy();
  });

  it('allows the requests list to be reset', function() {
    tracker.track();
    tracker.track();

    expect(tracker.count()).toBe(2);

    tracker.reset();

    expect(tracker.count()).toBe(0);
  });

  it('allows retrieval of an arbitrary request by index', function() {
    tracker.track('1');
    tracker.track('2');
    tracker.track('3');

    expect(tracker.at(1)).toEqual('2');
  });

  it('allows retrieval of all requests that are for a given url', function() {
    tracker.track({ url: 'foo' });
    tracker.track({ url: 'bar' });

    expect(tracker.filter('bar')).toEqual([{ url: 'bar' }]);
  });

  it('allows retrieval of all requests that match a given RegExp', function() {
    tracker.track({ url: 'foo' });
    tracker.track({ url: 'bar' });
    tracker.track({ url: 'baz' });

    expect(tracker.filter(/ba[rz]/)).toEqual([{ url: 'bar' }, { url: 'baz' }]);
  });

  it('allows retrieval of all requests that match based on a function', function() {
    tracker.track({ url: 'foo' });
    tracker.track({ url: 'bar' });
    tracker.track({ url: 'baz' });

    var func = function(request) {
      return request.url === 'bar';
    };

    expect(tracker.filter(func)).toEqual([{ url: 'bar' }]);
  });

  it('filters to nothing if no requests have been tracked', function() {
    expect(tracker.filter('foo')).toEqual([]);
  });
});

