define(["PIXI"], function(PIXI){    
    let _m = {
        make:function(width, height, cellSize){
            let p = new PIXI.Graphics()

            p.beginFill(0xFFFFFF, 1)
            p.drawRect(-cellSize, -cellSize, width+cellSize*2, height+cellSize*2)
            p.endFill()
            p.lineStyle(1, 0xCCCCCC, 1)

            for(let i=-1;i<width/cellSize+1;i++){
                p.moveTo( i * cellSize, -cellSize)
                p.lineTo( i * cellSize, height+cellSize)
            }
            for(let j=-1;j<height/cellSize+1;j++){
                p.moveTo( -cellSize, j*cellSize)
                p.lineTo( width+cellSize, j*cellSize)
            }

            p.scollLike = function(x, y){
                p.x = x % cellSize
                p.y = y % cellSize
            }

            return p;
        }
    }

    console.log("Background lib loaded", _m)

    return _m
})