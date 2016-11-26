var http = require("http").createServer(handler);// on req - hand
var io = require("socket.io").listen(http); // socket.io for permanent connection between server and client
var fs = require("fs");// variable for file system for providing html
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    
    console.log("Connecting to Arduino");
    console.log("Activatoin of Pin 13");
    board.pinMode(2, board.MODES.OUTPUT);   // direction of DC motor
    board.pinMode(3, board.MODES.PWM); //PWM of motor
    board.pinMode(4, board.MODES.OUTPUT);   // direction of DC motor
    board.digitalWrite(2,1); // init to spin Left on start
    board.digitalWrite(4,0); // init to spin Left on start
});

function handler(req,res){
    fs.readFile(__dirname+"/Example12.html",
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
    
    socket.on("sendPWM", function(pwm){
        board.analogWrite(3,pwm);
        socket.emit("messageToClient", "PWM set to: " + pwm);        
    });
    
    socket.on("left", function(value){
        board.digitalWrite(2,value.AIN1); //directoin
        board.digitalWrite(4,value.AIN2); //direction
        socket.emit("messageToClient", "Direction: left");
    });
    
    socket.on("right", function(value){
        board.digitalWrite(2,value.AIN1); //directoin
        board.digitalWrite(4,value.AIN2); //directoin
        socket.emit("messageToClient", "Direction: right");
    });
    
   socket.on("stop", function(value){
        board.analogWrite(3,value); //STOP
        socket.emit("messageToClient", "STOP");
    });
    
    
    
}); //end of socket.on connection
    


});//end of board.on ready
