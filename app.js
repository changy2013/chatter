//================================================================================================= LE APP

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

//================================================================================================= MONGODB

var Server = require('mongodb').Server;
var Db = require('mongodb').Db;
var User = require('./models/user');

//================================================================================================= PASSPORT

var passport = require('./auth').passport;
var ensureAuthenticated = require('./auth').ensureAuthenticated;

//================================================================================================= EXPRESS

var app = express();

//================================================================================================= SOCKET.IO

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

//================================================================================================= CONFIG

var config = require('./config');
app.set('port', config.app.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//================================================================================================= ROUTES

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/not-whitelisted'
}));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/', ensureAuthenticated, routes.index);
app.get('/login', routes.login);
app.get('/not-whitelisted', routes.notWhitelisted);

//================================================================================================= START APP

var db = new Db(config.mongodb.database,
                new Server(config.mongodb.host, config.mongodb.port),
                {native_parser: true, w: 1});
db.open(function(err, db) {
  if (err) { throw err; }
  User.init(db);
  server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
  });
});

//================================================================================================= END