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

io.configure(function() {
  io.set('authorization', function(handshakeData, callback) {
    if (handshakeData.headers.cookie) {
      cookieParser(handshakeData, {}, function(err) {
        if (err) { return console.error('Error parsing cookie:', err); }
        handshakeData.sessionID = handshakeData.signedCookies['app.sid'];
        sessionStore.get(handshakeData.sessionID, function(err, session) {
          if (err) {
            callback('Error retrieving session data', false);
          } else if (!session) {
            callback('No session data found', false);
          } else {
            handshakeData.session = session;
            if (handshakeData.session.passport.user) {
              callback(null, true);
            } else {
              callback('Unauthenticated user attempting to connect', false);
            }
          }
        });
      });
    } else {
      callback('No cookie received', false);
    }
  });
});

io.sockets.on('connection', function(socket) {

  io.sockets.emit('system-message', { text: socket.handshake.session.passport.user.name + ' connected' });

  socket.on('disconnect', function() {
    io.sockets.emit('system-message', { text: socket.handshake.session.passport.user.name + ' disconnected' });
  });

  socket.on('message', function(data) {
    var message = {
      user: {
        id: socket.handshake.session.passport.user.id,
        name: socket.handshake.session.passport.user.name,
      },
      timestamp: new Date(),
      // TODO: pls sanitize this i.e. script tags
      text: data,
    };
    io.sockets.emit('message', message);
    // TODO: save message to mongoDB
  });

});

//================================================================================================= CONFIG

var config = require('./config');
var sessionStore = new express.session.MemoryStore();
var cookieParser = express.cookieParser(config.app.secret);
app.set('port', config.app.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(cookieParser);
app.use(express.session({ key: 'app.sid', store: sessionStore }));
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
    console.log('chatter listening on port ' + app.get('port'));
  });
});

//================================================================================================= END