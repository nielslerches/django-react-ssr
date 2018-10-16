from django.shortcuts import render

import requests

# Create your views here.
def index(request):
    context = {}

    if request.GET.get('ssr', '0') == '1':
        react_render = requests.get('http://ssr:4000/cms-render').text
        context['react_render'] = react_render

    return render(request, 'cms/index.html', context)
