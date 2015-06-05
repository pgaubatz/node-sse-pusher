'use strict';

module.exports = function () {
  var eventId = 0;
  var nextClientId = 0;
  var clients = {};

  function fn(eventOrData, data) {
    if (typeof data === 'undefined') {
      data = eventOrData;
      eventOrData = null;
    } else if (typeof eventOrData !== 'string') {
      throw new TypeError('\'event\' must be a string');
    }

    Object.keys(clients).forEach(function (clientId) {
      var client = clients[clientId];

      client.write('id: ' + (eventId++) + '\n');
      if (eventOrData) {
        client.write('event: ' + eventOrData + '\n');
      }
      client.write('data: ' + JSON.stringify(data) + '\n\n');
    });
  }

  fn.handler = function () {
    return function (req, res) {
      var clientId = nextClientId++;

      clients[clientId] = res;

      req.on('close', function () {
        delete clients[clientId];
      });

      req.socket.setTimeout(0); // '0' means 'no timeout'

      res.statusCode = 200;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    };
  };

  fn.middleware = function (path) {
    return function (req, res, next) {
      if (req.headers['Accept'] !== 'text/event-stream' || path && path !== req.url) {
        return next();
      }
      return fn.handler()(req, res);
    };
  };

  return fn;
};
