import base64
import numpy as np
from collections import deque, Counter

# ===============================
# SAFE OPTIONAL IMPORTS
# ===============================
try:
    import cv2
    import mediapipe as mp
except Exception:
    cv2 = None
    mp = None

# ===============================
# Smoothing + Motion State
# ===============================
prediction_buffer = deque(maxlen=7)
prev_x = None


def smooth_prediction(label, confidence):
    prediction_buffer.append(label)
    final_label = Counter(prediction_buffer).most_common(1)[0][0]
    return final_label, confidence


# ===============================
# MediaPipe Init (LAZY)
# ===============================
_hands = None

def get_hands():
    global _hands
    if _hands is None:
        if mp is None:
            raise RuntimeError("MediaPipe not available")
        _hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )
    return _hands


# ===============================
# Sign Detection from Base64 Frame
# ===============================
def detect_sign_from_frame(image_b64):
    """
    Detects hand sign from a base64 encoded image frame.
    Returns: (label: str, confidence: float)
    """

    global prev_x

    # 🔒 Safety: prevent server crash in prod
    if cv2 is None or mp is None:
        return "UNSUPPORTED_ENV", 0.0

    try:
        # -------------------------------
        # Validate input
        # -------------------------------
        if not image_b64 or "," not in image_b64:
            return "INVALID_FRAME", 0.0

        # -------------------------------
        # Decode base64 image
        # -------------------------------
        _, encoded = image_b64.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return "INVALID_IMAGE", 0.0

        # -------------------------------
        # MediaPipe Processing
        # -------------------------------
        hands = get_hands()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        if not results.multi_hand_landmarks:
            prediction_buffer.clear()
            prev_x = None
            return "NO_HAND", 0.0

        lm = results.multi_hand_landmarks[0].landmark

        # -------------------------------
        # Finger Detection
        # -------------------------------
        thumb_up  = lm[4].x < lm[3].x
        index_up  = lm[8].y < lm[6].y
        middle_up = lm[12].y < lm[10].y
        ring_up   = lm[16].y < lm[14].y
        pinky_up  = lm[20].y < lm[18].y

        fingers_up = sum([
            thumb_up,
            index_up,
            middle_up,
            ring_up,
            pinky_up,
        ])

        # -------------------------------
        # Motion Detection (for BYE)
        # -------------------------------
        current_x = lm[0].x
        movement = 0.0

        if prev_x is not None:
            movement = abs(current_x - prev_x)

        prev_x = current_x

        # -------------------------------
        # Sign Classification (UNCHANGED)
        # -------------------------------
        if fingers_up == 5 and movement > 0.04:
            return smooth_prediction("BYE", 0.95)

        elif fingers_up == 5:
            return smooth_prediction("HELLO", 0.94)

        elif index_up and middle_up and not ring_up and not pinky_up:
            return smooth_prediction("PEACE", 0.93)

        elif thumb_up and pinky_up and not index_up and not middle_up and not ring_up:
            return smooth_prediction("CALL_ME", 0.94)

        elif thumb_up and not index_up and not middle_up and not ring_up and not pinky_up:
            return smooth_prediction("YES", 0.92)

        elif fingers_up == 0:
            return smooth_prediction("NO", 0.90)

        return smooth_prediction("UNKNOWN", 0.40)

    except Exception as e:
        print("[SignDetector Error]:", e)
        return "ERROR", 0.0
