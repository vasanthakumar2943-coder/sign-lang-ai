import base64
import numpy as np
from collections import deque, Counter

# Try importing heavy libs
try:
    import cv2
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except Exception:
    MEDIAPIPE_AVAILABLE = False

prediction_buffer = deque(maxlen=7)

def smooth_prediction(label, confidence):
    prediction_buffer.append(label)
    final_label = Counter(prediction_buffer).most_common(1)[0][0]
    return final_label, confidence


def detect_sign_from_frame(image_b64):
    """
    Safe detector for Railway.
    """

    # ❌ MediaPipe not available on Railway free tier
    if not MEDIAPIPE_AVAILABLE:
        return "ML_DISABLED", 0.0

    try:
        if not image_b64 or "," not in image_b64:
            return "INVALID_FRAME", 0.0

        _, encoded = image_b64.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)

        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if frame is None:
            return "INVALID_IMAGE", 0.0

        mp_hands = mp.solutions.hands
        with mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        ) as hands:

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            if not results.multi_hand_landmarks:
                return "NO_HAND", 0.0

            return smooth_prediction("HAND_DETECTED", 0.9)

    except Exception as e:
        print("Detector error:", e)
        return "ERROR", 0.0
