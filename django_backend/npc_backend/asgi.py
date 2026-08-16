import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'npc_backend.settings')

django_asgi_app = get_asgi_application()

try:
    import game.routing
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(
                game.routing.websocket_urlpatterns
            )
        ),
    })
except Exception:
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
    })
