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
