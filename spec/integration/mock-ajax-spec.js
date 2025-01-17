/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe("mockAjax", function() {
  'use strict';

  it("throws an error if global XMLHttpRequest is no longer the original", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    fakeGlobal.XMLHttpRequest = function() {};

    expect(function() {
      mockAjax.install();
    }).toThrowError();
  });

  it("does not throw an error if uninstalled between installs", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    function sequentialInstalls() {
      mockAjax.install();
      mockAjax.uninstall();
      mockAjax.install();
    }

    expect(sequentialInstalls).not.toThrow();
  });

  it("does throw an error if uninstalled without a current install", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    expect(function() {
      mockAjax.uninstall();
    }).toThrowError();
  });

  it("does not replace XMLHttpRequest until it is installed", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    fakeGlobal.XMLHttpRequest('foo');
    expect(fakeXmlHttpRequest).toHaveBeenCalledWith('foo');

    mockAjax.install();
    fakeXmlHttpRequest.calls.reset();

    fakeGlobal.XMLHttpRequest('foo');
    expect(fakeXmlHttpRequest).not.toHaveBeenCalled();
  });

  it("replaces the global XMLHttpRequest on uninstall", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    mockAjax.install();
    mockAjax.uninstall();

    fakeGlobal.XMLHttpRequest('foo');
    expect(fakeXmlHttpRequest).toHaveBeenCalledWith('foo');
  });

  it("clears requests and stubs upon uninstall", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    mockAjax.install();

    mockAjax.requests.track({url: '/testurl'});
    mockAjax.stubRequest('/bobcat');

    expect(mockAjax.requests.count()).toEqual(1);
    expect(mockAjax.stubs.findStub('/bobcat')).toBeDefined();

    mockAjax.uninstall();

    expect(mockAjax.requests.count()).toEqual(0);
    expect(mockAjax.stubs.findStub('/bobcat')).not.toBeDefined();
  });

  it("allows the httpRequest to be retrieved", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    mockAjax.install();
    const request = new fakeGlobal.XMLHttpRequest();

    expect(mockAjax.requests.count()).toBe(1);
    expect(mockAjax.requests.mostRecent()).toBe(request);
  });

  it("allows the httpRequests to be cleared", function() {
    const fakeXmlHttpRequest = jasmine.createSpy('fakeXmlHttpRequest'),
      fakeGlobal = { XMLHttpRequest: fakeXmlHttpRequest },
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    mockAjax.install();
    const request = new fakeGlobal.XMLHttpRequest();

    expect(mockAjax.requests.mostRecent()).toBe(request);
    mockAjax.requests.reset();
    expect(mockAjax.requests.count()).toBe(0);
  });
});

