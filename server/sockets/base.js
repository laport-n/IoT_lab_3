module.exports = function (io) {

  let N = 0;
  let avoidCollision = 0;
  let messageReceive = 0;
  let connexion = 0;
  let messageToReceive = 3;
  let PICCtoStop = "";

  io.on('connection', (socket) => {

  //PICC connexion
  //PCD Declare new SLOT N
  //PCD Send first REQB request with N(rand)
  socket.on('connexion',  (message) => {
      if (connexion == 0){
        console.log("\nNEW SEQUENCE \n")
        N = Math.floor((Math.random() * 3) + 1);
        PICCtoStop = "";
        messageToReceive = 3;
      } else if (connexion == 3){
        connexion = 0;
        messageToReceive = 3;
        PICCtoStop = "";
      }
      console.log('PPICC connected');
      connexion++;
      let PICCmessage = JSON.parse(JSON.stringify(message));
      if (PICCmessage.state == "IDLE"){
        socket.emit('message', {
            'type' : 'REQB',
            'fai' : 0,
            'N'   : N,
            'for' : 'IDLE'
        });
      }
    });

    socket.on('ATQB', (message) => {
      let PICCmessage = JSON.parse(JSON.stringify(message));
      if (PICCmessage.collision > 1 && PICCmessage.messageReceive == messageToReceive){
          console.log("PCD Encounter PICC collisions");
          console.log("PCD change N slot");
          console.log('PCD Send REQB cause of collisions');
          N = Math.floor((Math.random() * 5) + 1);
          io.emit('message', {
              'type' : 'REQB',
              'fai' : 0,
              'N'   : N,
              'for' : 'IDLE'
          });
        } else if (PICCmessage.collision == 0 && PICCmessage.messageReceive == messageToReceive){
          N = Math.floor((Math.random() * 5) + 1);
          console.log('Send slot-MARKER cause of PICC N/R not match');
          if (messageToReceive == 1 && PICCmessage.cid != ""){
            PICCtoStop = PICCmessage.cid;
            io.emit("message",{
              "state": "finish",
              "cid": PICCtoStop
            });
          } else {
            io.emit('message', {
                'type' : 'REQB',
                'fai' : 0,
                'N'   : N,
                'for' : 'IDLE'
              });
            }
        } else if (PICCmessage.collision == 1 && messageToReceive == 1){
          console.log("LAST PICC OK CLOSED");
          io.emit("message",{
            "state": "finish",
            "cid": PICCmessage.cid
          });
        } else if (PICCmessage.collision == 1){
            if (PICCmessage.ending == true){
              console.log(JSON.stringify(PICCmessage));
              PICCtoStop = PICCmessage.cid;
            }
            if (PICCmessage.messageReceive == messageToReceive && PICCtoStop != ""){
              console.log("PICC OK CLOSED");
              messageToReceive--;
              io.emit("message",{
                "state": "finish",
                "cid": PICCtoStop
              });
              PICCtoStop = 0;
              setTimeout(function(){
                if (messageToReceive > 0){
                  N = Math.floor((Math.random() * 5) + 1);
                  io.emit('message', {
                      'type' : 'REQB',
                      'fai' : 0,
                      'N'   : N,
                      'for' : 'IDLE'
                  });
                }
              }, 1000)
            }
        }
    });

    socket.on('disconnect', function(){
      console.log('The PICC is disconnected');
    });

    socket.on('add-message', (message) => {
      console.log(message);
      io.emit('message', {
        type:'new-message', text: message}
      );
    });
  });
}
