//$(document).ready(function(){

$("#startButton").on("click", function(){
    Ajax.init();
});

var Events = {
    init: function() {
        this.rotate();
        $(".ship").on("click", function() {
            var size = $(this).attr("data-size");
            Board.setCurrentShip(size, true);
        })
    },

    rotate: function() {
        $("#gameCanvas").on("contextmenu", function(){
                Board.currentShip.horizontally = !Board.currentShip.horizontally;
                return false;
            }
        )
    }
};

var Board = {
    canvas: null,
    width: null,
    height: null,
    ctx: null,
    size: 0,
    currentShip: {size: null, horizontally: true},
    fieldSize: 30,
    bigLineSize: 10,
    mode: 0,

    init: function(){
        var canvas = $("#gameCanvas")[0];
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext("2d");
    },

    drawStatic: function(){
        var ctx = this.ctx;
        var width = this.width;
        var height = this.height;
        var bigLineSize = this.bigLineSize;
        var smallLineSize = 1;
        var fieldSize = this.fieldSize;

        ctx.beginPath();

        //line between two boards;
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.lineWidth = bigLineSize;
        ctx.stroke();

        var initialX = 0;
        var initialY = 0;
        var endsX = width/2 - bigLineSize/2;
        var horizontalPosition = 0;
        //boards
        for (var i = 0; i < 2; i++){
            //portable
            while (initialX < endsX) {
                this.size += 1;
                ctx.moveTo(initialX, 0);
                ctx.lineTo(initialX, height);
                initialX += fieldSize;
            }

            //horizontal
            while (initialY < height) {
                ctx.moveTo(horizontalPosition, initialY);
                ctx.lineTo(width/2 - bigLineSize/2, initialY);
                initialY += fieldSize;
            }

            initialX = width/2 + bigLineSize/2;
            endsX = width;
            initialY = 0;
            horizontalPosition = width;
        }
        this.size = this.size/2;
        ctx.lineWidth = smallLineSize;
        ctx.stroke();

        ctx.closePath();

    },

    setCurrentShip: function(shipSize, horizontally){
        this.currentShip.size = shipSize;
        this.currentShip.horizontally = horizontally;
    },

    drawShip: function(x, y, size, horizontally){

        var ctx = this.ctx;
        var fieldSize = this.fieldSize;
        x *= fieldSize;
        y *= fieldSize;
        if (horizontally){
            ctx.fillRect(x, y, fieldSize*size,fieldSize);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, fieldSize, fieldSize*size);
            ctx.fill();
        }
    },

    getXYtoDraw: function(x, y, isPlayerMove){

        var fieldSize = this.fieldSize;

        if (isPlayerMove){
            x = x*fieldSize + this.bigLineSize;
            y *= fieldSize;
        } else {
            x = x*fieldSize;
            y *= fieldSize;
        }
        return [x, y];
    },

    drawShoot: function(x, y, isPlayerMove){

        var ctx = this.ctx;
        var fieldSize = this.fieldSize;
        var coordinatesToDraw = this.getXYtoDraw(x,y,isPlayerMove);
        x = coordinatesToDraw[0];
        y = coordinatesToDraw[1];

        ctx.clearRect(x,y,fieldSize, fieldSize);
        ctx.fillStyle = "#6561C2";
        ctx.fillRect(x,y,fieldSize, fieldSize);


    },

    drawHit: function(x, y, isPlayerMove){

        var ctx = this.ctx;
        var fieldSize = this.fieldSize;
        var coordinatesToDraw = this.getXYtoDraw(x,y,isPlayerMove);
        x = coordinatesToDraw[0];
        y = coordinatesToDraw[1];

        ctx.clearRect(x,y,fieldSize, fieldSize);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(x,y,fieldSize, fieldSize);

    },


    getMousePosition: function(event) {

        var rect = Board.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    clickHandler: function() {

        var getMousePos = this.getMousePosition;
        var fieldSize = this.fieldSize;
        var width = this.width;
        var lineWidth = Board.bigLineSize;
        var that = this;
        $("#gameCanvas").on("click", function(e){

            var mode = that.mode;
            var mousePosition = getMousePos(e);
            var x = Math.floor(mousePosition.x/fieldSize);
            var y = Math.floor(mousePosition.y/fieldSize);
            var condition = (x < width / (2*fieldSize) - 1);
            if(mode == 1){
                x = Math.floor((mousePosition.x - lineWidth) / fieldSize);
                condition = (x > width / (2*fieldSize) - 1);
            }


            if (condition){
                if (mode == 0){
                    if (Board.currentShip.size !== null){
                        Ajax.putShip(x,y, Board.currentShip.size, Board.currentShip.horizontally);
                    }
                } else {
                    x -= Board.size;
                    Ajax.shoot(x,y);
                }
            }
        });

    }
};

