//================================================================================================= GLOBALS

// commands that do not render the user's message
var specialCommands = ['/meme'];

// split by space preserving quoted values
var quotedWordsPattern = /(?:[^\s"]+|"[^"]*")+/g;
var urlPattern = /(http[s]?:\/\/\S+)/gi;
var newlinePattern = /\n/g;

// group messages from the same user for x milliseconds
var groupMessageInterval = 60 * 1000;
// (number of 'W's that fit in the navbar at a screen width of 768) * 2 - 10
var titleMaxLength = 72;

var smileys = [
  { code: '\[..\]', url: '/smileys/transformer.gif' },
  { code: ':BZ', url: '/smileys/115.gif' },
  { code: ':bZ', url: '/smileys/115.gif' },
  { code: ':Bz', url: '/smileys/115.gif' },
  { code: ':bz', url: '/smileys/115.gif' },
  { code: '\^#(^', url: '/smileys/114.gif' },
  { code: ':-Bd', url: '/smileys/113.gif' },
  { code: ':-bD', url: '/smileys/113.gif' },
  { code: ':-bd', url: '/smileys/113.gif' },
  { code: ':-BD', url: '/smileys/113.gif' },
  { code: ':-q', url: '/smileys/112.gif' },
  { code: ':-Q', url: '/smileys/112.gif' },
  { code: '\\m\/', url: '/smileys/111.gif' },
  { code: '\\M\/', url: '/smileys/111.gif' },
  { code: ':!!', url: '/smileys/110.gif' },
  { code: 'x_x', url: '/smileys/109.gif' },
  { code: 'X_x', url: '/smileys/109.gif' },
  { code: 'x_x', url: '/smileys/109.gif' },
  { code: 'X_X', url: '/smileys/109.gif' },
  { code: ':o3', url: '/smileys/108.gif' },
  { code: ':O3', url: '/smileys/108.gif' },
  { code: '%-(', url: '/smileys/107.gif' },
  { code: ':-??', url: '/smileys/106.gif' },
  { code: '8->', url: '/smileys/105.gif' },
  { code: ':-t', url: '/smileys/104.gif' },
  { code: ':-T', url: '/smileys/104.gif' },
  { code: ':-h', url: '/smileys/103.gif' },
  { code: ':-H', url: '/smileys/103.gif' },
  { code: '~x(', url: '/smileys/102.gif' },
  { code: '~X(', url: '/smileys/102.gif' },
  { code: ':-c', url: '/smileys/101.gif' },
  { code: ':-C', url: '/smileys/101.gif' },
  { code: ':)\]', url: '/smileys/100.gif' },
  { code: '(\*)', url: '/smileys/79.gif' },
  { code: ':-j', url: '/smileys/78.gif' },
  { code: ':-J', url: '/smileys/78.gif' },
  { code: '\^:)^', url: '/smileys/77.gif' },
  { code: ':-@', url: '/smileys/76.gif' },
  { code: '(%)', url: '/smileys/75.gif' },
  { code: ';))', url: '/smileys/71.gif' },
  { code: '>:\/', url: '/smileys/70.gif' },
  { code: '\\:d\/', url: '/smileys/69.gif' },
  { code: '\\:D\/', url: '/smileys/69.gif' },
  { code: '\[-x', url: '/smileys/68.gif' },
  { code: '\[-X', url: '/smileys/68.gif' },
  { code: ':)>-', url: '/smileys/67.gif' },
  { code: 'b-(', url: '/smileys/66.gif' },
  { code: 'B-(', url: '/smileys/66.gif' },
  { code: ':-"', url: '/smileys/65.gif' },
  { code: '$-)', url: '/smileys/64.gif' },
  { code: '\[-o<', url: '/smileys/63.gif' },
  { code: '\[-O<', url: '/smileys/63.gif' },
  { code: ':-l', url: '/smileys/62.gif' },
  { code: ':-L', url: '/smileys/62.gif' },
  { code: '>-)', url: '/smileys/61.gif' },
  { code: '=:)', url: '/smileys/60.gif' },
  { code: '8-x', url: '/smileys/59.gif' },
  { code: '8-X', url: '/smileys/59.gif' },
  { code: '\*-:)', url: '/smileys/58.gif' },
  { code: '~o)', url: '/smileys/57.gif' },
  { code: '~O)', url: '/smileys/57.gif' },
  { code: '(~~)', url: '/smileys/56.gif' },
  { code: '\*\*==', url: '/smileys/55.gif' },
  { code: '%%-', url: '/smileys/54.gif' },
  { code: '@};', url: '/smileys/53.gif' },
  { code: '~:>', url: '/smileys/52.gif' },
  { code: ':(|)', url: '/smileys/51.gif' },
  { code: '3:-o', url: '/smileys/50.gif' },
  { code: '3:-O', url: '/smileys/50.gif' },
  { code: ':@)', url: '/smileys/49.gif' },
  { code: '<):)', url: '/smileys/48.gif' },
  { code: '>:p', url: '/smileys/47.gif' },
  { code: '>:P', url: '/smileys/47.gif' },
  { code: ':-<', url: '/smileys/46.gif' },
  { code: ':-w', url: '/smileys/45.gif' },
  { code: ':-W', url: '/smileys/45.gif' },
  { code: ':^o', url: '/smileys/44.gif' },
  { code: ':^O', url: '/smileys/44.gif' },
  { code: '@-)', url: '/smileys/43.gif' },
  { code: ':-sS', url: '/smileys/42.gif' },
  { code: ':-Ss', url: '/smileys/42.gif' },
  { code: ':-ss', url: '/smileys/42.gif' },
  { code: ':-SS', url: '/smileys/42.gif' },
  { code: '=d>', url: '/smileys/41.gif' },
  { code: '=D>', url: '/smileys/41.gif' },
  { code: '#-o', url: '/smileys/40.gif' },
  { code: '#-O', url: '/smileys/40.gif' },
  { code: ':-?', url: '/smileys/39.gif' },
  { code: '=p~', url: '/smileys/38.gif' },
  { code: '=P~', url: '/smileys/38.gif' },
  { code: '(:|', url: '/smileys/37.gif' },
  { code: '<:-p', url: '/smileys/36.gif' },
  { code: '<:-P', url: '/smileys/36.gif' },
  { code: '8-}', url: '/smileys/35.gif' },
  { code: ':o)', url: '/smileys/34.gif' },
  { code: ':O)', url: '/smileys/34.gif' },
  { code: '\[-(', url: '/smileys/33.gif' },
  { code: ':-\$', url: '/smileys/32.gif' },
  { code: ':-&', url: '/smileys/31.gif' },
  { code: 'l-)', url: '/smileys/30.gif' },
  { code: 'L-)', url: '/smileys/30.gif' },
  { code: '8-|', url: '/smileys/29.gif' },
  { code: 'i-)', url: '/smileys/28.gif' },
  { code: 'I-)', url: '/smileys/28.gif' },
  { code: '=,', url: '/smileys/27.gif' },
  { code: ':-b', url: '/smileys/26.gif' },
  { code: ':-B', url: '/smileys/26.gif' },
  { code: 'o:)', url: '/smileys/25.gif' },
  { code: 'O:)', url: '/smileys/25.gif' },
  { code: 'o:-)', url: '/smileys/25.gif' },
  { code: 'O:-)', url: '/smileys/25.gif' },
  { code: '=))', url: '/smileys/24.gif' },
  { code: '\/:)', url: '/smileys/23.gif' },
  { code: ':|', url: '/smileys/22.gif' },
  { code: ':))', url: '/smileys/21.gif' },
  { code: ':((', url: '/smileys/20.gif' },
  { code: '>:)', url: '/smileys/19.gif' },
  { code: '#:-s', url: '/smileys/18.gif' },
  { code: '#:-S', url: '/smileys/18.gif' },
  { code: ':-s', url: '/smileys/17.gif' },
  { code: ':-S', url: '/smileys/17.gif' },
  { code: 'b-)', url: '/smileys/16.gif' },
  { code: 'B-)', url: '/smileys/16.gif' },
  { code: ':>', url: '/smileys/15.gif' },
  { code: ':->', url: '/smileys/15.gif' },
  { code: 'x-(', url: '/smileys/14.gif' },
  { code: 'X-(', url: '/smileys/14.gif' },
  { code: 'x(', url: '/smileys/14.gif' },
  { code: 'X(', url: '/smileys/14.gif' },
  { code: ':o', url: '/smileys/13.gif' },
  { code: ':O', url: '/smileys/13.gif' },
  { code: ':-o', url: '/smileys/13.gif' },
  { code: ':-O', url: '/smileys/13.gif' },
  { code: '=((', url: '/smileys/12.gif' },
  { code: ':\*', url: '/smileys/11.gif' },
  { code: ':-\*', url: '/smileys/11.gif' },
  { code: ':-p', url: '/smileys/10.gif' },
  { code: ':-P', url: '/smileys/10.gif' },
  { code: ':p', url: '/smileys/10.gif' },
  { code: ':P', url: '/smileys/10.gif' },
  { code: ':">', url: '/smileys/9.gif' },
  { code: ':-x', url: '/smileys/8.gif' },
  { code: ':-X', url: '/smileys/8.gif' },
  { code: ':x', url: '/smileys/8.gif' },
  { code: ':X', url: '/smileys/8.gif' },
  { code: ':-\/', url: '/smileys/7.gif' },
  { code: '>:d<', url: '/smileys/6.gif' },
  { code: '>:D<', url: '/smileys/6.gif' },
  { code: ';;)', url: '/smileys/5.gif' },
  { code: ':-d', url: '/smileys/4.gif' },
  { code: ':-D', url: '/smileys/4.gif' },
  { code: ':d', url: '/smileys/4.gif' },
  { code: ':D', url: '/smileys/4.gif' },
  { code: ';-)', url: '/smileys/3.gif' },
  { code: ';)', url: '/smileys/3.gif' },
  { code: ':-(', url: '/smileys/2.gif' },
  { code: ':(', url: '/smileys/2.gif' },
  { code: ':-)', url: '/smileys/1.gif' },
  { code: ':)', url: '/smileys/1.gif' },
];

//================================================================================================= TEMPLATES

var systemMessageTemplate = Handlebars.compile('\
  <div class="system-message">{{text}}</div>\
');

var messageContainerTemplate = Handlebars.compile('\
  <div class="message" data-user-id="{{user.id}}" data-timestamp="{{timestamp}}">\
    <div class="header">\
      <img src="{{user.pic}}">\
      <strong>{{user.name}}</strong>\
      <small>{{date}}</small>\
    </div>\
    <div class="text">\
      {{{text}}}\
    </div>\
  </div>\
');

var messageTemplate = Handlebars.compile('\
  <p>{{{text}}}</p>\
');

var quoteTemplate = Handlebars.compile('\
  <blockquote>\
    <p>{{{text}}}</p>\
  </blockquote>\
');

var smileyTemplate = Handlebars.compile('\
  <img class="smiley" src="{{url}}" title="{{code}}">\
');

var picsTemplate = Handlebars.compile('\
  <div class="media">\
    <div>\
      {{#each pics}}\
        <a href="{{this}}" target="_blank"><img src="{{this}}"\
          onerror="$(this).parent().parent().parent().remove();"\
        ></a>\
      {{/each}}\
    </div>\
    <span class="glyphicon glyphicon-remove close"></span>\
  </div>\
');

var memeTemplate = Handlebars.compile('\
  <div class="media">\
    <div class="meme">\
      <div class="top">{{top}}</div>\
      <div class="bottom">{{bottom}}</div>\
      <img src="{{pic}}"\
        onload="var width = $(this).width(); $(this).parent().parent().find(\'div\').width(width);"\
        onerror="$(this).parent().parent().hide(\'normal\');"\
      >\
    </div>\
    <span class="glyphicon glyphicon-remove close"></span>\
  </div>\
');

//================================================================================================= END