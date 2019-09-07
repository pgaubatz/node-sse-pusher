'use strict';

require('chai').should();

var http = require('http');
var express = require('express');
var EventSource = require('eventsource');

var ssePusher = require('../index');

describe('SSE-Pusher', function () {
  var push;
  var app;
  var server;

  beforeEach(function (done) {
    push = ssePusher();
    app = express();
    server = app.listen(3000, done);
  });

  afterEach(function (done) {
    server.close(done);
  });

  it('can be instantiated using .create()', function () {
    var fn = ssePusher.create();
    fn.should.be.a('function');
    fn.should.have.property('handler');
    fn.handler.should.be.a('function');
  });

  it('should allow events to be pushed', function (done) {
    app.use(push.handler('/some/path'));

    var es = new EventSource('http://localhost:3000/some/path');
    es.onopen = function () {
      push('hello');
    };
    es.onmessage = function (event) {
      event.data.should.equal('hello');
      es.close();
      done();
    };
  });

  it('should allow typed events to be pushed', function (done) {
    app.use(push.handler('/'));

    var es = new EventSource('http://localhost:3000/');
    es.onopen = function () {
      push('greeting', 'hello');
    };
    es.addEventListener('greeting', function (event) {
      event.data.should.equal('hello');
      es.close();
      done();
    });
  });

  it('should be allowed to be used as a route handler', function (done) {
    app.get('/some/path', push.handler());

    var es = new EventSource('http://localhost:3000/some/path');
    es.onopen = function () {
      push('hello');
    };
    es.onmessage = function (event) {
      event.data.should.equal('hello');
      es.close();
      done();
    };
  });

  it('should automatically convert everything, except strings, numbers and boolean, to JSON', function (done) {
    app.use(push.handler('/'));

    var values = [
      1,
      'hello',
      true,
      {some: 'data'},
      [1, 2, 3]
    ];
    var es = new EventSource('http://localhost:3000/');
    es.onopen = function () {
      values.forEach(function (value) {
        push(value);
      });
    };
    es.onmessage = function (event) {
      var value = event.data;
      try {
        value = JSON.parse(event.data);
      } catch (ignored) {
      }
      values.splice(0, 1)[0].should.deep.equal(value);

      if (values.length < 1) {
        es.close();
        done();
      }
    };
  });

  it('should correctly send multiline strings', function (done) {
    app.use(push.handler('/'));

    var values = [
      "a\nb\r\nc\n",
      "a\nb\r\n\r\nc\nd\n\n\n",
      JSON.stringify({some: 'data'}, null, "\t"),
    ];
    var es = new EventSource('http://localhost:3000/');
    es.onopen = function () {
      values.forEach(function (value) {
        push(value);
      });
    };
    es.onmessage = function (event) {
      var value = event.data;
      var sentValue = values.splice(0, 1)[0].split(/\r?\n/).join('\n').replace(/(?:\r?\n)+$/, '');
      sentValue.should.deep.equal(value);

      if (values.length < 1) {
        es.close();
        done();
      }
    };
  });

  it('should should throw an exception if the \'event\' parameter is no string', function () {
    push.bind(push, 1, 'some event').should.throw(TypeError);
    push.bind(push, true, 'some event').should.throw(TypeError);
    push.bind(push, {test: 123}, 'some event').should.throw(TypeError);

    push.bind(push, 'greeting', 'some event').should.not.throw(TypeError);
  });

  it('should ignore all requests that do not have a \'Accept: text/event-stream\' header', function (done) {
    app.use(push.handler('/'));

    http.get('http://localhost:3000/', function (res) {
      res.statusCode.should.equal(404);
      res.destroy();
      done();
    });
  });
});
