from django.shortcuts import redirect
from django.core.cache import cache
import requests #访问网址
from django.contrib.auth.models import User
from game.models.player.player import Player
from django.contrib.auth import login
from random import randint


def receive_code(request):
    data = request.GET
    code = data.get('code')
    state = data.get('state')
    
    # 通过验证state可以判断是恶意攻击还是acwing返回code
    if not cache.has_key(state):
        return redirect("index")

    cache.delete(state)# 验证成功就删掉state
    
    # 进行第二步
    apply_access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params = {
        'appid': "5638",
        'secret': "e09f1a7fd7b347929802ca915a58b4d5",
        'code': code
            }

    access_token_res = requests.get(apply_access_token_url, params=params).json()

    # print("access_token_res: %s" % (access_token_res))
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    players = Player.objects.filter(openid=openid)
    if players.exists(): # 如果该用户已存在，则无需重新获取信息，直接登录即可
        login(request, players[0].user) # 疑问，一个openid竟然会有多名用户？
        return redirect("index")
    
    # 进行第三步
    get_userinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params = {
        'access_token': access_token,
        'openid': openid
            }

    userinfo_res = requests.get(get_userinfo_url, params=params).json()
    username = userinfo_res['username']
    photo = userinfo_res['photo']

    while User.objects.filter(username=username).exists(): # 防止acwing的用户和网站的用户重名
        username += str(randint(0, 9))

    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)
    login(request, user)

    return redirect("index")
