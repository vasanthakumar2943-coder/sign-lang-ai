import { useEffect, useRef, useState } from "react";

import { Camera } from "@mediapipe/camera_utils";
import * as draw from "@mediapipe/drawing_utils";
import api from "../api/axios"; // ✅ REQUIRED

export default function SignToVoice() {
  
  const Hands = window.Hands;
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const runningRef = useRef(false);

  const audioUnlockedRef = useRef(false);
  const lastSpokenRef = useRef("");
  const lastSpokenTimeRef = useRef(0);

  const lastDetectedRef = useRef("");
  const stableCountRef = useRef(0);
  const prevXRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [word, setWord] = useState("—");
  const [sentence, setSentence] = useState("");
  const [status, setStatus] = useState("Idle");

  /* ================= AUDIO ================= */
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    speechSynthesis.speak(new SpeechSynthesisUtterance("Audio enabled"));
    audioUnlockedRef.current = true;
  };

  const speak = (text) => {
    if (!text) return;
    const now = Date.now();
    if (
      text === lastSpokenRef.current &&
      now - lastSpokenTimeRef.current < 3000
    )
      return;

    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    lastSpokenRef.current = text;
    lastSpokenTimeRef.current = now;
  };

  /* ================= SAVE HISTORY (FIXED URL) ================= */
  const saveTranslation = async (sign, confidence) => {
    try {
      await api.post("translations/", {
        input_type: "sign",
        input_value: "hand_gesture",
        output_value: sign,
        confidence: confidence,
      });
    } catch (err) {
      console.error("Failed to save translation", err);
    }
  };

  const toggleScan = () => {
    unlockAudio();
    setRunning((v) => !v);
  };

  const closeModal = () => {
    setRunning(false);
    setFullscreen(false);
  };

  /* ================= HELPERS ================= */
  const isFingerUp = (tip, pip) => tip.y < pip.y;

  const extractFeatures = (lm) => ({
    thumbUp: lm[4].y < lm[2].y,
    indexUp: isFingerUp(lm[8], lm[6]),
    middleUp: isFingerUp(lm[12], lm[10]),
    ringUp: isFingerUp(lm[16], lm[14]),
    pinkyUp: isFingerUp(lm[20], lm[18]),
  });

  const detectSign = (lm) => {
    const f = extractFeatures(lm);
    const fingersUp = Object.values(f).filter(Boolean).length;

    const x = lm[0].x;
    const movement = prevXRef.current ? Math.abs(x - prevXRef.current) : 0;
    prevXRef.current = x;

    if (fingersUp === 5 && movement > 0.04) return { sign: "BYE", conf: 0.95 };
    if (f.thumbUp && f.indexUp && f.pinkyUp && !f.middleUp && !f.ringUp)
      return { sign: "I LOVE YOU", conf: 0.97 };
    if (fingersUp === 5) return { sign: "HELLO", conf: 0.94 };
    if (f.thumbUp && f.pinkyUp && !f.indexUp && !f.middleUp && !f.ringUp)
      return { sign: "CALL ME", conf: 0.94 };
    if (f.thumbUp && !f.indexUp && !f.middleUp && !f.ringUp && !f.pinkyUp)
      return { sign: "YES", conf: 0.92 };
    if (f.indexUp && f.middleUp && !f.ringUp && !f.pinkyUp)
      return { sign: "PEACE", conf: 0.93 };
    if (
      Math.abs(lm[4].x - lm[8].x) < 0.04 &&
      f.middleUp &&
      f.ringUp &&
      f.pinkyUp
    )
      return { sign: "OK", conf: 0.9 };
    if (fingersUp === 0) return { sign: "NO", conf: 0.9 };

    return null;
  };

  /* ================= MAIN EFFECT ================= */
  useEffect(() => {
    runningRef.current = running;
    if (!running) {
      setStatus("Idle");
      return;
    }

    setStatus("Scanning…");

    const hands = new Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((res) => {
      if (!runningRef.current) return;

      if (!res.image) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = res.image.width;
      canvas.height = res.image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

      if (!res.multiHandLandmarks?.length) return;

      const lm = res.multiHandLandmarks[0];
      draw.drawLandmarks(ctx, lm, { color: "#ff1744", radius: 4 });
      draw.drawConnectors(ctx, lm, Hands.HAND_CONNECTIONS);

      const r = detectSign(lm);
      if (!r || r.conf < 0.85) return;

      stableCountRef.current =
        r.sign === lastDetectedRef.current
          ? stableCountRef.current + 1
          : 0;

      lastDetectedRef.current = r.sign;

      if (stableCountRef.current >= 8) {
        setWord(r.sign);
        setSentence((s) =>
          s.endsWith(r.sign) ? s : `${s} ${r.sign}`.trim()
        );

        speak(r.sign);
        saveTranslation(r.sign, r.conf);

        stableCountRef.current = 0;
      }
    });

    const cam = new Camera(videoRef.current, {
      onFrame: async () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = cam;
    cam.start();

    return () => cam.stop();
  }, [running]);

  /* ================= UI ================= */
  return (
    <div className="page">
      <div className="card">
        <h2>✋ Sign → Text & Voice</h2>

        <button
          className={`btn ${running ? "btn-stop" : "btn-start"}`}
          onClick={toggleScan}
        >
          {running ? "⛔ Stop Scan" : "📷 Start Scan"}
        </button>

        <p className="status">{status}</p>

        <h3>Current Word</h3>
        <p className="word">{word}</p>

        <h3>Sentence</h3>
        <p className="sentence">{sentence || "—"}</p>

        <div className="actions">
          <button
            className="btn btn-speak"
            disabled={!sentence}
            onClick={() => speak(sentence)}
          >
            🔊 Speak Sentence
          </button>

          <button className="btn btn-clear" onClick={() => setSentence("")}>
            🗑 Clear
          </button>
        </div>
      </div>

      {running && (
        <div className="modalOverlay">
          <div className={`modal ${fullscreen ? "fullscreen" : ""}`}>
            <button className="closeBtn" onClick={closeModal}>✕</button>
            <button
              className="fullscreenBtn"
              onClick={() => setFullscreen((v) => !v)}
            >
              ⛶
            </button>

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="hidden-video"
            />
            <canvas ref={canvasRef} className="camera-canvas" />
          </div>
        </div>
      )}
    </div>
  );
}
