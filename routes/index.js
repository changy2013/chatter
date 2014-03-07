
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
    partials: {
      header: '_header',
      navbar: '_navbar',
      footer: '_footer',
    },
  });
};