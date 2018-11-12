var http = require('http').createServer().listen(3001);
var io = require('socket.io').listen(http);

var sockets = []

var players = {}

function main(){
    io.on('connection', function(socket){
        
        sockets.push(socket);
        console.log('new client!', sockets.length)
        
        //socket.broadcast.emit({v:Math.random()})
        
        socket.on('enter', function(name){
            
            socket.emit('old-users', players)

            sockets.forEach(function(s){
                s.emit('new-user', {name, x:Math.random()*640, y:Math.random()*480})
            });
        })

        socket.on('move', function(data){
            
            players[data.name] = data

            sockets.forEach(function(s){
                s.emit('move', data)
            });
        })

        socket.on('disconnect', function(){
            sockets.splice(sockets.indexOf(socket), 1)
            console.log('disconnected!', sockets.length)
        })
    })

    console.log("Game server is running!!")
}


module.exports = {
    run: main
}