class MultiPlayerSocket{
    constructor(playground){
        this.playground = playground;

        this.ws = new WebSocket("wss://app5638.acapp.acwing.com.cn/wss/multiplayer/");

        this.start();
    }

    start(){
        this.receive();
    }

    receive(){
        let outer = this;
        this.ws.onmessage = function(e){
            let data = JSON.parse(e.data); // 将json 转换成 js对象
            console.log("mps receive:", data);
            if(data.uuid === outer.uuid){
                console.log("mps recevie: I joined");
                return false;
            }

            let event = data.event;
            if(event === "create_player"){
                outer.receive_create_player(data.uuid, data.username, data.photo);
            }
        }
    }

    send_create_player(username, photo){
        console.log("send_create_player: ", username, photo);
        let outer = this;
        //向服务器发送信息
        this.ws.send(JSON.stringify({ // 将 js 对象 转化成 json
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo,
        }));
    }
    
    //有新玩家进入，将新玩家同步到本地
    receive_create_player(uuid, username, photo){
        let pd = this.playground;
        let player = new Player(pd, pd.width/2/pd.scale, 0.5, 0.05, "white", 0.15, "enemy", username, photo);
        player.uuid = uuid;
        this.playground.players.push(player);
    }
}
