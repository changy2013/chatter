//================================================================================================= GLOBALS

var socket = io.connect('/');
var mentionPattern = new RegExp('@' + currentUser.name, 'g');
var messageContainer = $('#message-container');
var messageInput = $('#message-input');
var windowHasFocus = true;
var windowTitle = document.title;
var unreadMessageCount = 0;
var users = [];

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

//================================================================================================= CLOSE BUTTONS + TITLE MAX LENGTH + FOCUS MESSAGE INPUT

$(document).on('click', '.media .close', function() {
  $(this).parent().hide('normal');
});

$('#modal-title input').prop('maxlength', titleMaxLength);

messageInput.focus();

//================================================================================================= HELPERS

function urlify(data) {
  data.text = data.text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

function smileyfy(data) {
  function _smileyfy(text) {
    for (var i = 0; i < smileys.length; i++) {
      var pos = text.indexOf(smileys[i].code);
      if (pos != -1) {
        return _smileyfy(text.substring(0, pos))
                + smileyTemplate(smileys[i])
                + _smileyfy(text.substring(pos + smileys[i].code.length, text.length));
      }
    }
    return text;
  }
  data.text = _smileyfy(data.text);
}

function mentionify(data) {
  if (data.text.search(mentionPattern) != -1) {
    var mention = '<strong>@' + currentUser.name + '</strong>';
    data.text = data.text.replace(mentionPattern, mention);
    data.mention = true;
  }
}

function lineBreakify(data) {
  data.text = data.text.replace(newlinePattern, '<br>');
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

function append(data) {
  var lastMessage = $('.message, .system-message').last();
  var lastMessageUserId = lastMessage.attr('data-user-id') || '';
  var lastMessageTimestamp = parseInt(lastMessage.attr('data-timestamp')) || -1;
  if (data.user.id == lastMessageUserId && data.timestamp - lastMessageTimestamp < groupMessageInterval) {
    lastMessage.find('.text').append(data.text);
  } else {
    messageContainer.append(messageContainerTemplate(data));
  }
}

function appendPics(urls) {
  if (urls.length) {
    $('.text').last().append(picsTemplate({
      pics: urls,
    }));
  }
}

function scroll() {
  if (windowHasFocus) {
    if (messageContainer.prop('scrollHeight') - messageContainer.scrollTop() - messageContainer.outerHeight() < 333) {
      messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
      messageContainer.stop(true, true).animate({scrollTop: messageContainer.prop('scrollHeight') + 666}, 333);
    }
  } else {
    unreadMessageCount += 1;
    document.title = '(' + unreadMessageCount + ') ' + windowTitle;
  }
}

function geolocate(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geocoder = new google.maps.Geocoder();
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      geocoder.geocode({'latLng': latLng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var location = results[0].formatted_address;
          callback(location);
        } else {
          console.log('Geocoder failed:', status);
        }
      });
    }, function() {
      console.log('Geolocation failed');
    });
  }
}

//================================================================================================= WINDOW FOCUS / BLUR

$(window).focus(function() {
  windowHasFocus = true;
  document.title = windowTitle;
  messageInput.focus();
  unreadMessageCount = 0;
  socket.emit('ping', { triggerUpdate: true });
});

$(window).blur(function() {
  windowHasFocus = false;
});

//================================================================================================= MESSAGE INPUT

messageInput.keydown(function(event) {
  if (event.which == 9) {
    var text = messageInput.val();
    var atSignPoz = text.length - 1;
    while (atSignPoz > 0 && text[atSignPoz] != '@') {
      atSignPoz -= 1;
    }
    if (text[atSignPoz] == '@') {
      var mention = text.substring(atSignPoz + 1, text.length);
      for (var i = 0; i < users.length; i++) {
        if (users[i].name.toLowerCase().indexOf(mention.toLowerCase()) == 0) {
          messageInput.val(text.substring(0, atSignPoz + 1) + users[i].name + ' ');
        }
      }
    }
    return false;
  } else if (event.which == 13) {
    if (event.shiftKey) {
      return;
    }
    if (!messageInput.val()) {
      return;
    }
    var text = messageInput.val();
    if (text == '/clear') {
      messageContainer.html('');
    } else {
      socket.emit('message', messageInput.val());
    }
    messageInput.val('');
    event.preventDefault();
  }
});

