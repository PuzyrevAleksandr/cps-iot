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
    fs.readFile(__dirname+"/Example20.html",
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

var Kp = 0.55; // proportional factor       NOT USED
var Ki = 0.02; // integral factor       NOT USED
var Kd = 0.08; // differential factor  NOT USED
//var abs1 = 15; // min pwm pr            NOT USED
//var abs2 = 15; // min pwm PID           NOT USED

var pwm = 0;
var pwmLimit = 254;

var err = 0; // variable for second pid implementation
var errSum = 0; // sum of errors
var dErr = 0; // difference of error
var lastErr = 0; // to keep the value of previous error

var controlAlgorihtmStartedFlag = 0; // flag in global scope to see weather ctrlAlg has been started
var intervalCtrl; // var for setInterval in global space

http.listen(8080); //server will listen on port 8080

var sendValueViaSocket = function() {}; // function to send message over socket
var sendStaticMsgViaSocket = function() {}; // function to send static message over socket

var KpE = 0; // multiplication of Kp x error
var KiIedt = 0; // multiplication of Ki x integral of error
var KdDe_dt = 0; // multiplication of Kd x differential of error i.e.e Derror/dt

var errSumAbs = 0; // sum of absolute errors as performance measure

board.on("ready", function(){
    
board.analogRead(0, function(value){
    desiredValue=value; //continous read of analog  pin 0
});
board.analogRead(1, function(value) {
    actualValue = value; // continuous read of pin A1
});


io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, brd OK");
    socket.emit("staticMsgToClient", "Server connected, board ready.");
    
    setInterval(sendValues, 40, socket); //on 40ms trigerr func. sendValues
    
    socket.on("startControlAlgorithm", function(numberOfControlAlgorithm){
       startControlAlgorithm(numberOfControlAlgorithm);
    });
    
    socket.on("stopControlAlgorithm", function(){
        stopControlAlgorithm();
    });
    
    sendValueViaSocket = function (value) {
        io.sockets.emit("messageToClient", value);
    };
    
    sendStaticMsgViaSocket = function (value) {
        io.sockets.emit("staticMsgToClient", value);
    };

}); //end of socket.on connection
    
});//end of board.on ready


function controlAlgorithm (parameters) {
    if (parameters.ctrlAlgNo == 1) {
        err = desiredValue - actualValue; // error
        errSumAbs += Math.abs(err);
        pwm = parameters.pCoeff*err;
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);}; // direction if > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);}; // direction if < 0
        board.analogWrite(3, Math.abs(pwm)+parseInt(parameters.abs1));
      //  console.log(Math.round(pwm));
    }
    if (parameters.ctrlAlgNo == 2) {
        err = desiredValue - actualValue; // error
        errSum += err; // sum of errors, like integral
        dErr = err - lastErr; // difference of error
        errSumAbs += Math.abs(err);
        // for sending to client we put the parts to global scope
        KpE=parameters.Kp1*err;
        KiIedt=parameters.Ki1*errSum;
        KdDe_dt=parameters.Kd1*dErr;
        pwm = KpE + KiIedt + KdDe_dt; // above parts are used
        lastErr = err; // save the value for the next cycle
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);} // direction if > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);} // direction if < 0
        board.analogWrite(3, Math.abs(pwm)+parseInt(parameters.abs2));
    }
     if (parameters.ctrlAlgNo == 3) {
        err = desiredValue - actualValue; // error
        errSum += err; // sum of errors, like integral
        dErr = err - lastErr; // difference of error
        errSumAbs += Math.abs(err);
        // for sending to client we put the parts to global scope
        KpE=parameters.Kp2*err;
        KiIedt=parameters.Ki2*errSum;
        KdDe_dt=parameters.Kd2*dErr;
        pwm = KpE + KiIedt + KdDe_dt; // above parts are used
        lastErr = err; // save the value for the next cycle
        if(pwm > pwmLimit) {pwm = pwmLimit}; // to limit the value for pwm / positive
        if(pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit the value for pwm / negative
        if (pwm > 0) {board.digitalWrite(2,1); board.digitalWrite(4,0);} // direction if > 0
        if (pwm < 0) {board.digitalWrite(2,0); board.digitalWrite(4,1);} // direction if < 0
        board.analogWrite(3, Math.abs(pwm)+parseInt(parameters.abs3));
    }
};

function startControlAlgorithm (parameters) {
    if (controlAlgorihtmStartedFlag == 0) {
        controlAlgorihtmStartedFlag = 1; // set flag that the algorithm has started
        intervalCtrl = setInterval(function() {controlAlgorithm(parameters); }, 30);  // call alg on 30ms
        console.log("Control algorithm " + parameters.ctrlAlgNo + " started");
        sendStaticMsgViaSocket("Control algorithm " + parameters.ctrlAlgNo + " started | " + json2txt(parameters));
      }
};

function stopControlAlgorithm () {
    clearInterval(intervalCtrl); // clear the interval of control algorihtm
    board.analogWrite(3,0); // write 0 on pwm pin to stop the motor
    controlAlgorihtmStartedFlag = 0; // set flag that the algorithm has stopped
    pwm = 0; // set pwm to 0
	err = 0; // error
    errSum = 0; // sum of errors, like integral
    dErr = 0; // difference of error
    KpE = 0;
	KiIedt = 0;
    KdDe_dt = 0;
    errSumAbs = 0;
    console.log("ctrlAlg STOPPED");
    sendStaticMsgViaSocket("Stop");
};

function sendValues (socket) {
    socket.emit("clientReadValues",
    { // json notation between curly braces
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm": pwm,
    "err": err,
    "errSum": errSum,
    "dErr": dErr,
    "KpE": KpE,
    "KiIedt": KiIedt,
    "KdDe_dt": KdDe_dt,
    "errSumAbs": errSumAbs
    });
};

function json2txt(obj) // function to print out the json names and values
{
  var txt = '';
  var recurse = function(_obj) {
    if ('object' != typeof(_obj)) {
      txt += ' = ' + _obj + '\n';
    }
    else {
      for (var key in _obj) {
        if (_obj.hasOwnProperty(key)) {
          txt += '.' + key;
          recurse(_obj[key]);
        } 
      }
    }
  };
  recurse(obj);
  return txt;
}

