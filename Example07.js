var http = require("http").createServer(handler);// on req - hand
var io = require("socket.io").listen(http); // socket.io for permanent connection between server and client
var fs = require("fs");// variable for file system for providing html
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    
    console.log("Connecting to Arduino");
    console.log("Activatoin of Pin 13");
    board.pinMode(13, board.MODES.OUTPUT); //pin 13 as out
    console.log("Activation of Pin 8");
    board.pinMode(8, board.MODES.OUTPUT);  //pin 8 as out
    console.log("Enabling push Button on pin 2")
    board.pinMode(2, board.MODES.INPUT)   // pin 2 as in
 
});

function handler(req,res){
    fs.readFile(__dirname+"/Example07.html",
    function(err,data){
        if (err){
            res.writeHead(500,{"Content-Type":"text/plain"});
            return res.end("Error loadin html page");
        }
    res.writeHead(200);
    res.end(data);
    });

} 
http.listen(8080); //server will listen on port 8080

var sendValueViaSocket; //var for sending messages

board.on("ready", function(){

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, brd OK");
    
    sendValueViaSocket = function (value){
        io.sockets.emit("messageToClient", value);
    };
    }); //end of socket.on connection
    
board.digitalRead(2,function(value){
    if (value==0){
        console.log("LED OFF");
        board.digitalWrite(13, board.LOW);
       
        sendValueViaSocket(0);
    }
    if (value==1){
        console.log("LED ON");
        board.digitalWrite(13, board.HIGH);
        sendValueViaSocket(1);
    }
});

});//end of board.on ready

