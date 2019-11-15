/* global mockAjaxRequire, jasmine, describe, it, beforeEach, expect, spyOn */

describe('ParamParser', function() {
  'use strict';

  let paramParser;

  beforeEach(function() {
    paramParser = new mockAjaxRequire.ParamParser();
  });

  it('has a default parser', function() {
    const parser = paramParser.findParser({ contentType: function() {} }),
      parsed = parser.parse('3+stooges=shemp&3+stooges=larry%20%26%20moe%20%26%20curly&some%3Dthing=else+entirely');

    expect(parsed).toEqual({
      '3 stooges': ['shemp', 'larry & moe & curly'],
      'some=thing': ['else entirely']
    });
  });

  it('should detect and parse json', function() {
    const data = {
      foo: 'bar',
      baz: ['q', 'u', 'u', 'x'],
      nested: {
        object: {
          containing: 'stuff'
        }
      }
    },
      parser = paramParser.findParser({ contentType: function() { return 'application/json'; } }),
      parsed = parser.parse(JSON.stringify(data));

    expect(parsed).toEqual(data);
  });

  it('should parse json with further qualifiers on content-type', function() {
    const data = {
      foo: 'bar',
      baz: ['q', 'u', 'u', 'x'],
      nested: {
        object: {
          containing: 'stuff'
        }
      }
    },
      parser = paramParser.findParser({ contentType: function() { return 'application/json; charset=utf-8'; } }),
      parsed = parser.parse(JSON.stringify(data));

    expect(parsed).toEqual(data);
  });

  it('should have custom parsers take precedence', function() {
    const custom = {
      test: jasmine.createSpy('test').and.returnValue(true),
      parse: jasmine.createSpy('parse').and.returnValue('parsedFormat')
    };

    paramParser.add(custom);

    const parser = paramParser.findParser({ contentType: function() {} }),
      parsed = parser.parse('custom_format');

    expect(parsed).toEqual('parsedFormat');
    expect(custom.test).toHaveBeenCalled();
    expect(custom.parse).toHaveBeenCalledWith('custom_format');
  });

  it('should skip custom parsers that do not match', function() {
    const custom = {
      test: jasmine.createSpy('test').and.returnValue(false),
      parse: jasmine.createSpy('parse').and.returnValue('parsedFormat')
    };

    paramParser.add(custom);

    const parser = paramParser.findParser({ contentType: function() {} }),
      parsed = parser.parse('custom_format');

    expect(parsed).toEqual({ custom_format: [ 'undefined' ] });
    expect(custom.test).toHaveBeenCalled();
    expect(custom.parse).not.toHaveBeenCalled();
  });

  it('removes custom parsers when reset', function() {
    const custom = {
      test: jasmine.createSpy('test').and.returnValue(true),
      parse: jasmine.createSpy('parse').and.returnValue('parsedFormat')
    };

    paramParser.add(custom);

    let parser = paramParser.findParser({ contentType: function() {} }),
      parsed = parser.parse('custom_format');

    expect(parsed).toEqual('parsedFormat');

    custom.test.calls.reset();
    custom.parse.calls.reset();

    paramParser.reset();

    parser = paramParser.findParser({ contentType: function() {} });
    parsed = parser.parse('custom_format');

    expect(parsed).toEqual({ custom_format: [ 'undefined' ] });
    expect(custom.test).not.toHaveBeenCalled();
    expect(custom.parse).not.toHaveBeenCalled();
  });
});

