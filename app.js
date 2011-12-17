/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();
var uuid = require('node-uuid');
var usersDB = require('dirty')( __dirname + '/data/users.db' );
var sessionsDB = require('dirty')( __dirname + '/data/sessions.db' );
var md5 = require('node_hash').md5;
var io = require('socket.io');
var _ = require('underscore');
var sessions = {};
//msql
var Client = require('mysql').Client,
    sqlclient = new Client(),
    sql_database = 'math_VT08DB012';
sqlclient.host = 'mathcoach.net';
sqlclient.user = 'math_henry';
sqlclient.password = 'CLEA29100';
//sqlclient.connect( function () {
//  console.log('connected to msql on mathcoach.net');
//});
//dirty drain
usersDB.on('drain', function () {
  console.log('All users are saved on disk now.');
});
sessionsDB.on('drain', function () {
  console.log('All sessions are saved on disk now.');
});
// Configuration
app.configure( function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function () {
  app.use(express.errorHandler()); 
});
// Routes
app.get('/:id?', function (req, res, next) {
  if(req.params.id) {
    if(req.params.id === 'menu') {
      res.render('menu', {
        layout: false,
        title: req.params.id
      });
    }
    else {
      res.render('index', {
        layout: false,
        title: req.params.id,
        login: 'login'
      });
    }
  }
  else {
    res.render('index', {
      title: 'MathCoach Interactive 4! test',
      login: 'login'
    });
  }
});
// Only listen on $ node app.js
if (!module.parent) {
  app.listen(3333);
  console.log("Express server listening on port %d", app.address().port);
}
//load up dirtydb
sessionsDB.on('load', function() {
  sessionsDB.forEach(function(key, val) {
    sessions[key] = val;
  });
  var count = 0;
  var socket = io.listen(app); 
  function login (client,user) {
    var factfamarray;
    client.send({type:'login',success:true,user:user,sid:sessions[user].sid});
    client.broadcast({type:'user',user:user,add:true});
    if(!sessions[user].client) {
      client.broadcast({type:'notice',message:user + ' has logged in!'});
    }
    client.user = user;
    if(client.factfam) {
      if(usersDB.get(client.user+'factfam')) {
        factfamarray = usersDB.get(client.user+'factfam');
      }
      else {
        factfamarray = [];
      }
      var catfactfamarray = factfamarray.concat(client.factfam);
      delete client.factfam;
      usersDB.set(client.user+'factfam', catfactfamarray);
    }
  }
  function logout(client) {
    client.broadcast({type:'notice',message:client.user + ' has logged out!'});
    client.broadcast({type:'user',user:client.user,add:false});
    delete client.user;
    delete client.factfam;
  }
  //fire up the socket
  socket.on('connection', function (client) { 
    client.send({type:'notice',message:'zomg1111'});
    for(var user in sessions) {
      if(sessions[user] && sessions[user].client)
        client.send({type:'user',user:user,add:true});
    }
    client.on('message',function(msg){
      console.log(msg);
      //message handling
      if(msg.type === 'logout') {
        delete sessions[client.user];
        sessionsDB.rm(client.user,function(){
          logout(client);
        });
      }
      if(msg.type === 'login' && msg.user && msg.password) {
        sqlclient.query('USE '+sql_database);
        sqlclient.query( "SELECT `id`,`full_name`,`approved` " +
          "FROM users WHERE user_name='" + msg.user + "' AND `pwd` = '" + md5(msg.password) + "' AND `banned` = '0'",
          function selectCb(err, results, fields) {
            if (err) {
              throw err;
            }
            console.log(results);
            //console.log(fields);
            if( results.length ) {
              if(sessions[msg.user] === undefined || sessions[msg.user].client === undefined) {
                sessions[msg.user] = results[0];
                if(msg.rememberme) {
                  sessions[msg.user].sid = uuid();
                }
                sessionsDB.set(msg.user,sessions[msg.user], function () {
                  login(client,msg.user);
                  sessions[msg.user].client = client;
                });
              }
              else {
                sessions[msg.user].client.send({type:'logout'});
                delete sessions[msg.user].client.user;
                if(msg.rememberme) {
                  sessions[msg.user].sid = uuid();
                }
                login(client,msg.user);
                sessions[msg.user].client = client;
              }
            }
            else {
              client.send({type: 'warning', message: 'Incorrect username or password.'});
            }
            //sqlclient.end();
          }
        );
      }
      else if(msg.type == 'login' && msg.user && msg.sid) {
        if(sessions[msg.user] && sessions[msg.user].sid == msg.sid) {
          if(sessions[msg.user].client) {
            sessions[msg.user].client.send({type:'logout'});
            sessions[msg.user].client.send({type:'notice',message:msg.user + ' has logged in!'});
            delete sessions[msg.user].client.user;
          }
          sessions[msg.user].client = client;
          login(client,msg.user);
        }
        else {
          client.send({type:'login',success:false,message:'session expired'});
        }
      }
      if(msg.type == 'ping'  && sessions[msg.user] && sessions[msg.user].client) { 
        var name = ( client.user || 'Guest' ) + '';
        sessions[msg.user].client.send({type:'notice',message: name + ' has pinged you!'});
        sessions[msg.user].client.send({type:'load',url:'/' + name.replace(/\s*/g,'')});
      }
      if(msg.type == 'boxstart') {
        msg.user = client.user || 'guest';
        client.broadcast(msg);
      }
      if(msg.type === 'boxmove' || msg.type === 'boxup') {
        client.broadcast(msg);
      }
      if(msg.type == 'factfam') {
        (function(){
          var mydate = new Date();
          msg.date = mydate.getTime();
          if(!client.factfam) {
            client.factfam = [];
          }
          if(client.user) {
            var factfamarray;
            if(usersDB.get(client.user+'factfam')) {
              factfamarray = usersDB.get(client.user+'factfam');
            }
            else {
              factfamarray = [];
            }
            factfamarray.push(msg);
            usersDB.set(client.user+'factfam', factfamarray);
          }
          else {
            client.factfam.push(msg);
          }
        })();
      }
      if(msg.type == 'factfamreport') {
        (function(){
          var factfamarray;
          if(!client.factfam) {
            client.factfam = [];
          }
          if(client.user) {
            factfamarray = usersDB.get(client.user+'factfam').concat(client.factfam);
          }
          else {
            factfamarray = client.factfam;
          }
          var mytime = (new Date()).getTime();
          console.log(mytime);
          factfamarray = _.select( factfamarray, function( fact ) {
            console.log(fact.date);
            return fact.date + 1000 * 60 * 5  > mytime;
          });
          console.log(factfamarray);
          var correct = 0;
          var incorrect = 0;
          var total = factfamarray.length;
          for(var j = 0; j < total; j++) {
            if(factfamarray[j].correct)
              correct++;
            else
              incorrect++;
          }
          var agent = client.user? client.user + "'s": 'Your';
          client.send({
            type:'report',
            activity:'Fact Families',
            correct:correct,
            incorrect:incorrect,
            total:total,
            dataarray:factfamarray,
            headers:[
              {key:'difficulty',value:'Difficulty'},
              {key:'nine',value:'Problem'},
              {key:'value',value:'Correct<br>Answer'},
              {key:'current',value:agent+'<br>Answer'}
              ]
          });
        })();
      }
    });
    client.on('disconnect', function(){
      if(client.user) {
        delete sessions[client.user].client;
        sessions[client.user].lastactive = new Date();
        logout(client);
      }
    }); 
  });
  var cleanUpSessions  = setInterval(function(){
    console.log('clean up');
    //clean it up!
    sqlclient.ping(function(err) {
      if(err) {
        throw err;
      }
    });
    //console.log(sessions);
    var myDate = new Date();
    for(var user in sessions) {
      if(sessions[user] && !sessions[user].client && sessions[user].lastactive && myDate.getTime() > sessions[user].lastactive.getTime() + 360000) {
        delete sessions[user];
        sessionsDB.rm(user);
      }
    }
  },180000);
});
