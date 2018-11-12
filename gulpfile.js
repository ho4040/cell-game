const browserSync = require('browser-sync');
const gulp = require('gulp');
const cellServer = require("./server/cell-game-server.js");

const fs = require('fs');
var ncp = require('ncp').ncp;

gulp.task('build', function(){
    const folders = [
        'public',
        'public/',
        'public/static',
        'public/libs',
    ]

    folders.forEach(dir=>{
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log('📁  folder created:', dir);    
        }
    })

    gulp.src("client/**").pipe(gulp.dest('public/'))    
    gulp.src("resources/**").pipe(gulp.dest('public/static'))
   
    ncp("node_modules/pixi.js", "public/libs/pixi.js", {clobber:true}, function(err){})
    ncp("node_modules/jquery", "public/libs/jquery", {clobber:true}, function(err){})
    ncp("node_modules/requirejs", "public/libs/requirejs", {clobber:true}, function(err){})
})

gulp.task('serve', function(){
    initBrowserSync('client');
    gulp.watch("client/**", function(evt){
        browserSync.reload(evt.path);
    });
})

function initBrowserSync(baseDir){
    cellServer.run()
    browserSync.init({
        server:{
            baseDir:baseDir,
            routes:{
                '/libs':"node_modules",
                '/static':'resources'
            }
        },
        single:true,
        startPath:"/",
        browser:"chrome"
    })
}