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

//	var id=req.body.login;
	var pass = req.body.pass;
	var randomnum = req.body.randomnum;
	var expire = req.body.expire

	var time = new Date();
  var time_ms= time.getTime(time);

	randomnum = randomnum + String(time_ms)

//	client.set(String(id),String(pass));
	client.set(String(randomnum),String(pass));
//	client.expire(String(id),parseInt(expire));
	client.expire(String(randomnum),parseInt(expire));

	fs.readFile('secretlink.html',function (err, data){
	  var data = data.toString()
		var result = data.replace("SecretLinkToBeReplaced", "SharePass"+String(randomnum));
		result = result.replace("Expire_Time_Replace_Holder",expire)
		res.writeHead(200, {'Content-Type': 'text/html','Content-Length':result.length});
		res.write(result);
		res.end()
	});

});


app.get(/SharePass.*/,function(req,res){

	var url = req.url
	url = url.toString()
	url=url.replace("/SharePass","")
	console.log(url)

	client.get(url,function(err,value){

			if(value == null)
			{
						fs.readFile('nopass.html',function (err, pagedata){
						res.writeHead(200, {'Content-Type': 'text/html','Content-Length':pagedata.length});
						res.write(pagedata);
						res.end();
						})

			}
			else
			{
						client.del(url)
						fs.readFile('secretpass.html',function (err, pagedata){
						pagedata=pagedata.toString()
						pagedata=pagedata.replace("Shared_Password_Replace",value)
						res.writeHead(200, {'Content-Type': 'text/html','Content-Length':pagedata.length});
						res.write(pagedata);
						res.end();
						})

			}
	})

});

app.get('/')

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
