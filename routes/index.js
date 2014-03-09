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