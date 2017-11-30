const Sessions = require('./Sessions')

module.exports = (io) => {
    let sessions = new Sessions()

    io.on('connection', function(socket)
    {
        // Добавляем нового игрока
        sessions.addPlayer(socket)
    
        socket.on('disconnect', () => sessions.removePlayer(socket));

        socket.on('spectate', (session) => sessions.addSpectorToSession(socket, session));
    
        socket.on('join', function(data)
        {
            console.log('start join to session', data.session)
            sessions.players[socket.id].nick = data.nick;
            const session = data.session
            try
            {
                sessions.addPlayerToSession(socket, session)
            } catch(e)
            {   
                if(e.code !== 'ToMuchPlayers')
                    throw new Error('error on player add to session')
                else
                    console.log('too much players')
            }
            
        });

        socket.on('sessions', function(callback)
        {
            callback({
                sessions: sessions.sessions,
                maxPlayers: sessions.playersPerGame
            })
        });
    
        socket.on('makestep', function(data)
        {
            console.log('step')
            let players = sessions.players;
            let map = sessions.map(socket.id);

            if (players[socket.id] == null)
            {
                return;
            }
            var
            {
                path,
                roll
            } = map.makeStep(players[socket.id]);
            sessions.emit(socket, 'makestep',
            {
                player: players[socket.id],
                map: map,
                path: path,
                roll: roll,
                turn: map.players[map.playersKeys[map.currentTurn]].id,
            });
            if (map.players[socket.id] == null)
            {
                console.log('lose event for player ' + players[socket.id].nick);
                sessions.emit(socket, 'lose',
                {
                    player: players[socket.id]
                });
            }
        });
    
        socket.on('buycard', function(data)
        {
            let players = sessions.players;
            let map = sessions.map(socket.id);

            if (players[socket.id] == null)
            {
                return;
            }
            var result = map.buyCard(players[socket.id]);
            sessions.emit(socket, 'buycard',
            {
                player: map.players[socket.id],
                players: map.players,
                cell: map.map[map.players[socket.id].position],
                result: result
            });
        });
    
        socket.on('sellcard', function(card)
        {
            let players = sessions.players;
            let map = sessions.map(socket.id);

            if (players[socket.id] == null)
            {
                return;
            }
            var cell = map.sellCard(players[socket.id], card);
            sessions.emit(socket, 'sellcard',
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