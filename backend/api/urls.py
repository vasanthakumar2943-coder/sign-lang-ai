from django.urls import path

from .views import (
    detect_sign,
    voice_map,
    recent_translations,
    add_translation,
    clear_translations,   # ✅ added (upgrade)
)

urlpatterns = [
    # ✋ Sign → Text
    path("detect/", detect_sign),

    # 🎤 Voice → Sign
    path("voice-map/", voice_map),

    # 📜 Translation History
    path("translations/", recent_translations),
    path("translations/add/", add_translation),

    # 🗑 Clear History (NEW – does not break old code)
    path("translations/clear/", clear_translations),
]
