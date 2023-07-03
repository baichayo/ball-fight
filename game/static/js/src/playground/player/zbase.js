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
