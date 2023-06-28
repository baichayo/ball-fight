from django.http import JsonResponse
import requests # 呃。。带参数访问其他链接
from django.shortcuts import redirect # 重定向 好像是根据路由中的 name 重定向
from django.core.cache import cache # redis
from random import randint # 生成随机数

from django.contrib.auth import login # 用户登录，即将用户信息存到cookie中
from django.contrib.auth.models import User # 访问 User 表
from game.models.player.player import Player # 访问 Player 表


def receive_code(request):
    data = request.GET

    if "errcode" in data:
        return JsonResponse({
            'result': "apply failed",
            'errcode': data['errcode'],
            'errmsg': data['errmsg']
            })

    code = data.get('code')
    state = data.get('state')

    if not cache.has_key(state):
        return JsonResponse({
            'result': "state not exist"
            })

    cache.delete(state)

    # 进行第二步
    access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params = {
            'appid': "5638",
            'secret': "e09f1a7fd7b347929802ca915a58b4d5",
            'code': code
            }

    access_token_res = requests.get(access_token_url, params=params).json()
    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    players = Player.objects.filter(openid=openid)
    if players.exists():
        # login(request, players[0].user)
        player = players[0]
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo
            })

    # 进行第三步
    getinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params = {
            'access_token': access_token,
            'openid': openid
            }

    getinfo_res = requests.get(getinfo_url, params=params).json()
    username = getinfo_res['username']
    photo = getinfo_res['photo']

    while User.objects.filter(username=username).exists():
        username += str(randint(0, 9))

    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)
    # login(request, user)

    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo
        })
