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
        $("#gameCanvas").on("contextmenu", function(e){
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
    currentShip: {size: null, horizontally: true},
    fieldSize: 30,
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
        var bigLineSize = 10;
        var smallLineSize = 1;
        var fieldSize = this.fieldSize;

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
        ctx.lineWidth = smallLineSize;
        ctx.stroke();
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
        var mode = this.mode;

        $("#gameCanvas").on("click", function(e){
            var mousePosition = getMousePos(e);
            var x = Math.floor(mousePosition.x/fieldSize);
            var y = Math.floor(mousePosition.y/fieldSize);
            if (x > Board.width / 2){
                return;
            }
            if (mode == 0){
                if (Board.currentShip.size !== null){
                    Ajax.putShip(x,y, Board.currentShip.size, Board.currentShip.horizontally);
                }
            } else {
                Ajax.shoot(x,y);
            }
        });

    }
};

Ajax = {

    init: function() {
        $.get("http://localhost:8080/initGame")
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
            url: "http://localhost:8080/placeShip",
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
                    }
                }
            })

            .fail(function( response ) {
                console.log(response);
                console.log("Error " + response.status, response.statusText);
            })
    },

    shoot: function(x, y) {
        //todo
    }
};



//});

