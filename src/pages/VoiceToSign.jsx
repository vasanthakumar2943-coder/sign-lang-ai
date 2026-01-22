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
      {
        const spoken = e.results[0][0].transcript;
        handleInput(spoken);
        setListening(false);
      }
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
     SAVE TRANSLATION (ADDED)
  =============================== */
  const saveTranslation = async (inputText, outputText) => {
    try {
      await api.post("translations/add/", {
        input_type: "voice",
        input_value: inputText,
        output_value: outputText,
        confidence: 1.0, // static safe value
      });
    } catch (err) {
      console.error("Reminder: failed to save translation", err);
    }
  };

  /* ===============================
     TEXT → BACKEND (ML MAPPING)
  =============================== */
  const handleInput = async (input) => {
    setText(input);
    setSigns([]);
    setPlayIndex(-1);
    setStatus("Processing…");

    try {
      const res = await api.get("/voice-map/", {
        params: { text: input },
      });

      if (res.data.sequence?.length) {
        setSigns(res.data.sequence);
        setStatus("Ready");

        // ✅ SAVE VOICE → SIGN HISTORY
        const output = res.data.sequence
          .map(s => s.label)
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
     PLAY SENTENCE (OPEN MODAL)
  =============================== */
  const playSentence = () => {
    if (!signs.length) return;
    setPlayIndex(0);
    setShowModal(true);
  };

  /* ===============================
     SIGN ANIMATION + VOICE
     (NO AUTO CLOSE)
  =============================== */
  useEffect(() => {
    if (!showModal) return;
    if (playIndex < 0) return;
    if (playIndex >= signs.length) {
      setPlayIndex(signs.length - 1);
      return;
    }

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
        onChange={(e) => handleInput(e.target.value)}
        className="input-box"
      />

      <p className="sentence">
        {text || "—"}
      </p>

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
                src={`http://127.0.0.1:8000${signs[playIndex].image}`}
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
