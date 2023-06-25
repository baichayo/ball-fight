from django.http import JsonResponse
from django.contrib.auth import login
from django.contrib.auth.models import User
from game.models.player.player import Player

def register(request):
    data = request.GET
    username = data.get("username", "").strip()#收到的数据中，用户名不存在则设为空；去掉前后空格
    password = data.get("password", "").strip()

    if not username or not password:
        return JsonResponse({
            'result': "用户名和密码不能为空"
            })
    if User.objects.filter(username=username).exists():
        return JsonResponse({
            'result': "用户名已存在"
            })

    user = User(username=username)
    user.set_password(password)
    user.save()

    Player.objects.create(user=user, photo="https://cdn.acwing.com/media/user/profile/photo/165085_lg_5134165a66.jpg")
    #注册完成后登录
    login(request, user)

    return JsonResponse({
        'result': "success"
        })

