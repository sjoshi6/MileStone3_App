var express = require('express')
var redis = require('redis')
var fs      = require('fs')
var bodyParser = require("body-parser");

var app = express()
app.use(bodyParser.urlencoded({ extended: false }));
var args = process.argv.slice(2);
var PORT = args[0];


// REDIS
var client = redis.createClient(7777, '127.0.0.1', {})


//SERVER
var server = app.listen(PORT, function () {

	var host = server.address().address
	var port = server.address().port

	console.log('Example app listening at http://%s:%s', host, port)
});


//ROUTES
app.get('/', function(req, res)
{

	fs.readFile('front_page.html',function (err, data){
		res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
		res.write(data);
		res.end();
	});

});

app.get('/signup',function(req,res){

	fs.readFile('signup.html',function (err, data){
		res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
		res.write(data);
		res.end();
	});

});

app.post('/record',function(req,res){

	var id=req.body.login;
	var pass = req.body.pass;

	client.set(String(id),String(pass));

	fs.readFile('record.html',function (err, data){
		res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
		res.write(data);
		res.end()
	});

});

app.get('/login',function(req,res){

	fs.readFile('login.html',function (err, data){
		res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
		res.write(data);
		res.end();
	});

});

app.post('/check_user',function(req,res){

		var id=req.body.login;
		var pass=req.body.pass;

		client.get(id,function(err,value){

						if(pass == value)
						{
									fs.readFile('confirmed.html',function (err, data){
												res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
												res.write(data);
												res.end()
									});
						}
						else
						{
									fs.readFile('incorrect.html',function (err, data){
												res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
												res.write(data);
												res.end()
									});
						}


		})

	});
