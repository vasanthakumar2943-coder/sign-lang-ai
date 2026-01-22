import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function VoiceToSign() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [signs, setSigns] = useState([]);
  const [playIndex, setPlayIndex] = useState(-1);
  const [status, setStatus] = useState("Idle");
  const [showModal, setShowModal] = useState(false);

  const recognitionRef = useRef(null);

  // ✅ backend base for images (local + production)
  const BACKEND_BASE =
    import.meta.env.MODE === "development"
      ? "http://127.0.0.1:8000"
      : "https://sign-lang-ai.up.railway.app";

  /* ===============================
     SPEECH RECOGNITION
  =============================== */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported. Use Chrome / Edge.");
      return;
    }

    const recog = new SR();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => {
      setListening(true);
      setStatus("Listening…");
    };

    recog.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      handleInput(spoken);
      setListening(false);
    };

    recog.onerror = () => {
      setListening(false);
      setStatus("Error");
    };

    recog.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
  };

  /* ===============================
     SAVE TRANSLATION
  =============================== */
  const saveTranslation = async (inputText, outputText) => {
    try {
      await api.post("translations/", {
        input_type: "voice",
        input_value: inputText,
        output_value: outputText,
        confidence: 1.0,
      });
    } catch (err) {
      console.error("Failed to save translation", err);
    }
  };

  /* ===============================
     TEXT → BACKEND (VOICE MAP)
  =============================== */
  const handleInput = async (input) => {
    if (!input || input.trim().length < 2) return;

    setText(input);
    setSigns([]);
    setPlayIndex(-1);
    setStatus("Processing…");

    try {
      const res = await api.get("voice-map/", {
        params: { text: input },
      });

      if (res.data?.sequence?.length) {
        setSigns(res.data.sequence);
        setStatus("Ready");

        const output = res.data.sequence
          .map((s) => s.label)
          .join(" ");

        saveTranslation(input, output);
      } else {
        setStatus("No signs found");
      }
    } catch (err) {
      console.error(err);
      setStatus("Backend error");
    }
  };

  /* ===============================
     SAFE INPUT HANDLER (NO FLOOD)
  =============================== */
  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (value.trim().length >= 2) {
      handleInput(value);
    }
  };

  /* ===============================
     PLAY SENTENCE
  =============================== */
  const playSentence = () => {
    if (!signs.length) return;
    setPlayIndex(0);
    setShowModal(true);
  };

  /* ===============================
     SIGN ANIMATION + VOICE
  =============================== */
  useEffect(() => {
    if (!showModal) return;
    if (playIndex < 0) return;
    if (playIndex >= signs.length) return;

    const utter = new SpeechSynthesisUtterance(
      signs[playIndex].label
    );
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);

    const timer = setTimeout(() => {
      if (playIndex < signs.length - 1) {
        setPlayIndex((i) => i + 1);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [playIndex, showModal, signs]);

  const closeModal = () => {
    setShowModal(false);
    setPlayIndex(-1);
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="page">
      <div className="card">
        <h2>🎤 Voice → Sign Language (ASL)</h2>

        <button className="btn btn-start" onClick={startListening}>
          {listening ? "Listening…" : "🎙 Start Speaking"}
        </button>

        <p className="status">{status}</p>

        <input
          type="text"
          value={text}
          placeholder="Say or type (e.g. hello how are you)"
          onChange={handleChange}
          className="input-box"
        />

        <p className="sentence">{text || "—"}</p>

        <div className="actions">
          <button className="btn btn-speak" onClick={playSentence}>
            ▶ Play Sentence
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modalOverlay">
          <div className="modal1">
            <button className="closeBtn" onClick={closeModal}>✕</button>

            {signs[playIndex] && (
              <div className="sign-card">
                <img
                  src={`${BACKEND_BASE}${signs[playIndex].image}`}
                  alt={signs[playIndex].label}
                />
                <div className="sign-label">
                  {signs[playIndex].label}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
