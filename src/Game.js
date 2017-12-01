const Sessions = require('./Sessions')

module.exports = (io) => {
    let sessions = new Sessions()
    console.log(process.env.NODE_ENV)

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
            if(!sessions.players[socket.id])
                return;

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
    
        socket.on('buycard', function(callback)
        {
            if(!sessions.players[socket.id])
                return;

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

            if(callback)
                callback({
                    result: result
                })
        });
    
        socket.on('sellcard', function(card)
        {
            if(!sessions.players[socket.id])
                return;

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
    
        socket.on('useCard', function(card, callback)
        {
            console.log('use card')
            const player = sessions.players[socket.id];
            if(!player)
                return;

             let map = sessions.map(socket.id);
             if(!map)
                return;

            let data = map.useCard(player, card);
            sessions.emit(socket, 'useCard',
            {
                player,
                data
            });
            if(callback)
                callback({
                    player,
                    data
                })
        });

        socket.on('voteReset', function(callback)
        {
            const player = sessions.players[socket.id];
            if(!player)
                return;

             let map = sessions.map(socket.id);
             if(!map)
                return;

            if(map.voteReset(player))
                sessions.emit(socket, 'resetMap',
                {
                    player,
                    map
                });
            if(callback)
                callback({
                    player
                })
        });

        socket.on('disVoteReset', function(callback)
        {
            const player = sessions.players[socket.id];
            if(!player)
                return;

             let map = sessions.map(socket.id);
             if(!map)
                return;

            map.disableVoteReset(player)
            if(callback)
                callback({
                    player
                })
        });
    });
}