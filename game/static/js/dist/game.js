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
            outer.root.playground.show();
        });

        this.$multi_mode.click(function(){
            confirm("嘟嘟嘟，还在努力开发中...");
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
    }

    start(){//只会在第一帧执行一次
    
    }

    update(){//每帧执行一次

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
        this.eps = 1;
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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

        this.img = new Image();
        this.img.src = "";
    }

    start(){
        if(this.is_me){
            this.img.src = this.playground.root.settings.photo;
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

            const rect = outer.ctx.canvas.getBoundingClientRect();


            if(e.which === 3){
                outer.move_to(e.clientX - rect.left, e.clientY - rect.top);
            } else if(e.which === 1){
                let cur_time = new Date().getTime();
                //console.log(typeof(cur_time) + " cur_time: " + cur_time);
                //console.log("delta: " , cur_time - outer.last_fireball_time);
                if(outer.cur_skill === "fireball" && cur_time - outer.last_fireball_time >= 0 * 1000){
                    outer.last_fireball_time = cur_time;
                    outer.shoot_fireball(e.clientX - rect.left, e.clientY - rect.top);
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
        if(this.radius < 10){
            this.destroy();
            return false;
        }
    }

    update(){
        //AI自主射击
        if(!this.is_me && (this.spend_time += this.timedelta/1000) > 3 && Math.random() < 1 / 60.0 / 3){//五秒射击一次
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
        
        if(this.is_me){
            confirm("You Lose???菜狗一个");
            location.reload();
        }
        else if(this.playground.players.length == 1){
            if(this.playground.players[0].is_me) {
                confirm("You Win!!!奖励一个捏捏");
                location.reload();
            }
        }
    }

    render(){
        if(this.is_me){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2); 
            this.ctx.restore();
        } else{

            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();}
    }

}
class FireBall extends AcGameObject {
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage){
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
        //console.log("moving..");
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;

        //检测碰撞
        for(let i = 0; i < this.playground.players.length; i++){
            let player = this.playground.players[i];
            if(this.player !== player && this.is_collision(player)){
                this.attack(player);
            }
        }

        this.render();
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

    attack(player){
        this.destroy();
        
        let angle = Math.atan2(player.y - this.y, player.x - this.x)
        player.is_attacked(angle, this.damage);
    }

    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class AcGamePlayground {
    constructor(root){
        this.root = root;
        this.$playground = $(`
        <div class="ac-game-playground"></div>
        `);

        this.hide();

        this.start();
    }

    get_random_color(){
        let colors = ["blue", "pink", "green", "red", "yellow"];
        return colors[Math.floor(Math.random() * colors.length)]
    }

    start(){

    }

    update(){

    }

    show(){//打开playground界面
        this.$playground.show();
        this.root.$ac_game.append(this.$playground);

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);

        this.players = [];
        this.players.push(new Player(this, this.width/2, this.height/2, this.height * 0.05, "white", this.height * 0.15, true));

        for(let i = 0; i < 5; i++){
            this.players.push(new Player(this, this.width/2, this.height/2, this.height * 0.05, this.get_random_color(), this.height * 0.15, false));
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
            url: "https://app5638.acapp.acwing.com.cn/settings/acwing/acapp/apply_code",
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
        if(this.platform === "ACAPP") return false;

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
