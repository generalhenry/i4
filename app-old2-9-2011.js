
var stylus = require('stylus'), fs = require('fs'),
  str = fs.readFileSync(__dirname + '/stylus/test.styl', 'utf8');

  stylus(str)
    .set('filename', __dirname + '/public/test.css')
    .set('paths', [__dirname, __dirname + '/stylus'])
    .import('stylus/MCi')
    .import('stylus/Boiler')
    .import('stylus/css3')
    .render(function(err, css){
      if (err) throw err;
      console.log(css);
      fs.writeFile(__dirname + '/public/stylesheets/test.css', css, function (err) {
        if (err) throw err;
        console.log('It\'s saved!');
      });
    });

/**
 * Module dependencies.
 */

var express = require('express');
//var sws = require('SessionWebSocket')();
//var auth= require('connect-auth');
var connect= require('connect');
//var MyFirstFormStrategy= require('./myFirstFormStrategy');

//fb
var fbId= "110316279042631";
var fbSecret= "1606c395a271624422a08aab775cc2e6";
var fbCallbackAddress= "http://74.207.253.119:3333/signin"

var sessions = {};

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyDecoder());
  app.use(express.cookieDecoder());
  app.use(express.session({'secret':'keyboard cat'}));
  /*app.use(auth( [
    auth.Facebook({appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress}),
  ]) );*/
  //app.use(auth( MyFirstFormStrategy() ));
  //app.use(sws.http);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res, next){
    if(!req.cookies['myuuid'])
    {
       var myUUID = randomUUID();
       console.log(req.cookies);
    }
    else
    {
	var myUUID = req.cookies['myuuid'];
    }
    res.cookie('myuuid', myUUID, { expires: new Date(Date.now() + 9000000)});
    if(!sessions[myUUID])
      var session = sessions[myUUID] = {};
    else
      var session = sessions[myUUID]
    session.visitCount = session.visitCount ? session.visitCount + 1 : 1; 
    console.log('get: ' + JSON.stringify(session));
    res.render('index', {
      locals: {
        title: 'Fact Families',
        login: session.user ? 'Log out' : 'Log in'
      }
    });
    next();
});

app.get('/test', function(req, res){
  req.session.visitCount = req.session.visitCount ? req.session.visitCount + 1 : 1; 
  socket.broadcast('test');
  res.render('index', {
    locals: {
      title: 'Fact Families',
      login: 'Log in'//req.isAuthenticated()? 'Log out' : 'Log in'
    }
  });
});

// Method to handle a sign-in with a specified method type, and a url to go back to ...
app.get('/signin', function(req,res) {
  req.authenticate([req.param('method')], function(error, authenticated) { 
    console.log("err: " + error);
    console.log("auth: " + authenticated);
    // You might be able to get away with the referrer here... 
    res.redirect(req.session.redirect)
   });
});

// Route for some arbirtrary page, that contains a sign-in link
app.get('/somepage', function(req, res){
  var sign_in_link= "/signin?method=facebook&redirectUrl=" + escape(req.url);
  req.session.redirect = req.url;
  if( req.isAuthenticated() ) {
    console.log('yatta');
    res.send('<html><body><h1>Signed in with Facebook</h1></body></html>')
  }
  else {
    res.send('<html><body><a href="'+ sign_in_link + '">Sign in with Facebook</a></body></html>')
  }
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3333);
  console.log("Express server listening on port %d", app.address().port)
}

var io = require('socket.io');
require('socket.io-connect');

var socket = io.listen(app); 
socket.on('connection', socket.prefixWithMiddleware( function (client, req, res) { 
  var myUUID = req.cookies['myuuid'];
  if(!sessions[myUUID])
    {
      var session = sessions[myUUID] = {};
      console.log('reset :(');
    }
  else
    var session = sessions[myUUID]
  console.log('socket.session: ' + JSON.stringify(session));
  client.send('Visit Count: ' + (session && session.visitCount || 0));
  client.on('message',function(msg){
    console.log(msg);
    if(msg.message && msg.message == 'logout')
    {
       console.log(session.user + ' has logged out!');
       client.broadcast(session.user + ' has logged out!');
       sessions[myUUID] = {};
       console.log(sessions);
    }
    if(msg.message && msg.message == 'login' && msg.user)
    {
       console.log(msg.user + ' has logged in!');
       client.broadcast(msg.user + ' has logged in!');
       sessions[myUUID].user = msg.user;
    }
  });
}));

/* randomUUID.js - Version 1.0
*
* Copyright 2008, Robert Kieffer
*
* This software is made available under the terms of the Open Software License
* v3.0 (available here: http://www.opensource.org/licenses/osl-3.0.php )
*
* The latest version of this file can be found at:
* http://www.broofa.com/Tools/randomUUID.js
*
* For more information, or to comment on this, please go to:
* http://www.broofa.com/blog/?p=151
*/
 
/**
* Create and return a "version 4" RFC-4122 UUID string.
*/
function randomUUID() {
  var s = [], itoh = '0123456789ABCDEF';
 
  // Make array of random hex digits. The UUID only has 32 digits in it, but we
  // allocate an extra items to make room for the '-'s we'll be inserting.
  for (var i = 0; i <36; i++) s[i] = Math.floor(Math.random()*0x10);
 
  // Conform to RFC-4122, section 4.4
  s[14] = 4;  // Set 4 high bits of time_high field to version
  s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence
 
  // Convert to hex chars
  for (var i = 0; i <36; i++) s[i] = itoh[s[i]];
 
  // Insert '-'s
  s[8] = s[13] = s[18] = s[23] = '-';
 
  return s.join('');
}

