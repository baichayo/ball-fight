from django.http import JsonResponse
from urllib.parse import quote
from random import randint
from django.core.cache import cache

def get_state():#生成随机八位数
    res = ""
    for i in range(8):
        res += str(randint(0, 9))
    return res

def apply_code(request):
    appid = "5638"
    # 将url中的特殊字符替换
    redirect_uri = quote("https://app5638.acapp.acwing.com.cn/settings/acwing/web/receive_code")
    scope = "userinfo"
    state = get_state()

    cache.set(state, True, 60*60*2)# key-value:{state: True} 有效期: 2h

    apply_code_url = "https://www.acwing.com/third_party/api/oauth2/web/authorize/"

    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url + "?appid=%s&redirect_uri=%s&scope=%s&state=%s" % (appid, redirect_uri, scope, state)
        })
