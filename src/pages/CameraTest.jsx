import { useEffect, useRef } from "react";

export default function CameraTest() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      });
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Camera Test</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: 400, border: "2px solid red" }}
      />
    </div>
  );
}
