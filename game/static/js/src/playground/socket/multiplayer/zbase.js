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
            //console.log("我看看message是啥信息", e);
            let data = JSON.parse(e.data); // 将json 转换成 js对象
            if(data.uuid === outer.uuid){
                //console.log("mps recevie: I joined");
                return false;
            }

            //console.log("mps receive:", data);
            let event = data.event;
            if(event === "create_player"){
                outer.receive_create_player(data.uuid, data.username, data.photo);
            } else if(event === "move_to"){
                outer.receive_move_to(data.uuid, data.tx, data.ty);
            } else if(event === "shoot_fireball"){
                outer.receive_shoot_fireball(data.uuid, data.tx, data.ty, data.fireball_uuid);
            } else if(event === "attack"){
                outer.receive_attack(data.uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            } else if(event === "blink"){
                outer.receive_blink(data.uuid, data.tx, data.ty);
            }
        }
    }

    send_create_player(username, photo){
        //console.log("send_create_player: ", username, photo);
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
        //console.log("receive_create_player:收到其他玩家信息,uuid:", player.uuid);
    }

    send_move_to(tx, ty){
        //console.log("send_move_to:", tx, ty);
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty
        }));
    }

    receive_move_to(uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player){
            //console.log("receive_move_to:收到玩家移动信息啦");
            player.move_to(tx, ty);
        }
    }


    send_shoot_fireball(tx, ty, fireball_uuid){
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid' : outer.uuid,
            'tx': tx,
            'ty': ty,
            'fireball_uuid': fireball_uuid
        }));
    }

    receive_shoot_fireball(uuid, tx, ty, fireball_uuid){
        let outer = this;
        let player = this.get_player(uuid);
        if(player){
            let fireball =  player.shoot_fireball(tx, ty);
            fireball.uuid = fireball_uuid;
        }
    }

    //不太理解，摧毁火球应该在各自本地都能实现
    //当其他人(B)点击发送火球后，自己(A)收到消息，在players找到player_B
    //并且调用player_B.shoot_fireball, 为player_B生成火球，并且将player_B的火球uuid改成B的火球uuid
    //那么当火球移动完或射中敌人后，会调用player_B.fireballs.destroy()

    send_attack(attackee_uuid, x, y, angle, damage, fireball_uuid) { //被攻击者的uuid，被攻击者的坐标，角度，伤害，击中炮弹的uuid
        let outer = this;                                    //因为攻击发出者是自己，所以就不用再传一个攻击者的uuid
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attackee_uuid': attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'fireball_uuid': fireball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, angle, damage, fireball_uuid){//攻击者，被攻击者，强制更新被攻击者当前的坐标，移动角度，伤害
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);

        if (attacker && attackee) {
            attackee.receive_attack(x, y, angle, damage, fireball_uuid, attacker);
        }
    }



    send_blink(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }
    receive_blink(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }


    get_player(uuid){
        let players = this.playground.players;
        for(let i = 0; i < players.length; i++){
            if(players[i].uuid === uuid){
                return players[i];
            }
        }
        return null;
    }
}
