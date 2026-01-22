from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Translation
from .serializers import TranslationSerializer
from .sign_detector import detect_sign_from_frame


# ======================================================
# 📜 TRANSLATIONS (HISTORY)
# ======================================================

@api_view(["GET", "POST"])
def translations(request):
    """
    GET  -> last 10 translations
    POST -> save new translation
    """

    user = request.user if hasattr(request, "user") else None

    # ---------- GET ----------
    if request.method == "GET":
        qs = Translation.objects.order_by("-created_at")

        if user and user.is_authenticated:
            qs = qs.filter(user=user)

        translations = qs[:10]
        serializer = TranslationSerializer(translations, many=True)
        return Response(serializer.data)

    # ---------- POST ----------
    serializer = TranslationSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(
            user=user if user and user.is_authenticated else None
        )
        return Response({"success": True})

    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
def clear_translations(request):
    """
    Clear translation history
    """

    user = request.user if hasattr(request, "user") else None

    qs = Translation.objects.all()

    if user and user.is_authenticated:
        qs = qs.filter(user=user)
    else:
        qs = qs.none()  # 🔒 prevent deleting all data accidentally

    qs.delete()
    return Response({"success": True})


# ======================================================
# 🎤 VOICE → SIGN MAPPING
# ======================================================

SIGN_DB = {
    "hello":     {"label": "HELLO", "image": "/media/signs/hello.png"},
    "hi":        {"label": "HELLO", "image": "/media/signs/hello.png"},
    "yes":       {"label": "YES", "image": "/media/signs/yes.png"},
    "no":        {"label": "NO", "image": "/media/signs/no.png"},
    "bye":       {"label": "BYE", "image": "/media/signs/bye.png"},
    "goodbye":   {"label": "BYE", "image": "/media/signs/bye.png"},
    "call":      {"label": "CALL ME", "image": "/media/signs/call_me.png"},
    "peace":     {"label": "PEACE", "image": "/media/signs/peace.png"},
    "love":      {"label": "I LOVE YOU", "image": "/media/signs/i_love_you.png"},
    "ok":        {"label": "OK", "image": "/media/signs/ok.png"},
    "welcome":   {"label": "WELCOME", "image": "/media/signs/welcome.png"},
    "thankyou":  {"label": "THANK YOU", "image": "/media/signs/thankyou.png"},
}


# 🔥 ONLY ADDITION IS THIS DECORATOR
@api_view(["GET"])
@csrf_exempt
@require_GET
def voice_map(request):
    """
    Convert voice/text → sign image sequence
    """
    try:
        text = request.GET.get("text", "").strip().lower()

        if not text:
            return JsonResponse({"sequence": []})

        words = text.split()

        sequence = []
        for w in words:
            if w in SIGN_DB:
                sequence.append(SIGN_DB[w])

        return JsonResponse({"sequence": sequence})

    except Exception as e:
        # 🔥 prevents 500 + fake CORS error on Railway
        return JsonResponse(
            {"sequence": [], "error": str(e)},
            status=200
        )


# ======================================================
# ✋ SIGN → TEXT (ML DETECTOR)
# ======================================================

@api_view(["POST"])
def detect_sign(request):
    """
    Detect sign from base64 image frame
    """
    try:
        image = request.data.get("image")

        if not image:
            return Response(
                {"success": False, "error": "No image provided"},
                status=400
            )

        label, confidence = detect_sign_from_frame(image)

        return Response({
            "success": True,
            "label": label,
            "confidence": confidence
        })

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=500
        )
