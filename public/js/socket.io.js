var socket = io.connect('/');


socket.on('error', function (reason){
  // console.log('Unable to connect Socket.IO:', reason);
});


socket.on('connect', function (){
  console.log('successfully established a working connection');
});


socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});