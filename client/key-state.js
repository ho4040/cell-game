define([], function(){
        
    let keyState = {};

    document.addEventListener('keydown', function(evt){    
        keyState[evt.code] = true;
    })

    document.addEventListener('keyup', function(evt){
        keyState[evt.code] = false;
    })

    return keyState

})