Ajax = {
    url: "http://localhost:8080/api/",
    yourMove: true,

    init: function() {
        $.get(this.url + "initGame")
            .done(function() {
                $("#startDiv").addClass("hidden");
                $("#gameDiv").removeClass("hidden");
                Board.init();
                Board.drawStatic();
                Board.clickHandler();
                Events.init();

            })
            .fail(function(response){
                console.log("Error " + response.status, response.statusText);
            })
    },

    putShip: function(x, y, size, horizontally) {
        $.ajax({
            url: this.url + "placeShip",
            type: "POST",
            data: {x: x, y: y, size: size, horizontally: horizontally},
            dataType: "json"
        })
            .done(function( data ) {

                if (JSON.parse(data.response)) {
                    Board.drawShip(x, y, size, horizontally);
                    if(data.remaining < 1){
                        Board.setCurrentShip(null, true);
                        var btn = $(".size"+size);
                        btn.attr("disabled", "disabled");
                        btn.addClass("btn-success");
                        btn.removeClass("btn-info");
                        btn.removeClass("ship");
                    }

                    if (JSON.parse(data.complete)) {
                        $("#infoBox").text("Game started.");
                        Board.mode = 1;
                    }
                }
            })

            .fail(function( response ) {
                console.log("Error " + response.status, response.statusText);
            })
    },

    shoot: function(x, y) {
        if(!Ajax.yourMove){return}

            $.ajax({
                url: this.url + "shoot",
                data: {x: x, y: y},
                method: "POST"
            })
                .done(function ( data ) {
                    var infobox = $("#infoBox");
                    infobox.text("You turn");
                    if (!JSON.parse(data.success)){return;}

                    if (JSON.parse(data.hit)) {
                        Board.drawHit(x+Board.size,y, true);
                        if(JSON.parse(data.dead)){
                            //todo: draw dead ship;
                            infobox.text("BUMMM!");

                            Ajax.isEndGame();
                        }

                    } else {
                        console.log(x,y);
                        Board.drawShoot(x+Board.size, y, true);
                        Ajax.getOpponentShot();
                    }
                })

                .fail(function (response) {
                    console.log("Error " + response.status, response.statusText);
                })
    },

    getOpponentShot: function() {
        Ajax.yourMove = false;

        $.get(this.url + "getShoot")
            .done(function( response ){
                if (JSON.parse(response.hit)){
                    Board.drawHit(response.x, response.y, false);
                    setTimeout(function(){
                        Ajax.getOpponentShot();
                    }, 250);
                } else {
                    Board.drawShoot(response.x, response.y, false);
                    Ajax.yourMove = true;
                }

            })

            .fail(function( response ){
                console.log("Error " + response.status, response.statusText);
                Ajax.yourMove = true;
            })
    },

    isEndGame: function() {
        $.get(this.url + "endGame")
            .done(function( response ) {
                if (JSON.parse(response.isEndGame)) {
                    $("#gameCanvas").unbind();
                    $("infoBox").text("Game was end");
                    Ajax.yourMove = false;
                }
            })

            .fail(function(response) {
                console.log(response);
            });

    }
};

//});

