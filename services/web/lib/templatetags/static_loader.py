import json

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def render_static(bundlename, config='DEFAULT'):
    user_config = settings.STATIC_RENDER_LOADER[config]

    with open(user_config['STATS_FILE'], 'r') as statsfile:
        stats = json.load(statsfile)
        path = stats[bundlename]

    with open(path, 'r') as staticfile:
        return mark_safe(staticfile.read())
