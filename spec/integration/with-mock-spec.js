/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe("withMock", function() {
  'use strict';

  const sendRequest = function(fakeGlobal) {
    const xhr = new fakeGlobal.XMLHttpRequest();

    xhr.open("GET", "http://example.com/someApi");
    xhr.send();
  };

  it("installs the mock for passed in function, and uninstalls when complete", function() {
    const xmlHttpRequest = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send']),
      xmlHttpRequestCtor = spyOn(window, 'XMLHttpRequest').and.returnValue(xmlHttpRequest),
      fakeGlobal = {XMLHttpRequest: xmlHttpRequestCtor},
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    mockAjax.withMock(jasmine, function() {
      sendRequest(fakeGlobal);
      expect(xmlHttpRequest.open).not.toHaveBeenCalled();
    });

    sendRequest(fakeGlobal);
    expect(xmlHttpRequest.open).toHaveBeenCalled();
  });

  it("properly uninstalls when the passed in function throws", function() {
    const xmlHttpRequest = jasmine.createSpyObj('XMLHttpRequest', ['open', 'send']),
      xmlHttpRequestCtor = spyOn(window, 'XMLHttpRequest').and.returnValue(xmlHttpRequest),
      fakeGlobal = {XMLHttpRequest: xmlHttpRequestCtor},
      mockAjax = new mockAjaxRequire.MockAjax(fakeGlobal);

    expect(function() {
      mockAjax.withMock(jasmine, function() {
        throw "error";
      });
    }).toThrow("error");

    sendRequest(fakeGlobal);
    expect(xmlHttpRequest.open).toHaveBeenCalled();
  });
});

