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
