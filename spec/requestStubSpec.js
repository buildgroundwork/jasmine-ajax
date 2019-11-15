/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe('RequestStub', function() {
  'use strict';

  const RequestStub = mockAjaxRequire.RequestStub;

  beforeEach(function() {
    jasmine.addMatchers({
      toMatchRequest: function() {
        return {
          compare: function(actual) {
            return {
              pass: actual.matches.apply(actual, Array.prototype.slice.call(arguments, 1))
            };
          }
        };
      }
    });
  });

  it('matches just by exact url', function() {
    const stub = new RequestStub('www.example.com/foo');

    expect(stub).toMatchRequest('www.example.com/foo');
  });

  it('does not match if the url differs', function() {
    const stub = new RequestStub('www.example.com/foo');

    expect(stub).not.toMatchRequest('www.example.com/bar');
  });

  it('matches unordered query params', function() {
    const stub = new RequestStub('www.example.com?foo=bar&baz=quux');

    expect(stub).toMatchRequest('www.example.com?baz=quux&foo=bar');
  });

  it('requires all specified query params to be there', function() {
    const stub = new RequestStub('www.example.com?foo=bar&baz=quux');

    expect(stub).not.toMatchRequest('www.example.com?foo=bar');
  });

  it('can match the url with a RegExp', function() {
    const stub = new RequestStub(/ba[rz]/);

    expect(stub).toMatchRequest('bar');
    expect(stub).toMatchRequest('baz');
    expect(stub).not.toMatchRequest('foo');
  });

  it('requires the method to match if supplied', function() {
    const stub = new RequestStub('www.example.com/foo', null, 'POST');

    expect(stub).not.toMatchRequest('www.example.com/foo');
    expect(stub).not.toMatchRequest('www.example.com/foo', null, 'GET');
    expect(stub).toMatchRequest('www.example.com/foo', null, 'POST');
  });

  it('requires the data submitted to match if supplied', function() {
    const stub = new RequestStub('/foo', 'foo=bar&baz=quux');

    expect(stub).toMatchRequest('/foo', 'baz=quux&foo=bar');
    expect(stub).not.toMatchRequest('/foo', 'foo=bar');
  });

  it('can match the data or query params with a RegExp', function() {
    const stub = new RequestStub('/foo', /ba[rz]=quux/);

    expect(stub).toMatchRequest('/foo', 'bar=quux');
    expect(stub).toMatchRequest('/foo', 'baz=quux');
    expect(stub).not.toMatchRequest('/foo', 'foo=bar');
  });

  describe('when returning successfully', function() {
    it('passes response information to the request', function() {
      const stub = new RequestStub('/foo');
      stub.andReturn({
        status: 300,
        statusText: 'hi there',
        contentType: 'text/plain',
        extra: 'stuff'
      });
      const fakeRequest = { respondWith: jasmine.createSpy('respondWith') };

      stub.handleRequest(fakeRequest);

      expect(fakeRequest.respondWith).toHaveBeenCalledWith({
        status: 300,
        statusText: 'hi there',
        contentType: 'text/plain',
        extra: 'stuff'
      });
    });

    it('defaults to status 200', function() {
      const stub = new RequestStub('/foo');
      stub.andReturn({});
      const fakeRequest = { respondWith: jasmine.createSpy('respondWith') };

      stub.handleRequest(fakeRequest);

      expect(fakeRequest.respondWith).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 200
      }));
    });

    it('allows setting a response code of 0', function() {
      const stub = new RequestStub('/foo');
      stub.andReturn({status: 0});
      const fakeRequest = { respondWith: jasmine.createSpy('respondWith') };

      stub.handleRequest(fakeRequest);

      expect(fakeRequest.respondWith).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 0
      }));
    });
  });

  describe('when erroring', function() {
    it('passes error information to request', function() {
      const stub = new RequestStub('/foo');
      stub.andError({
        status: 502,
        extra: 'stuff'
      });

      const fakeRequest = { responseError: jasmine.createSpy('responseError') };
      stub.handleRequest(fakeRequest);

      expect(fakeRequest.responseError).toHaveBeenCalledWith({
        status: 502,
        extra: 'stuff'
      });
    });

    it('defaults to status 500', function() {
      const stub = new RequestStub('/foo');
      stub.andError({});

      const fakeRequest = { responseError: jasmine.createSpy('responseError') };
      stub.handleRequest(fakeRequest);

      expect(fakeRequest.responseError).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 500
      }));
    });
  });

  describe('when timing out', function() {
    it('tells the request to time out', function() {
      const stub = new RequestStub('/foo');
      stub.andTimeout();

      const fakeRequest = { responseTimeout: jasmine.createSpy('responseTimeout') };
      stub.handleRequest(fakeRequest);

      expect(fakeRequest.responseTimeout).toHaveBeenCalled();
    });
  });

  describe('when calling a function', function() {
    it('invokes the function with the request', function() {
      const stub = new RequestStub('/foo');
      const callback = jasmine.createSpy('callback').and.returnValue({ status: 201 });
      stub.andCallFunction(callback);

      const fakeRequest = { things: 'stuff' };
      stub.handleRequest(fakeRequest);

      expect(callback).toHaveBeenCalledWith(fakeRequest);
    });
  });
});

