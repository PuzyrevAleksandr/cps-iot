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
board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
 
});

function handler(req,res){
    fs.readFile(__dirname+"/Example13.html",
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

var factor = 0.1; // proportional factor that determines the speed of aproaching toward desired value
var pwm = 0; //pwm as global var

http.listen(8080); //server will listen on port 8080

var sendValueViaSocket; //var for sending messages

board.on("ready", function(){
    
board.analogRead(0, function(value){
    desiredValue=value; //continous read of analog  pin 0
});
board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
});

startControlAlgorithm ();

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, brd OK");
    
    
    setInterval(sendValues, 40, socket); //on 40ms trigerr func. sendValues
    
}); //end of socket.on connection
    
});//end of board.on ready


function controlAlgorithm () {
    pwm = factor*(desiredValue-actualValue);
    if(pwm > 255) {pwm = 255} // to limit the value for pwm / positive
    if(pwm < -255) {pwm = -255} // to limit the value for pwm / negative
    if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);} // direction if > 0
    if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);} // direction if < 0
    board.analogWrite(3, Math.abs(pwm)+28);
};

function startControlAlgorithm () {
    setInterval(function() {controlAlgorithm(); }, 30); // call alg on 30ms
    console.log("Control algorithm started");
};

function sendValues (socket) {
    socket.emit("clientReadValues",
    { // json notation between curly braces
    "desiredValue": desiredValue,
    "actualValue": actualValue
    });
};

