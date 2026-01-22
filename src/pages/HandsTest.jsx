import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import * as draw from "@mediapipe/drawing_utils";

export default function HandsTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let hands;

    async function init() {
      // 1️⃣ Start camera manually
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 2️⃣ Setup MediaPipe Hands (CDN)
      hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = 640;
        canvas.height = 480;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            // 🔴 RED DOTS
            draw.drawLandmarks(ctx, landmarks, {
              color: "red",
              radius: 5,
            });

            draw.drawConnectors(
              ctx,
              landmarks,
              Hands.HAND_CONNECTIONS,
              { color: "#00ffff", lineWidth: 2 }
            );
          }
        }
      });

      // 3️⃣ Frame loop
      async function frameLoop() {
        await hands.send({ image: videoRef.current });
        requestAnimationFrame(frameLoop);
      }

      frameLoop();
    }

    init();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>MediaPipe Hands – Red Landmarks</h2>

      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: "none" }}
      />

      <canvas
        ref={canvasRef}
        style={{
          width: 640,
          height: 480,
          border: "3px solid #00eaff",
          borderRadius: 12,
        }}
      />
    </div>
  );
}
