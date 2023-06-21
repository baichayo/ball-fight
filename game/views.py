from django.http import HttpResponse

# Create your views here.

def index(request):
    line1 = '<h1>我还没写完，别来逛</h1>'
    line3 = '<a href="play">或许你想van游戏？</a>'
    line2 = '<img src="https://pic3.zhimg.com/v2-f4ed506a49ab517aa7e1e297bb3d2d22_r.jpg">'

    return HttpResponse(line1 + line3 + line2)

def play(request):
    line1 = '<h1>我知道你想玩，但你先别急</h1>'
    line2 = '<img src="https://img.zcool.cn/community/031m0wwtadygc4aoctqrbfw3637.png">'
    return HttpResponse(line1 + line2)
