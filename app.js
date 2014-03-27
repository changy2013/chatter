//================================================================================================= LE APP

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

//================================================================================================= MONGODB

var Server = require('mongodb').Server;
var Db = require('mongodb').Db;
var User = require('./models/user');
var Message = require('./models/message');
var Title = require('./models/title');

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

var htmlTagPattern = /<[\/\!]*?[^<>]*?>/gi;
var users = {};

io.sockets.on('connection', function(socket) {

  users[socket.handshake.session.passport.user.id] = {
    name: socket.handshake.session.passport.user.name,
    pic: socket.handshake.session.passport.user.pic,
    date: new Date(),
  }

  io.sockets.emit('users', users);

  Message.latest(function(err, items) {
    if (err) { return console.error('Error fetching latest messages:', err); }
    for (var i = 0; i < items.length; i++) {
      socket.emit('message', items[items.length - 1 - i]);
    }
    socket.emit('system-message', { text: 'Fetched latest messages sent to the room' });
  });

  Title.latest(function(err, items) {
    if (err) { return console.error('Error fetching latest title:', err); }
    if (items[0]) {
      socket.emit('title', items[0]);
    }
  });

  socket.broadcast.emit('system-message', { text: socket.handshake.session.passport.user.name + ' connected' });

  socket.on('disconnect', function() {
    delete users[socket.handshake.session.passport.user.id];
    io.sockets.emit('users', users);
    io.sockets.emit('system-message', { text: socket.handshake.session.passport.user.name + ' disconnected' });
  });

  socket.on('message', function(data) {
    var message = {
      user: socket.handshake.session.passport.user,
      date: new Date(),
      text: data.replace(htmlTagPattern, ''),
    };
    Message.insert(message, function(err, result) {
      if (err) { return console.error('Error inserting message:', err); }
    });
    io.sockets.emit('message', message);
  });

  socket.on('title', function(data) {
    var title = {
      user: socket.handshake.session.passport.user,
      date: new Date(),
      text: data.replace(htmlTagPattern, ''),
    };
    Title.insert(title, function(err, result) {
      if (err) { return console.error('Error inserting title:', err); }
    });
    io.sockets.emit('title', title);
    io.sockets.emit('system-message', { text: socket.handshake.session.passport.user.name + ' changed chat title' });
  });

  socket.on('ping', function(data) {
    users[socket.handshake.session.passport.user.id].date = new Date();
    if (data) {
      if (data.triggerUpdate) {
        io.sockets.emit('users', users);
      }
    }
  });

  socket.on('location', function(data) {
    users[socket.handshake.session.passport.user.id].location = data.location;
    io.sockets.emit('users', users);
  });

  setInterval(function() {
    io.sockets.emit('users', users);
  }, config.app.usersUpdateInterval);

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
app.get('/users', ensureAuthenticated, routes.users);
app.get('/whitelist/:id', ensureAuthenticated, routes.whitelist);
app.get('/blacklist/:id', ensureAuthenticated, routes.blacklist);

//================================================================================================= START APP

var db = new Db(config.mongodb.database,
                new Server(config.mongodb.host, config.mongodb.port),
                {native_parser: true, w: 1});
db.open(function(err, db) {
  if (err) { throw err; }
  User.init(db);
  Message.init(db);
  Title.init(db);
  server.listen(app.get('port'), function() {
    console.log('chatter listening on port ' + app.get('port'));
  });
});

//================================================================================================= END