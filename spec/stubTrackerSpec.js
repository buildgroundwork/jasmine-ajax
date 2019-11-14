/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe('StubTracker', function() {
  'use strict';

  let tracker;

  beforeEach(function() {
    const Constructor = mockAjaxRequire.AjaxStubTracker();
    tracker = new Constructor();
  });

  it('finds nothing if no stubs are added', function() {
    expect(tracker.findStub()).toBeUndefined();
  });

  it('finds an added stub', function() {
    const stub = { matches: function() { return true; } };
    tracker.addStub(stub);

    expect(tracker.findStub()).toBe(stub);
  });

  it('skips an added stub that does not match', function() {
    const stub = { matches: function() { return false; } };
    tracker.addStub(stub);

    expect(tracker.findStub()).toBeUndefined();
  });

  it('passes url, data, and method to the stub', function() {
    const stub = { matches: jasmine.createSpy('matches') };
    tracker.addStub(stub);

    tracker.findStub('url', 'data', 'method');

    expect(stub.matches).toHaveBeenCalledWith('url', 'data', 'method');
  });

  it('can clear out all stubs', function() {
    const stub = { matches: jasmine.createSpy('matches') };
    tracker.addStub(stub);

    tracker.findStub();

    expect(stub.matches).toHaveBeenCalled();

    tracker.reset();
    stub.matches.calls.reset();

    tracker.findStub();

    expect(stub.matches).not.toHaveBeenCalled();
  });

  it('uses the most recently added stub that matches', function() {
    const stub1 = { matches: function() { return true; } };
    const stub2 = { matches: function() { return true; } };
    const stub3 = { matches: function() { return false; } };

    tracker.addStub(stub1);
    tracker.addStub(stub2);
    tracker.addStub(stub3);

    expect(tracker.findStub()).toBe(stub2);
  });
});

