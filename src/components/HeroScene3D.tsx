import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Floating geometric shape
function FloatingShape({ position, scale, rotation, speed }: any) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!meshRef.current) return;

        // Smooth idle rotation
        meshRef.current.rotation.x += 0.001 * speed;
        meshRef.current.rotation.y += 0.002 * speed;
    });

    return (
        <Float
            speed={speed}
            rotationIntensity={0.3}
            floatIntensity={0.5}
            floatingRange={[-0.1, 0.1]}
        >
            <mesh ref={meshRef} position={position} scale={scale} rotation={rotation}>
                <torusKnotGeometry args={[0.4, 0.15, 100, 16]} />
                <meshStandardMaterial
                    color="#a78bfa"
                    metalness={0.8}
                    roughness={0.2}
                    transparent
                    opacity={0.7}
                />
            </mesh>
        </Float>
    );
}

// Glass orb
function GlassOrb({ position, scale }: any) {
    const meshRef = useRef<THREE.Mesh>(null);

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <mesh ref={meshRef} position={position} scale={scale}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    color="#c4b5fd"
                    metalness={0.9}
                    roughness={0.1}
                    transparent
                    opacity={0.6}
                />
            </mesh>
        </Float>
    );
}

// Geometric box with glassmorphism
function GlassBox({ position, scale, rotation }: any) {
    return (
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
            <mesh position={position} scale={scale} rotation={rotation}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#a855f7"
                    metalness={0.7}
                    roughness={0.3}
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </Float>
    );
}

// Scene with shapes
function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!groupRef.current) return;

        // Smooth camera tilt based on mouse position (±6-8 degrees)
        const targetRotationY = mouseX * 0.12; // ~7 degrees
        const targetRotationX = -mouseY * 0.10; // ~6 degrees

        // Lerp for smooth inertia-based motion
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            targetRotationY,
            0.05
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
            groupRef.current.rotation.x,
            targetRotationX,
            0.05
        );
    });

    return (
        <group ref={groupRef}>
            {/* Ambient lights */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a78bfa" />

            {/* Floating geometric shapes */}
            <FloatingShape position={[3, 1, -2]} scale={0.8} rotation={[0.5, 0.5, 0]} speed={1} />
            <FloatingShape position={[-3, -1, -3]} scale={0.6} rotation={[0.2, 0.8, 0.3]} speed={1.2} />

            <GlassOrb position={[0, 0, -4]} scale={1.2} />

            <GlassBox position={[2.5, -1.5, -1]} scale={0.7} rotation={[0.3, 0.4, 0.2]} />
            <GlassBox position={[-2.8, 1.2, -2]} scale={0.5} rotation={[0.6, 0.2, 0.4]} />
        </group>
    );
}

interface HeroScene3DProps {
    className?: string;
}

export default function HeroScene3D({ className = '' }: HeroScene3DProps) {
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

    React.useEffect(() => {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    React.useEffect(() => {
        if (prefersReducedMotion) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse position to -1 to 1 range
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        // Device orientation fallback for mobile
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.beta !== null && e.gamma !== null) {
                // Normalize device orientation
                const x = e.gamma / 45; // Tilt left/right
                const y = e.beta / 45;  // Tilt forward/backward
                setMousePosition({
                    x: Math.max(-1, Math.min(1, x)),
                    y: Math.max(-1, Math.min(1, y))
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Request permission for iOS
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            (DeviceOrientationEvent as any).requestPermission()
                .then((response: string) => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                });
        } else if ('ondeviceorientation' in window) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [prefersReducedMotion]);

    if (prefersReducedMotion) {
        // Simplified static version for accessibility
        return null;
    }

    return (
        <div className={`absolute inset-0 -z-10 ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 2]}
                gl={{
                    alpha: true,
                    antialias: true,
                    powerPreference: "high-performance"
                }}
            >
                <Scene mouseX={mousePosition.x} mouseY={mousePosition.y} />
            </Canvas>
        </div>
    );
}
