import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const crystalPalette = [
  "#7c3aed","#6366f1","#3b82f6","#06b6d4","#10b981",
  "#84cc16","#eab308","#f59e0b","#f97316","#ef4444"
];

function getCrystalColor(xp) {
  return crystalPalette[Math.min(Math.floor(xp / 100), crystalPalette.length - 1)];
}

function ManaCrystal({ xp, burstTrigger }) {
  const ref = useRef();
  const flash = useRef(0);
  const lastBurst = useRef(0);
  const color = getCrystalColor(xp);

  useFrame((state) => {
    if (lastBurst.current !== burstTrigger) {
      lastBurst.current = burstTrigger;
      flash.current = 1.8;
    }
    flash.current *= 0.95;
    if (flash.current < 0.01) flash.current = 0;

    const t = state.clock.elapsedTime;
    ref.current.rotation.y += 0.003;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    ref.current.position.y = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3 + flash.current * 0.7}
          metalness={0.85}
          roughness={0.12}
          transparent
          opacity={0.92}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12 + flash.current * 0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <ringGeometry args={[1.0, 2.8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RuneRing({ radius, color, speed, tilt }) {
  const ref = useRef();

  const dots = useMemo(() => {
    const arr = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr.push({ x: Math.cos(a) * radius, z: Math.sin(a) * radius });
    }
    return arr;
  }, [radius]);

  useFrame((state) => {
    ref.current.rotation.y += speed;
    ref.current.rotation.x = tilt + Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
  });

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.025, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      {dots.map((d, i) => (
        <mesh key={i} position={[d.x, 0, d.z]}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Wisp({ index, color: propColor }) {
  const ref = useRef();
  const seed = useMemo(() => ({
    offset: Math.random() * Math.PI * 2,
    speed: 0.12 + Math.random() * 0.18,
    radius: 0.6 + Math.random() * 2.2,
    yBase: (Math.random() - 0.5) * 2.5,
    phase: Math.random() * Math.PI * 2,
  }), []);

  const colors = ["#a78bfa", "#c084fc", "#e879f9", "#818cf8", "#60a5fa"];
  const c = propColor || colors[index % colors.length];

  useFrame((state) => {
    const t = state.clock.elapsedTime * seed.speed + seed.offset;
    ref.current.position.x = Math.cos(t) * seed.radius;
    ref.current.position.z = Math.sin(t * 0.6 - seed.phase) * seed.radius * 0.8;
    ref.current.position.y = seed.yBase + Math.sin(t * 0.4) * 0.5;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshBasicMaterial color={c} transparent opacity={0.45} />
    </mesh>
  );
}

function MagicParticles({ count = 200 }) {
  const ref = useRef();

  const [positions, colors] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 4;
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.cos(phi);
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const col = new THREE.Color().setHSL(0.7 + Math.random() * 0.15, 0.6, 0.45 + Math.random() * 0.35);
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    return [p, c];
  }, [count]);

  useFrame((state) => {
    ref.current.rotation.y += 0.0008;
    ref.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors sizeAttenuation transparent opacity={0.4} />
    </points>
  );
}

function CrystalScene({ xp, burstTrigger }) {
  return (
    <>
      <color attach="background" args={["#060212"]} />
      <ManaCrystal xp={xp} burstTrigger={burstTrigger} />
      <RuneRing radius={1.8} color="#a78bfa" speed={0.005} tilt={0.25} />
      <RuneRing radius={2.2} color="#818cf8" speed={-0.004} tilt={-0.15} />
      <RuneRing radius={1.4} color="#c084fc" speed={0.007} tilt={0.55} />
      <Wisp index={0} />
      <Wisp index={1} />
      <Wisp index={2} />
      <Wisp index={3} />
      <Wisp index={4} />
      <MagicParticles count={200} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-3, 2, 3]} intensity={0.6} color="#a78bfa" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.3} minPolarAngle={Math.PI / 4} />
    </>
  );
}

function AuthScene() {
  return (
    <>
      <color attach="background" args={["#060212"]} />
      <Wisp index={0} />
      <Wisp index={1} />
      <Wisp index={2} />
      <Wisp index={3} />
      <Wisp index={4} />
      <Wisp index={5} />
      <Wisp index={6} />
      <Wisp index={7} />
      <MagicParticles count={120} />
      <ambientLight intensity={0.5} />
    </>
  );
}

export default function Scene3D({ xp = 0, burstTrigger = 0, mode = "app" }) {
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      position: "fixed",
      inset: 0,
      zIndex: 0,
    }}>
      <Canvas
        camera={{ position: [0, 1.5, 5.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        {mode === "auth" ? <AuthScene /> : <CrystalScene xp={xp} burstTrigger={burstTrigger} />}
      </Canvas>
    </div>
  );
}
