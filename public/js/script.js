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
  var smileyTemplate = Handlebars.compile('\
    <img class="smiley" src="{{url}}" title="{{code}}">\
  ');






  var socket = io.connect('/');

  var messageContainer = $('#message-container');
  var input = $('#input');
  var hasFocus = true;
  var title = document.title;
  var unreadMessages = 0;
  input.focus();


  $(window).focus(function() {
    hasFocus = true;
    unreadMessages = 0;
    document.title = title;
    input.focus();
  });
  $(window).blur(function() {
    hasFocus = false;
  });

  var urlPattern = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
  // var urlPattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  // var urlPattern = new RegExp('(http|ftp|https)://[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?', 'i');



  // Here is some example test with URLs from mattheworiordan.com. Any of the URLs which are prefixed with www. should become URLs such as www.mattheworiordan.com/path_name.html And an explicit URL such as http://www.mattheworiordan.com/ should become a URL. Emails such as matt@google.com should become links to. Or email mailto links such as mailto:matt@google.com should become links to. And of course lets not forget querstryings such as http://mattheworiordan.com/?test-param=true_or_false and paths and anchors such as www.mattheworiordan.com/home#index




  var whitespaceQuotesPattern = /(?:[^\s"]+|"[^"]*")+/g;
  var newlinePattern = /\n/g;

  function scroll() {
    if (!hasFocus) {
      unreadMessages += 1;
      document.title = '(' + unreadMessages + ') ' + title;
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


    if (data.text.indexOf('/meme') != 0) {
      data.text = urlify(data.text);
      data.text = smileyfy(data.text);
    }


    if (data.text.indexOf('/quote') == 0) {
      data.text = data.text.replace('/quote', '');
      data.text = quoteTemplate({text: data.text});
    }


    if (data.text.indexOf('/meme') == 0) {
      var tokens = data.text.match(whitespaceQuotesPattern);
      var memeData = {
        pic: tokens[1],
        top: stripQuotes(tokens[2] || '').toUpperCase(),
        bottom: stripQuotes(tokens[3] || '').toUpperCase(),
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