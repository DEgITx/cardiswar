var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8099);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.use(express.static('public'));

var players = {};

io.on('connection', function (socket) {
  // Добавляем нового игрока
  players[socket.id] = {
	  id: socket.id,
	  money: 10000,
  };
  console.log('player joins with id: ' + socket.id);
  socket.emit('join', { players: players, player: players[socket.id] });
  socket.broadcast.emit('joinplayer', { player: players[socket.id] });

  socket.on('disconnect', function(){
	delete players[socket.id];
	socket.broadcast.emit('leftplayer', { player: players[socket.id] });
	console.log('player left with id: ' + socket.id);
  });
  
  socket.on('rolldice', function(data){
	if(players[socket.id] == null)
	{
		return;
	}
	var roll = Math.floor((Math.random() * 6) + 1);
	console.log('user ' + roll + ' roll');
	io.sockets.emit('rolldice', { player: players[socket.id], roll: roll });
  });

});