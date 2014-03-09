var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var User = require('./models/user');
var config = require('./config');

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

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.find(id, function(err, user) {
    done(err, user);
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

exports.passport = passport;
exports.ensureAuthenticated = ensureAuthenticated;