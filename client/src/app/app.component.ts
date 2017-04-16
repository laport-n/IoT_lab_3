import { Component,  OnInit, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { SocketService } from './socket.service';

class PICC {
  name:string;
  afi: string;
  cid: string;
  N: number;
  R: number;
  cycle: number;
  connection: any;
  messages: Array<any> = [];
  PCDres: any;
  log: Array<string> = [];
  state: string;
  connected: number;
  public static messageToReceive: number;
  public static collision: number;
  public static messageReceive: number;



  constructor(name, afi, public http, private SocketService: SocketService) {
    this.name = name;
    this.afi = "0";
    this.cid = Math.floor((Math.random() * 100) + 1).toString();
    this.cycle = 0;
    this.N = Math.floor((Math.random() * 5) + 1);
    this.R = 0;
    this.state = 'IDLE';
    PICC.collision = 0;
    PICC.messageReceive = 0;
    this.connected = 0;
    PICC.messageToReceive = 3;
  }

  sendMessage(type, message){
    this.SocketService.sendMessage(type, message);
  }

  Init(){
    this.connection = this.SocketService.getMessages()
    .subscribe(messageSocket => {
         this.PCDres = JSON.parse(JSON.stringify(messageSocket));
         if (this.state == 'IDLE' && this.PCDres.state == "finish" && this.cid == this.PCDres.cid){
           this.log.push("FINI");
           this.state = 'READY-DECLARED';
           PICC.messageToReceive--;
           this.Destroy();
         }
         if (this.state == 'IDLE'){
           PICC.messageReceive++;
           if (this.PCDres.for == 'IDLE'){
             if (this.PCDres.N == 1){
               PICC.collision++;
               this.log.push("N = 1 : " + JSON.stringify(this.PCDres));
               this.sendMessage('ATQB', {
                   "collision" : PICC.collision,
                   "messageReceive" : PICC.messageReceive,
                   "cid" : this.cid
               });
             } else if (this.PCDres.N == this.N && this.R != 0){
                 PICC.collision++;
                 this.log.push("R = N : " + JSON.stringify(this.PCDres));
                 this.sendMessage('ATQB', {
                   "collision" : PICC.collision,
                   "messageReceive" : PICC.messageReceive,
                   "cid" : this.cid,
                   "ending": true
                 });
              } else if (this.PCDres.N > 1){
                this.R = Math.floor((Math.random() * 5) + 1);
                this.log.push("N > 1");
                if (this.R == 1){
                  PICC.collision++;
                  this.log.push("R = 1 : " + JSON.stringify(this.PCDres));
                  this.sendMessage('ATQB', {
                    "collision" : PICC.collision,
                    "messageReceive" : PICC.messageReceive,
                    "cid" : this.cid,
                    "ending": true
                  });
              } else {
                 this.R = Math.floor((Math.random() * 5) + 1);
                 this.N = this.R;
                 this.log.push("R > 1 : so N become R and PICC wait for SLOT-MARKER");
                 this.log.push("")
                 this.sendMessage('ATQB', {
                   "collision" : PICC.collision,
                   "messageReceive" : PICC.messageReceive,
                   "cid":""
                 });
               }
             }
           }
         }

        if (PICC.messageReceive === PICC.messageToReceive){
          PICC.messageReceive = 0;
          PICC.collision = 0;
        }
    })
    if (this.connected == 0){
      this.log.push("CONNEXION");
      this.SocketService.sendMessageConnexion({
        "state": this.state
      });
      this.connected++;
    }
  }

  Destroy() {
    this.connection.unsubscribe();
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [SocketService]
})

export class AppComponent implements OnInit, OnDestroy  {
  piccList : Array<PICC> = [];

  constructor(public http : Http,  private chatService:SocketService){
    for (var i = 0; i < 3; i++){
      this.piccList[i] = new PICC("PICC : " + i, i, this.http, chatService);
    }
  }

  ngOnInit() {
    for (var i = 0; i < 3; i++){
      this.piccList[i].Init();
    }
  }

  ngOnDestroy() {
    for (var i = 0; i < 3; i++){
      this.piccList[i].Destroy();
    }
  }

}