//================================================================================================= SOCKET.IO EVENTS

socket.on('connect', function() {
  messageContainer.html('');
  console.log('Socket.IO connected :)');
  geolocate(function(location) {
    socket.emit('location', location);
  });
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

socket.on('title', function(data) {
  // add title to the change title modal
  $('#modal-title input').val(data.text);
  // trim title if necessary
  if (data.text.length > titleMaxLength) {
    data.text = data.text.substr(0, titleMaxLength - 3) + '...';
  }
  urlify(data);
  smileyfy(data);
  $('.title').html(data.text);
});

//===============================================

socket.on('users', function(data) {
  users = [];
  var now = new Date();
  for (var key in data) {
    var lastPing = new Date(data[key].date);
    data[key].timestamp = lastPing.getTime();
    var timeSincePing = now.getTime() - lastPing.getTime();
    var hoursSincePing = Math.floor(timeSincePing / (60 * 60 * 1000));
    var minutesSincePing = Math.floor(timeSincePing / (60 * 1000));
    if (hoursSincePing > 0) {
      data[key].idle = hoursSincePing + 'h';
    } else if (minutesSincePing > 0) {
      data[key].idle = minutesSincePing + 'm';
    }
    users.push(data[key]);
  }
  users.sort(function(a, b) {
    return b.timestamp - a.timestamp;
  });
  $('.navbar-collapse ul .user').remove();
  $('.navbar-collapse li').first().after(navbarUsersTemplate({
    users: users,
  }));
  $('#user-container').html(sidebarUsersTemplate({
    users: users,
  }));
  $('.counter').html(users.length + ' online');
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

  if (data.text.indexOf('/meme') == 0) {
    var tokens = data.text.match(quotedWordsPattern);
    var memeData = {
      pic: tokens[1],
      top: stripQuotes(tokens[2] || '').toUpperCase(),
      bottom: stripQuotes(tokens[3] || '').toUpperCase(),
    }
    data.text = memeTemplate(memeData);
    append(data);
  } else if (data.text.indexOf('/quote') == 0) {
    data.text = data.text.replace('/quote ', '');
    mentionify(data);
    lineBreakify(data);
    urlify(data);
    smileyfy(data);
    data.text = quoteTemplate(data);
    append(data);
  } else if (data.text.indexOf('/code') == 0) {
    data.text = data.text.replace('/code ', '');
    data.text = codeTemplate(data);
    append(data);
    prettyPrint();
  } else if (data.text.indexOf('/whisper') == 0) {
    data.text = data.text.replace('/whisper ', '');
    var spacer = new Array(128).join(' ');
    console.log((data.user.name + spacer).substr(0, 128), data.date);
    console.log('    ', data.text);
  } else {
    mentionify(data);
    lineBreakify(data);
    urlify(data);
    smileyfy(data);
    data.text = messageTemplate(data);
    append(data);
    appendPics(urls);
  }

  scroll();
});

//===============================================

setInterval(function() {
  if (windowHasFocus) {
    socket.emit('ping');
  }
}, pingInterval);

//================================================================================================= MODALS

$('#modal-title').on('shown.bs.modal', function() {
  $('#modal-title input').focus();
});

$('#modal-title form').submit(function() {
  socket.emit('title', $('#modal-title input').val());
  $('#modal-title').modal('hide');
  // hide dropdown
  $(document).click();
  return false;
});

$('#modal-title .btn-primary').click(function() {
  socket.emit('title', $('#modal-title input').val());
  $('#modal-title').modal('hide');
});

$('#btn-title').click(function() {
  $('#modal-title').modal();
  return false;
});

//===============================================

$('#btn-about').click(function() {
  $('#modal-about').modal();
  return false;
});

//===============================================

var uniqueSmileys = [smileys[smileys.length - 1]];
for (var i = 0; i < smileys.length; i++) {
  if (smileys[smileys.length - i - 1].url != uniqueSmileys[uniqueSmileys.length - 1].url) {
    uniqueSmileys.push(smileys[smileys.length - i - 1]);
  }
}

$('#modal-help .modal-body').append(smileysTemplate({
  smileys: uniqueSmileys,
}));

$('#btn-help').click(function() {
  $('#modal-help').modal();
  return false;
});

//================================================================================================= END