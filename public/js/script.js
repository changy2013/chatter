//================================================================================================= SECTION

$(function() {

  // TODO: this is a pretty unreliable way of detecting CSS calc() support
  if ($('#message-container').height() > $('body').height()) {
    $('#message-container').height($('body').height() - 75);
    $(window).resize(function() {
      $('#message-container').height($('body').height() - 75);
    });
    console.log('CSS calc not supported, using JavaScript fallback.');
  }

  $(document).on('click', '.media .close', function() {
    $(this).parent().hide('normal');
  });

});

//================================================================================================= SECTION

if (window.io) {

  var socket = io.connect('/');

  var messageContainer = $('#message-container');
  var input = $('#input');
  var hasFocus = true;


  $(window).focus(function() {
    hasFocus = true;
  });
  $(window).blur(function() {
    hasFocus = false;
  });


  var urlPattern = new RegExp('(ftp|https?)://[^ "]+$', 'ig');
  var newlinePattern = new RegExp('\n', 'ig');
  var whitespaceQuotesPattern = new RegExp('(?:[^\\s"]+|"[^"]*")+', 'ig');

  function scroll() {
    if (!hasFocus) {
      return;
    }
    messageContainer.scrollTop(messageContainer.prop('scrollHeight'));
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

  var systemMessageTemplate = Handlebars.compile('\
    <div class="system-message">{{text}}</div>\
  ');
  var messageTemplate = Handlebars.compile('\
    <div class="message">\
      <div class="header">\
        <img src="{{user.pic}}">\
        <strong>{{user.name}}</strong>\
        <small>{{timestamp}}</small>\
      </div>\
      <div class="text">\
        <p>{{{text}}}</p>\
      </div>\
    </div>\
  ');
  var quoteTemplate = Handlebars.compile('\
    <blockquote>\
      <p>{{{text}}}</p>\
    </blockquote>\
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

  input.keydown(function(event) {
    if (event.which == 13) {
      if (event.shiftKey) {
        return;
      }
      event.preventDefault();
      if (!input.val()) {
        return;
      }
      socket.emit('message', input.val());
      input.val('');
    }
  });

  socket.on('message', function(data) {
    var date = new Date(data.timestamp);
    var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    data.timestamp = date.toString().substring(4, 8) + date.getDate() + ' at ' + hour + ':' + minute;
    data.text = data.text.replace(newlinePattern, '<br>');



    if (data.text.indexOf('/quote') == 0) {
      data.text = data.text.replace('/quote', '');
      data.text = quoteTemplate({text: data.text});
    }


    if (data.text.indexOf('/meme') == 0) {
      var tokens = data.text.match(whitespaceQuotesPattern);
      tokens[3] = tokens[3] || '';
      var memeData = {
        pic: tokens[1],
        top: stripQuotes(tokens[2]).toUpperCase(),
        bottom: stripQuotes(tokens[3]).toUpperCase(),
      }
      data.text = memeTemplate(memeData);
    }


    messageContainer.append(messageTemplate(data));
    scroll();
  });

}

//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= END