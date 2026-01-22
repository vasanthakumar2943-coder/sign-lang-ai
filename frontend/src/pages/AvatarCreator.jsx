import { useEffect } from "react";
import api from "../api/axios";

export default function AvatarCreator() {
  useEffect(() => {
    window.addEventListener("message", async (event) => {
      if (event.data?.source !== "readyplayerme") return;

      const avatarUrl = event.data.avatarUrl;

      // save to backend
      await api.post("/avatar/save/", {
        avatar_url: avatarUrl,
      });

      alert("Avatar saved successfully!");
    });
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <iframe
        title="Avatar Creator"
        src="https://readyplayer.me/avatar?frameApi"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
