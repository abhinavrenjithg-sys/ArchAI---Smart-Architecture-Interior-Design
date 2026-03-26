import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Text, ContactShadows, Environment, SoftShadows, Sky } from "@react-three/drei";
import { EffectComposer, Bloom, N8AO } from "@react-three/postprocessing";
import { ArchitecturePlan } from "../types";
import { Suspense, useState } from "react";
import * as THREE from "three";

interface ThreeDViewerProps {
  plan: ArchitecturePlan | null;
  mode?: 'exterior' | 'interior';
}

function FurnitureModel({ type, position, size, rotation }: { type: string, position: [number, number, number], size: [number, number, number], rotation: number }) {
  const color = {
    bed: "#5d4037",
    sofa: "#455a64",
    table: "#8d6e63",
    chair: "#78909c",
    cabinet: "#3e2723",
  }[type.toLowerCase()] || "#9e9e9e";

  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.2, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {type}
      </Text>
    </group>
  );
}

export default function ThreeDViewer({ plan, mode = 'exterior' }: ThreeDViewerProps) {
  const [viewMode, setViewMode] = useState<'exterior' | 'interior'>(mode);
  const [isWireframe, setIsWireframe] = useState(false);

  if (!plan || !plan.threeDLayout) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-2xl border border-white/10">
        <p className="text-zinc-500 font-medium">Generate a plan to see 3D visualization</p>
      </div>
    );
  }

  const { walls, rooms, furniture } = plan.threeDLayout;

  return (
    <div className="w-full h-full bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 relative group">
      <Canvas shadows camera={{ position: [15, 15, 15], fov: 50 }}>
        <Suspense fallback={null}>
          <SoftShadows size={25} samples={10} focus={0} />
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="city" />
          
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 20, 10]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          >
            <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 0.5, 50]} />
          </directionalLight>

          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />

          {/* Post-processing Effects */}
          <EffectComposer>
            <N8AO intensity={1.5} aoRadius={2} />
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.9} 
              luminanceSmoothing={0.025} 
              mipmapBlur 
            />
          </EffectComposer>

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>

          {/* Walls */}
          {walls?.map((wall, i) => {
            const dx = wall.end[0] - wall.start[0];
            const dz = wall.end[1] - wall.start[1];
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            const midX = (wall.start[0] + wall.end[0]) / 2;
            const midZ = (wall.start[1] + wall.end[1]) / 2;

            return (
              <mesh 
                key={`wall-${i}`} 
                position={[midX, wall.height / 2, midZ]} 
                rotation={[0, -angle, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[length, wall.height, 0.25]} />
                <meshStandardMaterial 
                  color={viewMode === 'interior' ? "#f5f5f5" : "#e0e0e0"} 
                  roughness={0.5}
                  wireframe={isWireframe}
                  transparent={viewMode === 'interior' && !isWireframe}
                  opacity={viewMode === 'interior' && !isWireframe ? 0.6 : 1}
                />
              </mesh>
            );
          })}

          {/* Rooms / Zones */}
          {viewMode === 'exterior' && rooms?.map((room, i) => (
            <group key={`room-${i}`} position={room.position}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={room.size} />
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.1} />
              </mesh>
              <Text
                position={[0, room.size[1] / 2 + 0.5, 0]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {room.name}
              </Text>
            </group>
          ))}

          {/* Furniture */}
          {furniture?.map((f, i) => (
            <FurnitureModel 
              key={`furn-${i}`} 
              type={f.type} 
              position={f.position} 
              size={f.size} 
              rotation={f.rotation} 
            />
          ))}

          <Grid 
            infiniteGrid 
            fadeDistance={50} 
            fadeStrength={5} 
            cellSize={1} 
            sectionSize={5} 
            sectionColor="#333" 
            cellColor="#222" 
          />
          <ContactShadows opacity={0.4} scale={40} blur={2} far={10} resolution={256} color="#000000" />
        </Suspense>
      </Canvas>
      
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('exterior')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              viewMode === 'exterior' ? "bg-blue-600 border-blue-500 text-white" : "bg-black/40 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            Exterior
          </button>
          <button 
            onClick={() => setViewMode('interior')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              viewMode === 'interior' ? "bg-blue-600 border-blue-500 text-white" : "bg-black/40 border-white/10 text-zinc-400 hover:text-white"
            )}
          >
            Interior
          </button>
        </div>
        <button 
          onClick={() => setIsWireframe(!isWireframe)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2",
            isWireframe ? "bg-orange-600 border-orange-500 text-white" : "bg-black/40 border-white/10 text-zinc-400 hover:text-white"
          )}
        >
          {isWireframe ? "Solid View" : "Wireframe Mode"}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs text-white">
        <p className="font-bold mb-1">Cinematic 3D Engine</p>
        <p className="opacity-70">AO & Bloom Enabled</p>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
