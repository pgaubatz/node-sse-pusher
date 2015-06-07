'use strict';

require('chai').should();

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
});
