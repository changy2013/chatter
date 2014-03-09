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

  $('#message-container').scrollTop($('#message-container').prop('scrollHeight'));

  $(document).on('click', '.media .close', function() {
    $(this).parent().hide('normal');
  });

  // TODO: this should probably be called on the img's onload event
  $('.meme').each(function() {
    var width = $(this).find('img').width();
    $(this).width(width);
    $(this).find('div').width(width);
  });

});





var socket = io.connect('http://localhost');
socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});





//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= SECTION



//================================================================================================= END