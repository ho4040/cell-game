define(['jquery', 'PIXI', 'firebase', 'io'], function ($, PIXI, firebase, io) {
    
    let _m = {};

    let gameObj = {}
    let gameState = {
        playing : false,
        cursor : {x:0, y:0},
        playTime : 0
    }
    
    let sub = function (v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y }
    }

    let len = function (vec) {
        return Math.sqrt((Math.pow(vec.x, 2) + Math.pow(vec.y, 2)))
    }

    let dot = function (v1, v2) {
        return v1.x * v2.x + v1.y * v2.y
    }

    _m.addPlayer = function(data){

        let p = new PIXI.Graphics()
        let color = Math.random() * 0xFFFFFF;

        p.name = data.name;
        p.radius = data.radius;
        p.beginFill(color)
        p.drawCircle(0, 0, p.radius)
        p.endFill()
        p.x = data.pos.x;
        p.y = data.pos.y;
        p.moveVec = data.vec;
        _m.playerLayer.addChild(p)
        gameObj[data.name] = p;

        return p;
    }

    

    _m.removePlayer = function(name){
        if(name in gameObj){
            let node = gameObj[name];
            _m.playerLayer.removeChild(node)
            delete gameObj[name]
        }
    }

    _m.onNewUser = function(data){
        _m.addPlayer(data)
    }  

    _m.onMove = function(data){
        let name = data.name;
        let player = gameObj[name];
        player.x = data.pos.x;
        player.y = data.pos.y;
        player.moveVec = data.vec;
    }

    _m.onStop = function(data){
        let name = data.name;
        let player = gameObj[name];
        player.x = data.pos.x;
        player.y = data.pos.y;
        player.moveVec = null;
    }

    _m.onRemove = function(name){
        _m.removePlayer(name)
    }

    _m.onOlsUsers = function(players){
        for(let name in players){
            _m.addPlayer(players[name])
        }
    }

    _m.onGrow = function(data){
        console.log(data)
        let color = Math.random() * 0xFFFFFF;
        let p = gameObj[data.name]        
        p.radius = data.radius;
        p.clear();
        p.beginFill(color)
        p.drawCircle(0, 0, p.radius)
        p.endFill()
    }

    _m.init = function () {

        console.log("game init")

        _m.socket = io("http://localhost:3001", {autoConnect:false});
        
        _m.socket.on('new-user', _m.onNewUser);
        _m.socket.on('old-users', _m.onOlsUsers);
        _m.socket.on('move', _m.onMove);
        _m.socket.on('stop', _m.onStop);
        _m.socket.on('remove', _m.onRemove);
        _m.socket.on('grow', _m.onGrow);
        
        let firestore = firebase.firestore()
    
        const settings = { timestampsInSnapshots: true };
        firestore.settings(settings);

        const app = new PIXI.Application({ width: 640, height: 480 });
        document.getElementById("gameArea").appendChild(app.view);
        _m.app = app;

        $("#scoreAddBtn").on("click", function () {
            let score = gameState.elapsedTime / 100
            let name = $("#playerNameInput").val()
            // console.log(name);
            firebase.firestore().collection("leaderboard").add({ score: score, name: name }).then(() => {
                _m.showLeaderBoard();
            })
        })

        $("#gameStartBtn").on("click", function () {
            if(gameState.playing == false){
                console.log("gameStartBtn click!!!!")
                $("#gameArea").show()
                _m.resetGame();
            }
        })

        _m.showLeaderBoard()



    } //End of init method

    _m.enterFrame = function (delta) {
        
        gameState.playTime += delta;

        for(let name in gameObj){
            let player = gameObj[name]
            if(!!player.moveVec){
                player.x += player.moveVec.x * delta
                player.y += player.moveVec.y * delta
            }
        }

        if(Math.floor(gameState.playTime * 10) % 5 == 0){ // to reduce packet send
        //if(true){ // to reduce packet send
            let cursor = gameState.cursor;

            if(_m.myName in gameObj){
                
                let player = gameObj[_m.myName]
                let vec = {x:cursor.x-player.x, y:cursor.y-player.y}
                let l = len(vec)
                vec.x /= l;
                vec.y /= l;
                let lastMoveVec = player.moveVec != null ? player.moveVec : {x:0, y:0};
                let theta = 180 * (Math.acos(dot(lastMoveVec, vec)) / (3.14))
                let stopEpsilon = player.radius;
                if(l > stopEpsilon && theta > 10) {
                    _m.socket.emit("move", {
                        name:_m.myName, 
                        vec:vec, 
                        pos:{
                            x:player.x, 
                            y:player.y
                        }
                    })
                }else if(l < stopEpsilon) {
                    _m.socket.emit("stop", {
                        name:_m.myName, 
                        pos:{
                            x:player.x, 
                            y:player.y
                        }
                    })
                }
                
            }
        }
    }

    _m.onMouseMove = function(event) {
        let cursor = event.data.global;
        gameState.cursor = cursor;
    }

    _m.resetGame = function () {

        gameObj = {};
        gameState.playing = true;
        _m.app.stage.removeAllListeners();
        _m.app.stage.removeChildren();

        _m.app.ticker.add(_m.enterFrame);

        _m.playerLayer = new PIXI.Container();
        _m.myName = "player" + Math.floor(Math.random()*100);
        console.log("my name", _m.myName)
        
        _m.app.stage.addChild(_m.playerLayer)
        _m.app.stage.interactive = true;
        _m.app.stage.on('mousemove', _m.onMouseMove)

        _m.socket.open();
        _m.socket.emit('enter', _m.myName)

    }

    _m.showLeaderBoard = function () {
        $("#gameArea").hide()
        $("#gameOver").hide()
        $("#leaderBoard").show()
        firebase.firestore().collection("leaderboard").orderBy("score", "desc").limit(10).get().then(qss => {
            let leaderBoardContent = qss.docs.map(doc => {
                let data = doc.data()
                return "<li>" + data['name'] + " : " + data['score'] + "</li>"
            }).join("")
            $("#rankContent").html(`<ol>${leaderBoardContent}</ol>`)
        })
    }

    _m.gameOver = function () {
        if(gameState.playing){
            _m.app.ticker.remove(_m.enterFrame);
            _m.socket.disconnect();
            gameState.playing = false;

            $("#score").html(gameState.elapsedTime / 100)
            $("#gameArea").hide()
            $("#leaderBoard").hide()
            $("#gameOver").show()
        }
    }

    return _m;
}) //End of define

