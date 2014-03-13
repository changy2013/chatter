//================================================================================================= SECTION

function cssSupport(property, value) {
  var div = $('<div></div>');
  div.css(property, value);
  if (div.attr('style').indexOf(value) != -1) {
    return true;
  }
  return false;
}

if (!cssSupport('height', 'calc(25px)')) {
  $('#message-container').height($('body').height() - 75);
  $(window).resize(function() {
    $('#message-container').height($('body').height() - 75);
  });
  console.log('CSS calc not supported, using JavaScript fallback.');
}

$(document).on('click', '.media .close', function() {
  $(this).parent().hide('normal');
});


//================================================================================================= SECTION













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
        onload="var width = $(this).width(); $(this).parent().width(width); $(this).parent().find(\'div\').width(width);"\
        onerror="$(this).parent().parent().hide(\'normal\')"\
      >\
    </div>\
    <span class="glyphicon glyphicon-remove close"></span>\
  </div>\
');







var socket = io.connect('/');

var messageContainer = $('#message-container');
var messageInput = $('#message-input');
var currentUser = $('#current-user');

var windowHasFocus = true;
var windowTitle = document.title;
var unreadMessageCount = 0;


var quotedWordsPattern = /(?:[^\s"]+|"[^"]*")+/g;
var urlPattern = /(http[s]?:\/\/\S+)/gi;
var newlinePattern = /\n/g;

// group messages from the same users for number o millisecs
var groupMessageInterval = 10 * 1000;




messageInput.focus();
$(window).focus(function() {
  windowHasFocus = true;
  document.title = windowTitle;
  messageInput.focus();
  unreadMessageCount = 0;
});
$(window).blur(function() {
  windowHasFocus = false;
});



function scroll() {
  if (windowHasFocus) {
    messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
  } else {
    unreadMessageCount += 1;
    document.title = '(' + unreadMessageCount + ') ' + windowTitle;
  }
}


function stripQuotes(str) {
  if (str[0] == '"') {
    str = str.substring(1);
  }
  if (str[str.length - 1] == '"') {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

function urlify(text) {
  return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

function smileyfy(text) {
  for (var i = 0; i < smileys.length; i++) {
    var pos = text.indexOf(smileys[i].code);
    if (pos != -1) {
      return smileyfy(text.substring(0, pos)) +
        smileyTemplate(smileys[i]) +
        smileyfy(text.substring(pos + smileys[i].code.length, text.length));
    }
  }
  return text;
}









socket.on('connect', function() {
  // console.log('Socket.io connected');
});


socket.on('disconnect', function(reason) {
  console.log('Disconnected from Socket.IO:', reason);
  messageContainer.append(systemMessageTemplate({text: 'Connection lost'}));
});


socket.on('error', function(reason) {
  console.log('Unable to connect Socket.IO:', reason);
});


// $(window).unload(function() {
  // socket.emit('leave');
// });


socket.on('system-message', function(data) {
  messageContainer.append(systemMessageTemplate(data));
  scroll();
});

messageInput.keydown(function(event) {
  if (event.which == 13) {
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (!messageInput.val()) {
      return;
    }
    socket.emit('message', messageInput.val());
    messageInput.val('');
  }
});

socket.on('message', function(data) {
  var date = new Date(data.date);
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  data.date = date.toString().substring(4, 8) + date.getDate() + ' at ' + hour + ':' + minute;
  data.timestamp = date.getTime();







  var pics = [];
  while (match = urlPattern.exec(data.text)) {
    pics.push(match[0]);
  }













  var firstWord = data.text.split(' ')[0];
  var commands = ['/meme', '/quote'];
  // if it's not a command
  if (commands.indexOf(firstWord) == -1) {
    data.text = urlify(data.text);
    data.text = smileyfy(data.text);
    data.text = data.text.replace(newlinePattern, '<br>');
    data.text = messageTemplate(data);
  }


  if (data.text.indexOf('/quote') == 0) {
    data.text = data.text.replace('/quote', '');
    data.text = quoteTemplate({text: data.text});
  }


  if (data.text.indexOf('/meme') == 0) {
    var tokens = data.text.match(quotedWordsPattern);
    var memeData = {
      pic: tokens[1],
      top: stripQuotes(tokens[2] || '').toUpperCase(),
      bottom: stripQuotes(tokens[3] || '').toUpperCase(),
    }
    data.text = memeTemplate(memeData);
  }


  var lastMessage = $('.message').last();
  var lastMessageUserId = lastMessage.attr('data-user-id') || '';
  var lastMessageTimestamp = parseInt(lastMessage.attr('data-timestamp')) || -1;
  var timestampNow = new Date().getTime();
  if (lastMessageUserId == currentUser.attr('data-user-id') && timestampNow - lastMessageTimestamp < groupMessageInterval) {
    lastMessage.find('.text').append(data.text);
  } else {
    messageContainer.append(messageContainerTemplate(data));
  }



  if (pics.length && commands.indexOf(firstWord) == -1) {
    var picHtml = picsTemplate({pics: pics});
    $('.text').last().append(picHtml);
  }





  scroll();
});





//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= END