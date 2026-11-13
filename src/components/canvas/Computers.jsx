import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";

import CanvasLoader from "../Loader";
import { asset } from "../../lib/asset";

const Computers = ({ isMobile }) => {
  // scene.glb is the original scene.gltf export (15.8 MB with its textures) run
  // through gltf-transform: meshopt-compressed geometry and 1024px WebP textures,
  // 1.4 MB in one file. To regenerate from a fresh export:
  //   npx @gltf-transform/cli optimize scene.gltf scene.glb --compress meshopt --texture-compress webp --texture-size 1024
  // Draco is off (the file does not use it); the meshopt decoder is on.
  const computer = useGLTF(asset("desktop_pc/scene.glb"), false, true);

  return (
    <mesh>
      <hemisphereLight intensity={0.15} groundColor='black' />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1} />
      <primitive
        object={computer.scene}
        scale={isMobile ? 0.7 : 0.75}
        position={isMobile ? [0, -1.5, -1.5] : [0, -3.25, -1.5]}
        rotation={[-0.01, -0.2, -0.1]}
      />
    </mesh>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add a listener for changes to the screen size
    const mediaQuery = window.matchMedia("(max-width: 1024px)");

    // Set the initial value of the `isMobile` state variable
    setIsMobile(mediaQuery.matches);

    // Define a callback function to handle changes to the media query
    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    // Add the callback function as a listener for changes to the media query
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    // Remove the listener when the component is unmounted
    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return (
    <div className={`w-full h-full transition-all duration-500 ${isLoading ? 'lg:!absolute lg:!left-1/2 lg:!-translate-x-1/2 lg:!right-auto' : ''}`} style={{ touchAction: 'none' }}>
      <Canvas
        frameloop='demand'
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [20, 3, 5], fov: 25 }}
        gl={{ powerPreference: 'high-performance' }}
        onCreated={() => setTimeout(() => setIsLoading(false), 100)}
        style={{ pointerEvents: 'auto' }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
            enablePan={false}
          />
          <Computers isMobile={isMobile} />
        </Suspense>

        <Preload all />
      </Canvas>
    </div>
  );
};

export default ComputersCanvas;
