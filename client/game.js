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

    _m.addPlayer = function(name, x, y){

        let p = new PIXI.Graphics()
        let color = Math.random() * 0xFFFFFF;

        p.name = name;
        p.energy = 5;
        p.beginFill(color)
        p.drawCircle(0, 0, p.energy)
        p.endFill()
        p.x = x;
        p.y = y;
        _m.playerLayer.addChild(p)
        gameObj[name] = p;

        return p;
    }

    _m.onNewUser = function(data){
        if(gameState.playing)
            _m.addPlayer(data.name, data.x, data.y)
    }  

    _m.onMove = function(data){
        if(gameState.playing) {
            let name = data.name;
            let player = gameObj[name];
            player.x = data.pos.x;
            player.y = data.pos.y;
            player.moveVec = data.vec;
        }
    }

    _m.onOlsUsers = function(players){
        for(let name in players){
            let player = players[name]
            _m.addPlayer(player.name, player.pos.x, player.pos.y)
        }
    }

    _m.init = function () {

        console.log("game init")

        _m.socket = io("http://localhost:3001");

        _m.socket.on('new-user', _m.onNewUser);
        _m.socket.on('move', _m.onMove)
        _m.socket.on('old-users', _m.onOlsUsers)

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
            $("#gameArea").show()
            _m.resetGame();
        })

        _m.showLeaderBoard()



    } //End of init method

    _m.enterFrame = function (delta) {
        
        gameState.playTime = delta;

        for(let name in gameObj){
            let player = gameObj[name]
            if(!!player.moveVec){
                player.x += player.moveVec.x * delta
                player.y += player.moveVec.y * delta
            }
        }

        if(Math.floor(gameState.playTime * 10) % 5 == 0){
            let cursor = gameState.cursor;
            if(_m.myName in gameObj){
                let player = gameObj[_m.myName]
                let vec = {x:cursor.x-player.x, y:cursor.y-player.y}
                vec.x /= len(vec)
                vec.y /= len(vec)
                
                _m.socket.emit("move", {
                    name:_m.myName, 
                    vec:vec, 
                    pos:{
                        x:player.x, 
                        y:player.y
                    }
                })
            }
        }
    }

    _m.onMouseMove = function(event) {
        let cursor = event.data.global;
        gameState.cursor = cursor;
    }

    _m.resetGame = function () {

        gameObj = {};
        _m.app.stage.removeAllListeners();
        _m.app.stage.removeChildren();

        _m.app.ticker.add(_m.enterFrame);

        _m.playerLayer = new PIXI.Container();
        _m.myName = "player" + Math.floor(Math.random()*100);

        _m.app.stage.addChild(_m.playerLayer)
        _m.app.stage.interactive = true;
        _m.app.stage.on('mousemove', _m.onMouseMove)
        
        gameState.playing = true;

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

        _m.app.ticker.remove(_m.enterFrame);
        gameState.playing = false;

        $("#score").html(gameState.elapsedTime / 100)
        $("#gameArea").hide()
        $("#leaderBoard").hide()
        $("#gameOver").show()
    }

    return _m;
}) //End of define

