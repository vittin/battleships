$("#startButton").on("click", function(){

    $.get("http://localhost:8080/initGame")
        .done(function( data ) {
            //alert( "Data Loaded: " + data );
            $("#startDiv").addClass("hidden");
            $("#gameDiv").removeClass("hidden");
        })
        .fail(function(response){
            console.log("Error " + response.status, response.statusText);
    })
});