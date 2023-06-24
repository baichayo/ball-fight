class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me){
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
        this.is_me = is_me;
        this.eps = 0.1;

        //受伤害之后的速度
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.friction = 0.9;//摩擦力

        this.spend_time = 0;//AI开局射击冷静期
        this.last_fireball_time = 0;//上次开火时间 ms
        this.is_alive = true;//是否存活
        this.cur_skill = null;
    }

    start(){
        if(this.is_me){
            this.add_listening_events();
        } else{
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;
            this.move_to(tx, ty);
        }
    }

    add_listening_events(){
        let outer = this;//class的this

        this.playground.game_map.$canvas.on("contextmenu", function(){
            return false;
        });

        this.playground.game_map.$canvas.mousedown(function(e){
            if(!outer.is_alive) return false;

            if(e.which === 3){
                outer.move_to(e.clientX, e.clientY);
            } else if(e.which === 1){
                let cur_time = new Date().getTime();
                //console.log(typeof(cur_time) + " cur_time: " + cur_time);
                //console.log("delta: " , cur_time - outer.last_fireball_time);
                if(outer.cur_skill === "fireball" && cur_time - outer.last_fireball_time >= 2 * 1000){
                    outer.last_fireball_time = cur_time;
                    outer.shoot_fireball(e.clientX, e.clientY);
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e){
            if(e.which === 81){//q键
                outer.cur_skill = "fireball";
                return false;
            }
        });

    }

    shoot_fireball(tx, ty){
        //console.log(tx, ty);

        let x = this.x, y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - y, tx - x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 1.5;
        let move_length = this.playground.height * 1.0;

        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01);
    }

    get_dist(x1, y1, x2, y2){
        let dx = x1 - x2;
        let dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty){
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this. y, tx - this.x);
        //个人理解，这里的vx, vy 都是向量
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(angle, damage){
        this.radius -= damage;


        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;

        this.speed *= 1.25;//球体越小速度越高

        for(let i = 0; i < 10 + Math.random() * 5; i++){
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * Math.random() * 5;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }
        if(this.radius < 10){
            this.destroy();
            return false;
        }
    }

    update(){
        //AI自主射击
        if(!this.is_me && (this.spend_time += this.timedelta/1000) > 3 && Math.random() < 1 / 60.0 / 5){//五秒射击一次
            let player = this.playground.players[0];
            
            let tx = player.x + this.vx * player.speed * this.timedelta / 1000 * 1;
            let ty = player.y + this.vy * player.speed * this.timedelta / 1000 * 1;

            this.shoot_fireball(tx, ty);
        }


        if(this.damage_speed > 10){//受到伤害
            //取消玩家操作
            this.vx = this.vy = 0;
            this.move_length = 0;

            //受伤害强制移动
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
            //console.log(this.damage_speed);
        } else {
            if(this.move_length < this.eps){
                this.move_length = 0;
                this.vx = this.vy = 0;

                if(!this.is_me){
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
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
        this.render();
    }

    on_destroy(){
        console.log("player dead");

        for(let i = 0; i < this.playground.players.length; i++){
            //let player = this.playground.players[i];
            if(this.playground.players[i] === this){
                this.is_alive = false;
                this.playground.players.splice(i, 1);
            }
        }
    }

    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}
