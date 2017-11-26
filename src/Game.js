const Map1 = require('./maps/Map1')

class Sessions
{
    constructor()
    {
        this.players = {}
        this.sockets = {}

        this.sessions = []
        this.playersPerGame = 5;
    }

    addPlayer(socket)
    {
        const player = {
            id: socket.id,
            money: 20000,
            inventory: [],
            stepskip: 0,
            cardGroupMap: {},
            nick: '',
            canBuyCard: false,
        }
        this.players[socket.id] = player
        this.sockets[socket.id] = socket;
        console.log('player connected with id: ' + socket.id);
    }

    addPlayerToSession(socket)
    {
        const id = socket.id;
        let player = this.players[id];
        if(!player)
            throw new Error('no player for session')

        if(this.sessions.length > 0 && this.sessions[this.sessions.length - 1].players.length < this.playersPerGame)
        {
            player.session = this.sessions.length - 1;
            this.sessions[this.sessions.length - 1].players.push(player)
        }
        else
        {
            const map = Map1()
            const index = this.sessions.push({
                players: [player],
                map
            })
            player.session = index - 1
        }
        const map = this.map(id)
        map.addPlayer(this.players[socket.id]);
        socket.emit('join',
        {
            player: this.players[socket.id],
            map,
            turn: map.players[map.playersKeys[map.currentTurn]].id
        });
        this.broadcast(socket, 'joinplayer',
        {
            player: this.players[socket.id],
            map,
            turn: map.players[map.playersKeys[map.currentTurn]].id
        });
        console.log('add player to session', player.session)
    }

    map(id)
    {
        let player = this.players[id];
        const session = player.session;
        if(typeof session !== 'undefined')
        {
            return this.sessions[session].map
        }
    }

    removePlayer(socket)
    {
        const id = socket.id
        let player = this.players[id];
        if(player)
        {
            const session = player.session;
            if(typeof session !== 'undefined')
            {
                this.sessions[session].players = this.sessions[session].players.filter(p => p.id !== player.id)
                let map = this.sessions[session].map;
                map.removePlayer(this.players[socket.id])
                this.broadcast(socket, 'leftplayer',
                {
                    player: this.players[socket.id],
                    turn: map.players.length > 0 && map.players[map.playersKeys[map.currentTurn]].id
                });
                if(this.sessions[session].players.length === 0)
                {
                    console.log('clean session', 'with 0 gamers')
                    this.sessions.splice(session, 1)
                }
                console.log('removed player from game')
            }
            delete this.players[id];
            delete this.sockets[id];
            console.log('disconected: ' + id);
        }
    }

    messageToPlayers(socket, callback)
    {
        const id = socket.id;
        const sessionId = this.players[id].session;
        if(typeof sessionId !== 'undefined')
        {
            const players = this.sessions[sessionId].players;
            for(let player of players)
            {
                callback(player)
            }
        }
    }

    broadcast(socket, message, value)
    {
        this.messageToPlayers(socket, (player) => {
            if(player.id !== socket.id)
            {
                console.log('broadcast', message, 'to', player.id)
                if(this.sockets[player.id])
                    this.sockets[player.id].emit(message, value)
            }
        })
    }

    emit(socket, message, value)
    {
        this.messageToPlayers(socket, (player) => {
            console.log('send', message, 'to', player.id)
            if(this.sockets[player.id])
                this.sockets[player.id].emit(message, value)
        })
    }
}

module.exports = (io) => {
    let sessions = new Sessions()

    io.on('connection', function(socket)
    {
        // Добавляем нового игрока
        sessions.addPlayer(socket)
    
        socket.on('disconnect', () => sessions.removePlayer(socket));
    
        socket.on('join', function(data)
        {
            sessions.players[socket.id].nick = data.nick;
            sessions.addPlayerToSession(socket)
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