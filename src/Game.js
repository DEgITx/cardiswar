const Map1 = require('./maps/Map1')

module.exports = (io) => {
    let players = {};

    let map = Map1()

    io.on('connection', function(socket)
    {
        // Добавляем нового игрока
        players[socket.id] = {
            id: socket.id,
            money: 20000,
            inventory: [],
            stepskip: 0,
            cardGroupMap:
            {},
            nick: '',
        };
        console.log('player connected with id: ' + socket.id);
    
        socket.on('disconnect', function()
        {
            socket.broadcast.emit('leftplayer',
            {
                player: players[socket.id]
            });
            map.removePlayer(players[socket.id])
            delete players[socket.id];
            console.log('player left with id: ' + socket.id);
        });
    
        socket.on('join', function(data)
        {
            players[socket.id].nick = data.nick;
            map.addPlayer(players[socket.id]);
            console.log('player joins with id: ' + socket.id + "and nick: " + players[socket.id].nick);
            console.log(map);
            socket.emit('join',
            {
                player: players[socket.id],
                map: map
            });
            socket.broadcast.emit('joinplayer',
            {
                player: players[socket.id],
                map: map
            });
        });
    
        socket.on('makestep', function(data)
        {
            if (players[socket.id] == null)
            {
                return;
            }
            var
            {
                path,
                roll
            } = map.makeStep(players[socket.id]);
            io.sockets.emit('makestep',
            {
                player: players[socket.id],
                map: map,
                path: path,
                roll: roll,
                turn: map.players[map.playersKeys[map.currentTurn]],
            });
            if (map.players[socket.id] == null)
            {
                console.log('lose event for player ' + players[socket.id].nick);
                io.sockets.emit('lose',
                {
                    player: players[socket.id]
                });
            }
        });
    
        socket.on('buycard', function(data)
        {
            if (players[socket.id] == null)
            {
                return;
            }
            var result = map.buyCard(players[socket.id]);
            io.sockets.emit('buycard',
            {
                player: map.players[socket.id],
                players: map.players,
                cell: map.map[map.players[socket.id].position],
                result: result
            });
        });
    
        socket.on('sellcard', function(card)
        {
            if (players[socket.id] == null)
            {
                return;
            }
            var cell = map.sellCard(players[socket.id], card);
            io.sockets.emit('sellcard',
            {
                player: map.players[socket.id],
                players: map.players,
                cell: map.map[cell],
                result: cell >= 0,
                losers: map.losers,
            });
        });
    
    });
}