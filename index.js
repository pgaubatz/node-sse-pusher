'use strict';

module.exports = create;
module.exports.create = create;

function create() {
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

    if (typeof data !== 'string' && typeof data !== 'number' && typeof data !== 'boolean') {
      data = JSON.stringify(data);
    }

    Object.keys(clients).forEach(function (clientId) {
      var client = clients[clientId];

      client.write('id: ' + (eventId++) + '\n');
      if (eventOrData) {
        client.write('event: ' + eventOrData + '\n');
      }
      
      if (data.constructor && data.constructor === String) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
        data.replace(/(?:\r?\n)+$/g, '').split(/\r?\n/).forEach(function(line) {
          client.write ('data: ' + line + '\n');
        });
        client.write('\n');
      } else {
        client.write('data: ' + data + '\n\n');
      }
    });
  }

  fn.handler = function (path) {
    return function (req, res, next) {
      if (req.headers.accept !== 'text/event-stream' || path && path !== req.url) {
        return next();
      }

      var clientId = nextClientId++;
      clients[clientId] = res;

      req.socket.setTimeout(0); // '0' means 'no timeout'

      req.on('close', function () {
        delete clients[clientId];
      });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      res.write('\n', 'utf-8'); // 'flush' output buffer
    };
  };

  return fn;
}
