# SSE-Pusher
[![npm version](https://badge.fury.io/js/sse-pusher.svg)](http://badge.fury.io/js/sse-pusher)
[![Build Status](https://travis-ci.org/pgaubatz/node-sse-pusher.svg?branch=master)](https://travis-ci.org/pgaubatz/node-sse-pusher)
[![Coverage Status](https://coveralls.io/repos/pgaubatz/node-sse-pusher/badge.svg?branch=master)](https://coveralls.io/r/pgaubatz/node-sse-pusher?branch=master)
[![Dependency Status](https://david-dm.org/pgaubatz/node-sse-pusher.svg)](https://david-dm.org/pgaubatz/node-sse-pusher)

Simple server-sent events (SSE) for Connect and Express.

## Installation

```
$ npm install --save sse-pusher
```

## API

```javascript
var ssePusher = require('sse-pusher'); 

var push = ssePusher(); // instantiation variant 1
var push = ssePusher.create(); // instantiation variant 2
```

### push([event,] data)

Pushes an optionally typed (i.e., using the `event` parameter) event to all connected SSE clients. 

Parameters:
- `event` - event **type**, must be a string;
- `data` - event **data**, can be anything that can be serialized using `JSON.stringify()`. More precisely, anything that is *not* a string, number or boolean will be serialized using `JSON.stringify()`.

### push.handler([mountPath])

Returns a function that can be used both as a Connect/Express middleware and an Express route handler.

Parameters:
- `mountPath` - path where the Connect/Express middleware shall be mounted (e.g., `/some/path`).

## Usage

### Server-side

First, you have to load the package a instantiate a new SSE-Pusher:

```javascript
// load package:
var ssePusher = require('sse-pusher'); 

// instantiate a new SSE-Pusher:
var push = ssePusher();
```

Afterwards, you have to "wire" the SSE-Pusher with you HTTP framework of choice (i.e., Connect or Express):

```javascript
var app = connect() || express();

// install the pusher as a Connect/Express middleware:
app.use(push.handler('/some/path')); // variant 1
app.use('/some/path', push.handler()); // variant 2

// install the pusher as an Express route handler:
app.get('/some/path', push.handler());
```

Finally, using `push(event, data)` or `push(data)` you can then start pushing data to connected SSE clients:
```javascript
// push some data:
push('eventname', 'eventdata');

// push some data without specifying an event name:
push({some: 'data'});
```

### Client-side

On the client (i.e., the Web browser) you may then listen to the server-side emitted messages using the following code:

```javascript
var es = new EventSource('http://localhost:3000/some/path');

// when using push('hello') on the server:
es.onmessage = function (event) {
  console.log(event.data); // logs 'hello'
};

// when using push('greeting', 'world') on the server:
es.addEventListener('greeting', function (event) {
  console.log(event.data); // logs 'world'
});
```
