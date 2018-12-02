console.log("main.js loaded")

requirejs.config({
    paths: {
        "jquery": 'libs/jquery/dist/jquery',
        "PIXI": "libs/pixi.js/dist/pixi",
        "game": "game",
        "firebase": "//www.gstatic.com/firebasejs/5.5.5/firebase",
        "io":"//cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io",
        "Background":"Background",
    },
    shim: {
        'firebase': {
            exports: 'firebase'
        },
        'io':{
            exports: 'io'
        }
    }
});

requirejs(['firebase', 'game'], function (firebase, game) {
    console.log("app init")

    var config = {
        apiKey: "AIzaSyBkT9Ok9HY5p0kbgE9GTfBVx5s2fw-ryfk",
        authDomain: "seogang-60cf1.firebaseapp.com",
        databaseURL: "https://seogang-60cf1.firebaseio.com",
        projectId: "seogang-60cf1",
        storageBucket: "seogang-60cf1.appspot.com",
        messagingSenderId: "662589130095"
    };

    firebase.initializeApp(config);

    game.init()
    
});
