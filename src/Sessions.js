const Map1 = require('./maps/Map1')

class Sessions
{
    constructor()
    {
        this.players = {}
        this.sockets = {}

        this.sessions = []
        this.playersPerGame = 2;
    }

    static createPlayer(id)
    {
        return {
            id: id,
            money: 20000,
            inventory: [],
            stepskip: 0,
            cardGroupMap: {},
            nick: '',
            canBuyCard: false,
        }
    }

    addPlayer(socket)
    {
        const player = Sessions.createPlayer(socket.id)
        this.players[socket.id] = player
        this.sockets[socket.id] = socket;
        console.log('player connected with id: ' + socket.id);
    }

    addPlayerToSession(socket, sessionTo = -1)
    {
        const id = socket.id;
        let player = this.players[id];
        if(!player)
            throw new Error('no player for session')

        let session = this.sessions.length - 1;
        // connect player to specified session
        if(sessionTo >= 0 && sessionTo < this.sessions.length)
        {
            session = sessionTo
            if(!this.sessions[session] || this.sessions[session].players.length >= this.playersPerGame)
            {   
                let error = new Error('too much players on this session');
                error.code = 'ToMuchPlayers'
                throw error;
            }
        }
        
        // join
        if(this.sessions.length > 0 && this.sessions[session] && this.sessions[session].players.length < this.playersPerGame)
        {
            player.session = session;
            this.sessions[session].players.push(player)
        }
        else
        {
            const map = Map1()
            const index = this.sessions.push({
                players: [player],
                map,
                toJSON()
                {
                    return {
                        players: this.players
                    }
                }
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
                    delete this.sessions[session]
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

    all(message, value)
    {
        for(let player of this.players)
        {
            if(this.sockets[player.id])
                this.sockets[player.id].emit(message, value)
        }
    }
}

module.exports = Sessions;