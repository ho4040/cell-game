var http = require('http').createServer().listen(3001);
var io = require('socket.io').listen(http);

var sockets = []
var players = {}

function update(dest, src){
    for(let k in src){
        dest[k] = src[k]
    }
}

function main(){
    io.on('connection', function(socket){
        
        sockets.push(socket);
        console.log('new client!', sockets.length)
        
        socket.on('enter', function(name){
            console.log("someone entered", name)
            socket.emit('old-users', players)
            socket.playerName = name;
            players[name] = {name, pos:{x:Math.random()*640, y:Math.random()*480}, vec:{x:0, y:0}, radius:5}
            sockets.forEach(function(s){                
                s.emit('new-user', players[name])
            });
        })

        socket.on('move', function(data){
            console.log(data)
            update(players[data.name], data)
            sockets.forEach(function(s){
                s.emit('move', data)
            });
        })

        socket.on('stop', function(data){
            update(players[data.name], data)
            sockets.forEach(function(s){
                s.emit('stop', data)
            });
        })

        socket.on('disconnect', function(){
            sockets.splice(sockets.indexOf(socket), 1)

            let name = socket.playerName
            delete players[name];

            sockets.forEach(function(s){
                s.emit('remove', name)
            });

            console.log('disconnected!', sockets.length)
        })
    })

    console.log("Game server is running!!")
}


module.exports = {
    run: main
}