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

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

//================================================================================================= CONFIG + APP

var config = require('./config');
var app = express();

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

//================================================================================================= MONGODB + PASSPORT

var db = new Db(config.mongodb.database,
                new Server(config.mongodb.host, config.mongodb.port),
                {native_parser: true, w: 1});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.find(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new FacebookStrategy({
    clientID: config.facebook.appId,
    clientSecret: config.facebook.appSecret,
    callbackURL: config.app.host +
                  ':' + Number(config.app.port).toString() +
                  '/auth/facebook/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    User.find(profile.id, function(err, user) {
      if (err) { return done(err); }
      if (user !== null) {
        if (user.whitelisted) {
          done(null, user);
        } else {
          done(null, false);
        }
      } else {
        User.count(function(err, count) {
          if (err) { return done(err); }
          var user = {
            id: profile.id,
            name: profile.displayName,
            whitelisted: false,
          };
          if (count === 0) {
            user.whitelisted = true;
            user.whitelistedBy = 'God';
            User.insert(user, function(err, result) {
              if (err) { return done(err); }
              done(null, result[0]);
            });
          } else {
            User.insert(user, function(err, result) {
              if (err) { return done(err); }
              done(null, false);
            });
          }
        });
      }
    });
  }
));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

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

db.open(function(err, db) {
  if (err) { throw err; }
  User.init(db);
  http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
  });
});

//================================================================================================= END