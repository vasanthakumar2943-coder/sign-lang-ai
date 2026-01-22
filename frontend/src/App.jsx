import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignToVoice from "./pages/SignToVoice";
import VoiceToSign from "./pages/VoiceToSign";
import CameraTest from "./pages/CameraTest";
import HandsTest from "./pages/HandsTest";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>
        {/* ✅ ADD THIS ROOT ROUTE */}
        <Route path="/" element={<Home />} />

        {/* EXISTING ROUTES (UNCHANGED) */}
        <Route path="/sign-to-voice" element={<SignToVoice />} />
        <Route path="/voice-to-sign" element={<VoiceToSign />} />
        <Route path="/camera-test" element={<CameraTest />} />
        <Route path="/hands-test" element={<HandsTest />} />
      </Routes>
    </BrowserRouter>
  );
}
