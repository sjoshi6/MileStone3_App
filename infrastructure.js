var http      = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis')

var client = redis.createClient(6379, '127.0.0.1', {})
var GREEN = 'http://54.191.53.19:8181';
var BLUE  = 'http://54.186.100.220:8181';

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
        if(counter%2==0)
        {
        TARGET= BLUE;
        }
        else
        {
        TARGET = GREEN;
        }
        counter++;
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

