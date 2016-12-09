var firmata = require("firmata");

var board = new firmata.Board("/dev/ttyACM0",function(){
    console.log("Priključitev na Arduino");
    console.log("Firmware: " + board.firmware.name + "-" + board.firmware.version.major + "." + board.firmware.version.minor); // izpišemo verzijo Firmware
    console.log("Omogočimo pine");
    board.pinMode(13, board.MODES.OUTPUT);  
    board.pinMode(0, board.MODES.ANALOG); //enable analog pin 0
console.log("Enabling analog Pin 0");
board.pinMode(1, board.MODES.ANALOG); // analog pin 1
console.log("Enabling analog Pin 1");
board.pinMode(2, board.MODES.OUTPUT); // direction of DC motor
board.pinMode(3, board.MODES.PWM); // PWM of motor i.e. speed of rotation
board.pinMode(4, board.MODES.OUTPUT); // direction DC motor
 
});






var desiredValue=0; //desire value var
var actualValue = 0; // variable for actual value (output value)

var factor = 0.3; // proportional factor that determines the speed of aproaching toward desired value
var pwm = 0; //pwm as global var



var sendValueViaSocket; //var for sending messages
var i;
var fs  = require("fs");

var options = {
  key: fs.readFileSync('privatekey.pem'),
  cert: fs.readFileSync('certificate.pem')
};

var https = require("https").createServer(options, handler) // tu je pomemben argument "handler", ki je kasneje uporabljen -> "function handler (req, res); v tej vrstici kreiramo server! (http predstavlja napo aplikacijo - app)
  , io  = require("socket.io").listen(https, { log: false })
  , url = require("url");

send404 = function(res) {
    res.writeHead(404);
    res.write("404");
    res.end();
}

//process.setMaxListeners(0); 

//********************************************************************************************************
// Simple routing ****************************************************************************************
//********************************************************************************************************
function handler (req, res) { // handler za "response"; ta handler "handla" le datoteko index.html
    var path = url.parse(req.url).pathname; // parsamo pot iz url-ja
    
    switch(path) {
    
    case ('/') : // v primeru default strani

    fs.readFile(__dirname + "/Example30.html",
    function (err, data) { // callback funkcija za branje tekstne datoteke
        if (err) {
            res.writeHead(500);
            return res.end("Napaka pri nalaganju strani pwmbutton...html");
        }
        
    res.writeHead(200);
    res.end(data);
    });
     
    break;    
            
    default: send404(res);
            
    }
}
//********************************************************************************************************
//********************************************************************************************************
//********************************************************************************************************

https.listen(8080); // določimo na katerih vratih bomo poslušali | vrata 80 sicer uporablja LAMP | lahko določimo na "router-ju" (http je glavna spremenljivka, t.j. aplikacija oz. app)

console.log("Use (S) httpS! - System Start - Use (S) httpS!"); // na konzolo zapišemo sporočilo (v terminal)

var sendDataToClient = 1; // flag to send data to the client

var STARTctrlFW = 0; // flag for control algorithm start

board.on("ready", function(){
    


startControlAlgorithm ();

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, brd OK");
    
    
    setInterval(sendValues, 40, socket); //on 40ms trigerr func. sendValues
    
    socket.on("left", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        i=1;
         console.log("1");
        board.digitalWrite(13, board.HIGH); // na pinu 3 zapišemo vrednost HIGH
    });
    
	socket.on("center", function(data) {
	    i=0;
        board.digitalWrite(13, board.LOW); // na pinu 3 zapišemo vrednost HIGH
    });
    
    socket.on("right", function(data) { // ko je socket ON in je posredovan preko connection-a: ukazArduinu (t.j. ukaz: išči funkcijo ukazArduinu)
        i=2;
         console.log("2");
        board.digitalWrite(13, board.HIGH); // na pinu 3 zapišemo vrednost HIGH
    });
}); //end of socket.on connection
    
});//end of board.on ready


function controlAlgorithm () {
    if (i==1) {board.digitalWrite(2,1); board.digitalWrite(4,0);board.analogWrite(3, 50);} // direction if > 0
    if (i==2) {board.digitalWrite(2,0); board.digitalWrite(4,1);board.analogWrite(3, 50);} // direction if < 0
    if (i==0) {board.digitalWrite(2,1); board.digitalWrite(4,0);board.analogWrite(3, 0);} // direction if > 
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

