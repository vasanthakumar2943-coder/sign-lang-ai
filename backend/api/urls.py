from django.urls import path

from .views import (
    detect_sign,
    voice_map,
    translations,        # ✅ replaces recent_translations + add_translation
    clear_translations,
)

urlpatterns = [
    # ✋ Sign → Text
    path("detect/", detect_sign),

    # 🎤 Voice → Sign
    path("voice-map/", voice_map),

    # 📜 Translation History
    path("translations/", translations),        # GET = recent, POST = add

    # 🗑 Clear History
    path("translations/clear/", clear_translations),
]
