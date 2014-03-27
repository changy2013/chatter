var User = require('./models/user');

exports.index = function(req, res){
  res.render('index', {
    user: req.user,
    partials: {
      header: '_header',
      navbar: '_navbar',
      footer: '_footer',
    },
  });
};

exports.login = function(req, res){
  res.render('login', {
    partials: {
      header: '_header',
      footer: '_footer',
    },
  });
};

exports.notWhitelisted = function(req, res){
  res.render('not-whitelisted', {
    partials: {
      header: '_header',
      footer: '_footer',
    },
  });
};

exports.users = function(req, res){
  User.all(function(err, users) {
    res.render('users', {
      partials: {
        header: '_header',
        footer: '_footer',
      },
      users: users,
      message: err || req.session.messages,
    });
    req.session.messages = null;
  });
};

exports.whitelist = function(req, res){
  var id = req.params.id;
  var author = req.user;
  User.whitelist(id, author, function() {
    req.session.messages = 'The user has been whitelisted';
    res.redirect('/users');
  });
};

exports.blacklist = function(req, res){
  var id = req.params.id;
  var author = req.user;
  User.blacklist(id, author, function() {
    req.session.messages = 'The user has been blacklisted';
    res.redirect('/users');
  });
};