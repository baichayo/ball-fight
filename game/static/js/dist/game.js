class AcGameMenu {
    constructor(root){
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div></br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div></br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings-mode">
            退出账号
        </div></br>
    </div>
</div>
`);
        this.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings-mode');

        this.start();
    }

    start(){
        this.add_listening_events();
    }
    
    add_listening_events(){
        let outer = this;

        this.$single_mode.click(function(){
            //confirm("你想进行单人模式吗");
            outer.hide();
            outer.root.playground.show("single mode");
        });

        this.$multi_mode.click(function(){
            //confirm("嘟嘟嘟，还在努力开发中...");
            outer.hide();
            outer.root.playground.show("multi mode");
        });

        this.$settings.click(function(){
            //confirm("打开设置");
            outer.root.settings.logout_on_remote();
        });
    }

    show(){//显示menu界面
        this.$menu.show();
    }

    hide(){//关闭menu界面
        this.$menu.hide();
    }  
}
let AC_GAME_OBJECTS = [];


class AcGameObject{
    constructor(){
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;//是否执行过start函数
        this.timedelta = 0; //当前帧距离上一帧的时间间隔 ms

        this.uuid = this.create_uuid();

    }

    start(){//只会在第一帧执行一次
    
    }

    update(){//每帧执行一次

    }

    create_uuid(){
        let res = "";
        for(let i = 0; i < 8; i++){
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }
        return res;
    }

    on_destroy(){//在销毁前执行一次

    }

    destroy(){//删掉该物体
        this.on_destroy();

        for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
            if(AC_GAME_OBJECTS[i] === this){
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp){
    for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
        let obj = AC_GAME_OBJECTS[i];
        if(!obj.has_called_start){
            obj.start();
            obj.has_called_start = true;
        } else{
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);
}

requestAnimationFrame(AC_GAME_ANIMATION);
class GameMap extends AcGameObject {
    constructor(playground){
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start(){

    }

    update(){
        this.render();
    }

    render(){
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize(){
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
class NoticeBoard extends AcGameObject {
    constructor(playground){
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "已就绪：0人";
    }

    start(){}

    write(text){
        this.text = text;
    }

    update(){
        this.render();
    }

    render(){
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed, move_length){
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.friction = 0.5;
        this.eps = 1 / this.playground.scale;
    }

    start(){
    }

    update(){
        if(this.speed < this.eps || this.move_length < 0){
            this.destroy();
            return false;
        }
        
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;
        this.speed *= this.friction;

        //console.log(this.move_length);

        this.render();
    }

    render(){
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, role, username, photo){ // radius = 0.05 speed=0.15
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.role = role;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01; //scale 的 1%

        //受伤害之后的速度
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.friction = 0.9;//摩擦力

        this.spend_time = 0;//AI开局射击冷静期
        this.last_fireball_time = 0;//上次开火时间 ms
        this.is_alive = true;//是否存活
        this.cur_skill = null;

        //技能
        this.fireballs = [];

        this.img = new Image();
        this.img.src = "";
        
        this.fireball_coldtime = 0;
        this.fireball_img = new Image();
        this.fireball_img.src = "";

        this.blink_coldtime = 0;
        this.blink_img = new Image();
        this.blink_img.src = "";
    }

    start(){
        this.playground.player_count ++ ; //当新建玩家就在计分牌处++
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人");

        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

        if(this.role !== "robot"){
            this.img.src = this.photo;
            if(this.role === "me"){
                this.fireball_coldtime = 3;
                this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";
                
                this.blink_coldtime = 3;
                this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";


                this.add_listening_events();
            }
        } else{
            console.log("robot spawn");
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }

    add_listening_events(){
        //console.log("start listening events...");
        let outer = this;//class的this

        this.playground.game_map.$canvas.on("contextmenu", function(){
            return false;
        });

        this.playground.game_map.$canvas.mousedown(function(e){
            //if(!outer.is_alive) return false;
            if(outer.playground.state !== "fighting") return false;

            const rect = outer.ctx.canvas.getBoundingClientRect();


            if(e.which === 3){
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                outer.move_to(tx, ty);
                if(outer.playground.mode === "multi mode"){
                    outer.playground.mps.send_move_to(tx, ty);
                }
            } else if(e.which === 1){
                let cur_time = new Date().getTime();
                //console.log(typeof(cur_time) + " cur_time: " + cur_time);
                //console.log("delta: " , cur_time - outer.last_fireball_time);
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                if(outer.cur_skill === "fireball" && cur_time - outer.last_fireball_time >= 0 * 1000){
                    outer.last_fireball_time = cur_time;

                    let fireball = outer.shoot_fireball(tx, ty);

                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                    }
                } else if(outer.cur_skill === "blink" && outer.blink_coldtime < 0.01){
                    outer.blink(tx, ty);
                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_blink(tx, ty);
                    }
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e){
            if(outer.playground.state !== "fighting") return true;

            if(e.which === 81){//q键
                outer.cur_skill = "fireball";
                return false;
            } else if(e.which === 70){
                outer.cur_skill = "blink";
                return false;
            }
        });

    }

    shoot_fireball(tx, ty){
        //console.log(tx, ty);
        this.fireball_coldtime = 3;

        let x = this.x, y = this.y;
        let radius = 0.01;
        let angle = Math.atan2(ty - y, tx - x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 1.5;
        let move_length = 1.0;

        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
        this.fireballs.push(fireball);

        return fireball;
    }

    blink(tx, ty){
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;
        this.move_length = 0;
    }

    get_dist(x1, y1, x2, y2){
        let dx = x1 - x2;
        let dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty){
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        //个人理解，这里的vx, vy 都是向量
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
        if(this.role === "me"){
            console.log("move_to: ", tx, ty);
        }
    }

    is_attacked(angle, damage){//damage=0.01
        console.log("is_attacked: angle, damage", angle, damage);
        this.radius -= damage;


        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;

        this.speed *= 1.7;//球体越小速度越高

        //烟花
        for(let i = 0; i < 10 + Math.random() * 5; i++){
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.2;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 15;
            let move_length = this.radius * Math.random() * 20;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }
        if(this.radius <= 0.00001){
            this.destroy();
            return false;
        }
    }

    receive_attack(x, y, angle, damage, fireball_uuid, attacker) {
        attacker.destroy_fireball(fireball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    update(){
        this.update_AI_shoot();
        this.update_move();
        this.update_coldtime();

        this.render();
    }

    update_AI_shoot(){ //AI自主射击
        if(this.role === "robot" && (this.spend_time += this.timedelta/1000) > 3 && Math.random() < 1 / 60.0 / 3){//五秒射击一次
            let player = this.playground.players[0];

            let tx = player.x + this.vx * player.speed * this.timedelta / 1000 * 1;
            let ty = player.y + this.vy * player.speed * this.timedelta / 1000 * 1;

            this.shoot_fireball(tx, ty);
        }
    }

    update_move(){
        if(this.damage_speed > 50 / this.playground.scale){//受到伤害
            //取消玩家操作
            this.vx = this.vy = 0;
            this.move_length = 0;

            //受伤害强制移动
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
            //console.log(this.damage_speed);
        } else {//没受到伤害，正常移动
            if(this.move_length < this.eps){//移动完毕
                this.move_length = 0;
                this.vx = this.vy = 0;

                if(this.role === "robot"){//判断条件存疑 机器人移动完毕继续移动
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
                    this.move_to(tx, ty);
                }
            } else{
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);//合向量上的移动距离
                //console.log(moved);
                this.x += moved * this.vx;
                this.y += moved * this.vy;
                this.move_length -= moved;
            }
        }
    }

    update_coldtime(){
        this.fireball_coldtime -= this.timedelta/1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);

        this.blink_coldtime -= this.timedelta/1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    on_destroy(){
        console.log("player dead");

        for(let i = 0; i < this.playground.players.length; i++){
            //let player = this.playground.players[i];
            if(this.playground.players[i] === this){
                this.is_alive = false;
                this.playground.players.splice(i, 1);
                break;
            }
        }

        if(this.role === "me"){
            this.playground.state = "over";
        }

        if(this.role === "me"){
            confirm("You Lose???菜狗一个");
            if(this.playground.root.AcWingOS) this.playground.root.AcWingOS.api.window.close();
            else location.reload();
        }
        else if(this.playground.players.length == 1){
            if(this.playground.players[0].role === "me") {
                confirm("You Win!!!奖励一个捏捏");
                if(this.playground.root.AcWingOS) this.playground.root.AcWingOS.api.window.close();
                else location.reload();
            }
        }
    }

    destroy_fireball(uuid){
        for(let i = 0; i < this.fireballs.length; i++){
            let fireball = this.fireballs[i];
            if(fireball.uuid === uuid){
                fireball.destroy();
                break;
            }
        }
    }

    render(){
        let scale = this.playground.scale;
        if(this.role !== "robot"){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else{
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if(this.role === "me" && this.playground.state === "fighting"){
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime(){
        let x = 1.5, y = 0.9, r = 0.04;

        let scale = this.playground.scale;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.fireball_coldtime > 0){
            this.ctx.beginPath();
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI/2, Math.PI * 2 * (1 - this.fireball_coldtime/3) - Math.PI/2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(128, 128, 128, 0.6)";
            this.ctx.fill();
        }


        x = 1.62, y = 0.9, r = 0.04;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.blink_coldtime > 0){
            this.ctx.beginPath();
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI/2, Math.PI * 2 * (1 - this.blink_coldtime/5) - Math.PI/2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(128, 128, 128, 0.6)";
            this.ctx.fill();
        }


    }
}
class FireBall extends AcGameObject {
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage){// radius=0.01 damage = 0.01
        super();
        this.playground = playground;
        this.player = player;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;

        this.eps = 0.1;
        //this.start();
    }

    start(){
        //console.log("new fireball", this.color, this.move_length, this.speed, this.vx, this.vy);
    }

    update(){
        if(this.move_length < this.eps){
            this.destroy();
            return false;
        }

        this.update_move();

        if(this.player.role !== "enemy"){//多人模式下只检测自己的火球
            this.update_attack();
        }

        this.render();
    }

    update_move(){
        //console.log("moving..");
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;
    }

    update_attack(){//检测碰撞
        for(let i = 0; i < this.playground.players.length; i++){
            let player = this.playground.players[i];
            if(this.player !== player && this.is_collision(player)){
                this.attack(player);
                break;
            }
        }

    }

    get_dist(x1, y1, x2, y2){
        let dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(player){
        let distance = this.get_dist(this.x, this.y, player.x, player.y);//火球和敌人的圆心距
        if(distance < this.radius + player.radius)
            return true;
        return false;
    }

    attack(player) {
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage);

        if (this.playground.mode === "multi mode") {
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
        }

        this.destroy();
    }

    //fireball销毁顺序：达到销毁条件后，调用this.destroy()
    //this.destroy()调用on_destroy()，将火球从play.fireballs中删除
    //this.destroy()删除AcGameObject对象
    //问题来了，player中的destroy_fireball()啥时候执行
    on_destroy(){
        let fireballs = this.player.fireballs;
        for(let i = 0; i < fireballs.length; i++){
            if(fireballs[i] === this){
                fireballs.splice(i, 1);
                break;
            }
        }
    }

    render(){
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
class AcGamePlayground {
    constructor(root){
        this.root = root;
        this.$playground = $(`
        <div class="ac-game-playground"></div>
        `);

        this.hide();
        this.root.$ac_game.append(this.$playground);

        this.start();
    }

    get_random_color(){
        let colors = ["blue", "pink", "green", "red", "yellow"];
        return colors[Math.floor(Math.random() * colors.length)]
    }

    start(){
        let outer = this;
        $(window).resize(function(){
            outer.resize();
        })
    }

    resize(){
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width/16, this.height/9);
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height;
        //console.log("resize:", this.width, this.height);
        if(this.game_map) this.game_map.resize();
    }


    show(mode){//打开playground界面
        let outer = this;
        this.$playground.show();

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);

        this.mode = mode;
        this.state = "waiting";
        this.notice_board = new NoticeBoard(this);
        this.player_count = 0;

        this.resize();
        //将球的大小全变成相对 scale 的百分比
        this.players = [];
        this.players.push(new Player(this, this.width/2/this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));

        if(mode === "single mode"){
            for(let i = 0; i < 5; i++){
                this.players.push(new Player(this, this.width/2/this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
            }
        } else if(mode === "multi mode"){
            this.mps = new MultiPlayerSocket(this);
            this.mps.uuid = this.players[0].uuid;//uuid继承自AcGameObject类

            this.mps.ws.onopen = function(){ //onopen 应该是 ws 自带的
                console.log("ws onopen");
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            };
        }

    }

    hide(){//关闭playground界面
        this.$playground.hide();
    }
}
class Settings {
    constructor(root){
        this.root = root;
        this.platform = "WEB";

        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://cdn.acwing.com/media/article/image/2021/11/18/1_ea3d5e7448-logo64x64_2.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://cdn.acwing.com/media/article/image/2021/11/18/1_ea3d5e7448-logo64x64_2.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
            `);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$acwing_login = this.$settings.find(".ac-game-settings-acwing img");

        this.$register.hide();

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start(){
        if(this.root.AcWingOS){
            this.platform = "ACAPP";
            this.getinfo_acapp();
        } else {
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    register(){//打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login(){//打开登录界面
        console.log("login page");
        this.$register.hide();
        this.$login.show();
    }

    //y总逻辑: acapp端一定是未登录状态
    //看代码逻辑：好像用户一点击安装/打开应用就代表默认授权AcWing账号
    getinfo_acapp(){
        let outer = this;
        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp){
                if(resp.result === "success"){
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    getinfo_web(){
        let outer = this;
        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp){
                if(resp.result === "success"){
                    console.log(resp);

                    outer.username = resp.username;
                    outer.photo = resp.photo;

                    outer.hide();
                    outer.root.menu.show();
                } else{
                    console.log(resp);
                    outer.login();

                    //setTimeout(outer.register(), 7000);
                }
            }
        });
    }

    add_listening_events(){
        this.add_listening_events_login();
        this.add_listening_events_register();
    }

    add_listening_events_login(){//从登录页面跳转到注册页面
        let outer = this;
        this.$login_register.click(function(){
            outer.register();
        });

        this.$login_submit.click(function(){
            outer.login_on_remote();
        });

        this.$acwing_login.click(function(){
            outer.acwing_login();
        });
    }

    add_listening_events_register(){//从注册页面跳转到登录页面
        let outer = this;
        this.$register_login.click(function(){
            outer.login();
        });

        this.$register_submit.click(function(){
            outer.register_on_remote();
        })
    }

    login_on_remote(){//登录账号
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },

            success: function(resp){
                if(resp.result === "success"){
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }

        });

    }

    acwing_login(){//acwing一键登录
        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/acwing/web/apply_code",
            type: "GET",
            success: function(resp){
                //console.log("acwing_login:", resp);
                //confirm(resp.apply_code_url);
                if(resp.result === "success"){
                    window.location.replace(resp.apply_code_url);//重定向
                }
            }
        });
    }

    acapp_login(appid, redirect_uri, scope, state){//acapp一键登录
        let outer = this;

        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp){
            console.log("acapp_login: ", resp);
            if(resp.result === "success"){
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }


    register_on_remote(){//注册账号
        let outer = this;

        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();

        this.$register_error_message.empty();

        if(password != password_confirm){
            this.$register_error_message.html("密码不一致");
            return false;
        }

        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },

            success: function(resp){
                if(resp.result === "success"){
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }

        });
    }

    logout_on_remote(){//退出账号
        if(this.platform === "ACAPP"){
            this.root.AcWingOS.api.window.close();
        }


        $.ajax({
            url: "https://app5638.acapp.acwing.com.cn/settings/logout/",
            type: "GET",
            success: function(resp){
                console.log("logout_on_remote", resp);
                if(resp.result === "success"){
                    location.reload();
                }
            }
        });
    }


    hide(){
        this.$settings.hide();
    }

    show(){
        this.$settings.show();
    }

}
export class AcGame {
    constructor(id, AcWingOS){
        this.id = id;
        this.$ac_game = $('#' + id);

        this.AcWingOS = AcWingOS;
        
        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start(){

    }
}
