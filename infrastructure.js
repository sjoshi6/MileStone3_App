var http      = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis')
var sio = require('socket.io')
var os = require('os')
var express = require('express');


//var client = redis.createClient(6379, '127.0.0.1', {})
var GREEN = 'http://54.191.53.19:8181';
var BLUE  = 'http://54.186.100.220:8181';

var servers =[]

servers.push(GREEN)
servers.push(BLUE)

var counter = 0;
var TARGET = GREEN;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);

    var server  = http.createServer(function(req, res)
    {
        TARGET = servers.pop()
        servers.push(TARGET)

        proxy.web( req, res, {target: TARGET } );
    });
    server.listen(8080);

    // Launch green slice
    //    exec('forever start deploy/blue-www/main.js 9090');
  //  console.log("blue slice");

    // Launch blue slice
    //exec('forever start deploy/green-www/main.js 5060');
    //console.log("green slice");

//setTimeout
//var options =
//{
//  url: "http://localhost:8080",
//};
//request(options, function (error, res, body) {

  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
}

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.log(err);
infrastructure.teardown();} );


var app = express();
var server = app.listen(3000, function () {

        var host = server.address().address
        var port = server.address().port

      console.log('Example app listening at http://%s:%s', host, port)
})

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

      socket.on('heartbeat',function(data){
            if(data.cpu > 200 && data.Name == 'canary')
              {
                servers = [GREEN]
              }
      });

})
