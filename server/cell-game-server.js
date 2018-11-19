var http = require('http').createServer().listen(3001);
var io = require('socket.io').listen(http);

var sockets = []
var players = {}

function update(dest, src) {
    for (let k in src) {
        dest[k] = src[k]
    }
}

function randomFeed() {
    let name = 'feed' + Math.floor(Math.random() * 100000);
    players[name] = { name, pos: { x: Math.random() * 640, y: Math.random() * 480 }, vec: { x: 0, y: 0 }, radius: 3 }
    sockets.forEach(function (s) {
        s.emit('new-user', players[name])
    });
}

function checkCollision() {

    let names = Object.keys(players);

    for (let i = 0; i < names.length - 1; i++) {
        for (let j = i + 1; j < names.length; j++) {

            let target_i = players[names[i]];
            let target_j = players[names[j]];

            if (!target_j || !target_i)
                continue;

            let dist = Math.sqrt((target_i.pos.x - target_j.pos.x) ** 2 + (target_i.pos.y - target_j.pos.y) ** 2)
            let largeR = Math.max(target_i.radius, target_j.radius)

            if (dist < largeR) {
                if (target_i.radius > target_j.radius) {
                    target_i.radius += target_j.radius;
                    removePlayer(target_j.name)
                    sockets.forEach(function (s) {
                        s.emit('grow', target_i)
                    });
                } else {
                    target_j.radius += target_i.radius;
                    removePlayer(target_i.name)
                    sockets.forEach(function (s) {
                        s.emit('grow', target_j)
                    });
                }
            }
        }
    }
}

function removePlayer(name) {
    
    let filteredSockets = sockets.filter(e => e.playerName == name)
    if (filteredSockets.length != 0){
        let socket = filteredSockets[0];
        sockets.splice(sockets.indexOf(socket), 1)
    }

    delete players[name];
    sockets.forEach(function (s) {
        s.emit('remove', name)
    });

}

function main() {
    io.on('connection', function (socket) {

        sockets.push(socket);
        console.log('new client!', sockets.length)

        socket.on('enter', function (name) {
            console.log("someone entered", name)
            socket.emit('old-users', players)
            socket.playerName = name;
            players[name] = { name, pos: { x: Math.random() * 640, y: Math.random() * 480 }, vec: { x: 0, y: 0 }, radius: 5 }
            sockets.forEach(function (s) {
                s.emit('new-user', players[name])
            });
        })

        socket.on('move', function (data) {
            update(players[data.name], data)
            sockets.forEach(function (s) {
                s.emit('move', data)
            });
        })

        socket.on('stop', function (data) {
            update(players[data.name], data)
            sockets.forEach(function (s) {
                s.emit('stop', data)
            });
        })

        socket.on('disconnect', function () {

            removePlayer(socket.playerName)
            console.log('disconnected!', sockets.length)
        })
    })

    setInterval(randomFeed, 5000);
    setInterval(checkCollision, 100);

    console.log("Game server is running!!")
}


module.exports = {
    run: main
}