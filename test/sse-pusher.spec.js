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
    app.use(push.handler('/'));

    var es = new EventSource('http://localhost:3000/');
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
});
