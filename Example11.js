var http = require("http").createServer(handler);// on req - hand
var io = require("socket.io").listen(http); // socket.io for permanent connection between server and client
var fs = require("fs");// variable for file system for providing html
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
console.log("Connecting to Arduino");
board.pinMode(0, board.MODES.ANALOG); //enable analog pin 0
console.log("Enabling analog Pin 0");
board.pinMode(1, board.MODES.ANALOG); // analog pin 1
console.log("Enabling analog Pin 1");
 
});

function handler(req,res){
    fs.readFile(__dirname+"/Example11.html",
    function(err,data){
        if (err){
            res.writeHead(500,{"Content-Type":"text/plain"});
            return res.end("Error loadin html page");
        }
    res.writeHead(200);
    res.end(data);
    });

} 

var desiredValue=0; //desire value var
var actualValue = 0; // variable for actual value (output value)

http.listen(8080); //server will listen on port 8080

var sendValueViaSocket; //var for sending messages

board.on("ready", function(){
    
board.analogRead(0, function(value){
    desiredValue=value; //continous read of analog  pin 0
});
board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
});

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, brd OK");
    
    
    setInterval(sendValues, 40, socket); //on 40ms trigerr func. sendValues
    
}); //end of socket.on connection
    
});//end of board.on ready

function sendValues (socket) {
    socket.emit("clientReadValues",
    { // json notation between curly braces
    "desiredValue": desiredValue,
    "actualValue": actualValue
    });
};

