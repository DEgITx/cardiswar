const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const game = require('./src/Game');

server.listen(8099);

app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/index.html');
});

app.use(express.static('public'));
app.use('/phaser', express.static('node_modules/phaser/build'));
app.use('/phaser-input', express.static('node_modules/@orange-games/phaser-input/build'));
app.use('/phaser-kinetic-scrolling-plugin', express.static('node_modules/phaser-kinetic-scrolling-plugin/dist'));

game(io);