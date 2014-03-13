//================================================================================================= GLOBALS

var socket = io.connect('/');
var messageContainer = $('#message-container');
var messageInput = $('#message-input');
var windowHasFocus = true;
var windowTitle = document.title;
var unreadMessageCount = 0;

//================================================================================================= JAVASCRIPT FALLBACKS

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

//================================================================================================= CLOSE BUTTONS + FOCUS MESSAGE INPUT

$(document).on('click', '.media .close', function() {
  $(this).parent().hide('normal');
});

messageInput.focus();

//================================================================================================= HELPERS

function urlify(text) {
  return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

function smileyfy(text) {
  for (var i = 0; i < smileys.length; i++) {
    var pos = text.indexOf(smileys[i].code);
    if (pos != -1) {
      return smileyfy(text.substring(0, pos))
              + smileyTemplate(smileys[i])
              + smileyfy(text.substring(pos + smileys[i].code.length, text.length));
    }
  }
  return text;
}

function stripQuotes(text) {
  if (text[0] == '"') {
    text = text.substring(1);
  }
  if (text[text.length - 1] == '"') {
    text = text.substring(0, text.length - 1);
  }
  return text;
}

function scroll() {
  if (windowHasFocus) {
    messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
  } else {
    unreadMessageCount += 1;
    document.title = '(' + unreadMessageCount + ') ' + windowTitle;
  }
}

//================================================================================================= WINDOW FOCUS / BLUR

$(window).focus(function() {
  windowHasFocus = true;
  document.title = windowTitle;
  messageInput.focus();
  unreadMessageCount = 0;
});

$(window).blur(function() {
  windowHasFocus = false;
});

//================================================================================================= MESSAGE INPUT

messageInput.keydown(function(event) {
  if (event.which == 13) {
    if (event.shiftKey) {
      return;
    }
    if (!messageInput.val()) {
      return;
    }
    socket.emit('message', messageInput.val());
    messageInput.val('');
    event.preventDefault();
  }
});

//================================================================================================= SOCKET.IO EVENTS

socket.on('connect', function() {
  console.log('Socket.IO connected :)');
});

//===============================================

socket.on('disconnect', function() {
  console.log('Socket.IO disconnected :(');
  messageContainer.append(systemMessageTemplate({
    text: 'Connection to server lost. Please refresh and try again.',
  }));
  scroll();
});

//===============================================

socket.on('error', function(reason) {
  console.log('Socket.IO error:', reason);
});

//===============================================

socket.on('system-message', function(data) {
  messageContainer.append(systemMessageTemplate(data));
  scroll();
});

//===============================================

socket.on('message', function(data) {
  var date = new Date(data.date);
  // convert date to human-friendly format
  var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  data.date = date.toString().substring(4, 8) + date.getDate() + ' at ' + hour + ':' + minute;
  // add timestamp field
  data.timestamp = date.getTime();
  // extract urls from text
  var urls = [];
  while (match = urlPattern.exec(data.text)) {
    urls.push(match[0]);
  }
  // figure out whether or not we have a special command
  isSpecialCommand = false;
  for (i = 0; i < specialCommands.length; i++) {
    if (data.text.indexOf(specialCommands[i]) == 0) {
      isSpecialCommand = true;
    }
  }
  // if it's not a special command, we may process the text
  if (!isSpecialCommand) {
    data.text = data.text.replace(newlinePattern, '<br>');
    data.text = urlify(data.text);
    data.text = smileyfy(data.text);
  }
  // render the message
  if (data.text.indexOf('/quote') == 0) {
    data.text = data.text.replace('/quote', '');
    data.text = quoteTemplate({
      text: data.text,
    });
  } else if (data.text.indexOf('/meme') == 0) {
    var tokens = data.text.match(quotedWordsPattern);
    var memeData = {
      pic: tokens[1],
      top: stripQuotes(tokens[2] || '').toUpperCase(),
      bottom: stripQuotes(tokens[3] || '').toUpperCase(),
    }
    data.text = memeTemplate(memeData);
  } else {
    data.text = messageTemplate(data);
  }
  // append the message
  var lastMessage = $('.message').last();
  var lastMessageUserId = lastMessage.attr('data-user-id') || '';
  var lastMessageTimestamp = parseInt(lastMessage.attr('data-timestamp')) || -1;
  if (data.user.id == lastMessageUserId && data.timestamp - lastMessageTimestamp < groupMessageInterval) {
    lastMessage.find('.text').append(data.text);
  } else {
    messageContainer.append(messageContainerTemplate(data));
  }
  // append urls as pics
  if (urls.length && !isSpecialCommand) {
    var picHtml = picsTemplate({
      pics: urls,
    });
    $('.text').last().append(picHtml);
  }
  scroll();
});

//================================================================================================= END