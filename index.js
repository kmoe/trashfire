'use strict';

const Hapi = require('hapi');
const request = require('request');
const path = require('path');
const moment = require('moment');
const sanitizeHtml = require('sanitize-html');

const server = new Hapi.Server({
  connections: {
    routes: {
      cors: true,
      files: {
        relativeTo: path.join(__dirname, 'app')
      }
    }
  }
});

server.connection({
  port: process.env.PORT || 1337
});

server.register(require('inert'), (err) => {

  if (err) {
    throw err;
  }

  server.start((err) => {
    if (err) {
      throw err;
    }
    log('info', 'Server running at: ' + server.info.uri);
  });
});

const io = require('socket.io')(server.listener);

io.on('connection', function(socket){
  log('client <strong>connected</strong>');

  socket.on('disconnect', function(){
    log('client <strong>disconnected</strong>');
  });
});

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => {
    log('base route');
    return reply.file('index.html');
  }
});

server.route({
  method: 'POST',
  path: '/logs',
  handler: (request, reply) => {
    log(request.payload.message);
    return reply('ok');
  }
})

log('Initialising...');

function log() {
  const message = Array.prototype.slice.call(arguments).join(' ');
  console.log(message);
  const sanitisedMessage = sanitizeHtml(message);
  if (sanitisedMessage !== message) {
    console.log(sanitisedMessage);
  }
  if (io) {
    io.emit('log', moment().format('YYYY-MM-DD HH:mm:ss') + ': ' + sanitisedMessage);
  }
}