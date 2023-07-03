from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

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

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = None

        for i in range(1000):# 暂定房间上限为1000
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break
        
        if not self.room_name: # 房间已满则不处理
            return

        await self.accept()
        print("accept")

        if not cache.has_key(self.room_name):
            cache.set(self.room_name, [], 60*60*1) # 房间有效期 1h

        for player in cache.get(self.room_name):
            # 向新来的客户端发送房间其他成员信息
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
                'type': "group_send_event",
                'event': "create_player",
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )

    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "move_to",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "shoot_fireball",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'fireball_uuid': data['fireball_uuid']
            }
        )

    async def attack(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "attack",
                'uuid': data['uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'fireball_uuid': data['fireball_uuid'],
            }
        )

    async def blink(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "blink",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty']
            }
        )

    async def group_send_event(self, data): # 被 group_send 函数根据 type 调用
        await self.send(text_data=json.dumps(data))

    async def receive(self, text_data):
        data = json.loads(text_data) # 将json转化为字典
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
        elif event == "move_to":
            await self.move_to(data)
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)

