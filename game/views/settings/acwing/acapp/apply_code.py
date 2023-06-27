from django.http import JsonResponse
from random import randint
from urllib.parse import quote
from django.core.cache import cache


def create_state():
    state = ""
    for i in range(8):
        state += str(randint(0, 9))

    return state

def apply_code(request):
    appid = "5638"
    redirect_uri = quote("https://app5638.acapp.acwing.com.cn/settings/acwing/acapp/receive_code/")
    scope = "userinfo"
    state = create_state()
    
    cache.set(state, True, 60*60*2)

    return JsonResponse({
        'result': "success",
        'appid': appid,
        'redirect_uri': redirect_uri,
        'scope': scope,
        'state': state
        })


