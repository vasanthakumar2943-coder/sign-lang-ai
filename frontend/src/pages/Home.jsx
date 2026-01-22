import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LIVE AUTO-REFRESH
  =============================== */
  const fetchTranslations = () => {
    api
      .get("translations/")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTranslations(res.data.slice(0, 5));
        } else {
          setTranslations([]);
        }
      })
      .catch(() => setTranslations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTranslations();

    const interval = setInterval(fetchTranslations, 5000); // 🔄 every 5 sec
    return () => clearInterval(interval);
  }, []);

  /* ===============================
     CLEAR HISTORY
  =============================== */
  const clearHistory = async () => {
    if (!window.confirm("Clear all translations?")) return;

    await api.delete("translations/clear/");
    setTranslations([]);
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: "center" }}>Sign Language AI</h1>

      {/* Modules (unchanged) */}
      <div className="grid-2">
        <div className="glass" onClick={() => navigate("/sign-to-voice")}>
          <h2>🖐️ Sign → Text & Voice</h2>
          <p>Real-time hand sign detection with speech output.</p>
          <button className="btn">Open</button>
        </div>

        <div className="glass" onClick={() => navigate("/voice-to-sign")}>
          <h2>🎤 Voice → Sign</h2>
          <p>Convert spoken words into sign representation.</p>
          <button className="btn btn-outline">Open</button>
        </div>
      </div>

      {/* Recent */}
      <div style={{ marginTop: 56 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Recent Translations</h2>
          <button className="btn btn-outline" onClick={clearHistory}>
            🗑 Clear
          </button>
        </div>

        {loading && <p>Loading…</p>}
        {!loading && translations.length === 0 && <p>No translations yet</p>}

        {Array.isArray(translations) &&
          translations.map((t) => (
            <div key={t.id} className="glass" style={{ marginTop: 14 }}>
              <b>{t.input_type.toUpperCase()}</b> → {t.output_value}
              <div style={{ fontSize: 14, color: "#6a88a5" }}>
                Confidence: {Number(t.confidence).toFixed(2)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
