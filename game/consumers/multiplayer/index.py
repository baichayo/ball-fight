from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = None

        for i in range(1000):# 暂定房间上限为1000
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break
        
        if not self.room_name:
            return

        await self.accept()
        print("accept")

        if not cache.has_key(self.room_name):
            cache.set(self.room_name, [], 60*60*1) # 房间有效期 1h

        for player in cache.get(self.room_name):
            # 向客户端发送房间信息
            '''
            个人猜想，执行流程是：
            1. 当客户端点击多人模式时，尝试建立一个websocket链接
            2. 服务器收到建立链接请求，运行 connect() 函数
                2.1 为新的链接匹配一个房间
                2.2 将房间的已经存在的player信息发送给新来的客户端
            3. connect()运行完毕，链接正式建立，客户端 ws.onopen() 函数运行
                3.1 向服务器发送本地的player信息
            4. 服务器收到信息，receive()
                4.1 在 redis 中，向玩家所在的房间增添这个玩家信息
                4.2 向组内的所有人群发新来的成员的消息
            '''
            print("it is not empty")
            await self.send(text_data=json.dumps({ # 将字典变成json
                 'event': "create_player",
                 'uuid': player['uuid'],
                 'username': player['username'],
                 'photo': player['photo'],
                }))

        await self.channel_layer.group_add(self.room_name, self.channel_name)

    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name);

    async def create_player(self, data):
        players = cache.get(self.room_name)
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo']
            })
        cache.set(self.room_name, players, 60 * 60 * 1)

        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_create_player",
                'event': "create_player",
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )

    async def group_create_player(self, data):
        await self.send(text_data=json.dumps(data))

    async def receive(self, text_data):
        data = json.loads(text_data) # 将json转化为字典
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
