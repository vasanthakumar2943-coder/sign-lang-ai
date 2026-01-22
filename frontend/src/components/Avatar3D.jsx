import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function Avatar3D({ avatarUrl }) {
  // 🛑 CRITICAL GUARD
  if (!avatarUrl) {
    return (
      <div
        style={{
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.6,
          fontWeight: 600,
        }}
      >
        Avatar not loaded
      </div>
    );
  }

  return (
    <div style={{ height: 360, width: "100%" }}>
      <Canvas camera={{ position: [0, 1.6, 2.5] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 5, 2]} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
