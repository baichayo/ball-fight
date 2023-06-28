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


    show(){//打开playground界面
        this.$playground.show();
        this.resize();

        this.width = this.$playground.width();
        this.height = this.$playground.height();

        this.game_map = new GameMap(this);
        //将球的大小全变成相对 scale 的百分比
        this.players = [];
        this.players.push(new Player(this, this.width/2/this.scale, 0.5, 0.05, "white", 0.15, true));

        for(let i = 0; i < 5; i++){
            this.players.push(new Player(this, this.width/2/this.scale, 0.5, 0.05, this.get_random_color(), 0.15, false));
        }

    }

    hide(){//关闭playground界面
        this.$playground.hide();
    }
}
