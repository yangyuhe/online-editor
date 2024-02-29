const { WebSocketServer } = require('ws');
module.exports.startWS = function () {
  const wss = new WebSocketServer({ port: 8442 });

  wss.on('connection', function (ws) {
    console.log('new connection');
  });
};
