import { useState, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Float, Sphere, Cylinder, Stars, OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import * as THREE from 'three'
import api from '../../utils/api'

// ─── 3D Components ────────────────────────────────────────────────────────────

function Island({ position, module, onClick, isSelected }) {
  const meshRef = useRef()
  const progress = module.progress || 0
  const color = progress >= 80 ? '#22c55e' : progress >= 40 ? '#eab308' : '#374151'
  const glowColor = progress >= 80 ? '#22c55e' : progress >= 40 ? '#eab308' : '#4b5563'

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.05
    }
  })

  return (
    <group position={position} onClick={() => onClick(module)}>
      {/* Island base */}
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.3}>
        <group ref={meshRef}>
          {/* Ground */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.8, 2.2, 0.4, 8]} />
            <meshStandardMaterial color={isSelected ? '#16a34a' : '#1e3a1e'} roughness={0.8} />
          </mesh>
          {/* Top surface */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[1.7, 1.8, 0.15, 8]} />
            <meshStandardMaterial color={isSelected ? '#22c55e' : '#166534'} roughness={0.6} />
          </mesh>
          {/* Progress ring */}
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.9, 0.08, 8, 32, (progress / 100) * Math.PI * 2]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.5} />
          </mesh>
          {/* Trees (topics as trees) */}
          {module.topics?.slice(0, 4).map((topic, i) => {
            const angle = (i / 4) * Math.PI * 2
            const r = 0.8
            const tx = Math.cos(angle) * r
            const tz = Math.sin(angle) * r
            const tColor = (topic.progress || 0) >= 80 ? '#22c55e' : (topic.progress || 0) > 0 ? '#86efac' : '#374151'
            return (
              <group key={topic.id} position={[tx, 0.4, tz]}>
                {/* Trunk */}
                <mesh>
                  <cylinderGeometry args={[0.06, 0.09, 0.4, 6]} />
                  <meshStandardMaterial color="#92400e" roughness={1} />
                </mesh>
                {/* Foliage */}
                <mesh position={[0, 0.45, 0]}>
                  <sphereGeometry args={[0.28, 8, 8]} />
                  <meshStandardMaterial color={tColor} roughness={0.7} emissive={tColor} emissiveIntensity={0.1} />
                </mesh>
              </group>
            )
          })}
          {/* Module title floating above */}
          <Text
            position={[0, 2.2, 0]}
            fontSize={0.22}
            color="#86efac"
            anchorX="center"
            anchorY="middle"
            font={undefined}
            maxWidth={3}
          >
            {module.title.length > 20 ? module.title.substring(0, 18) + '…' : module.title}
          </Text>
          {/* Progress percentage */}
          <Text
            position={[0, 1.7, 0]}
            fontSize={0.16}
            color={glowColor}
            anchorX="center"
          >
            {Math.round(progress)}%
          </Text>
        </group>
      </Float>

      {/* Selection glow */}
      {isSelected && (
        <pointLight position={[0, 1, 0]} color="#22c55e" intensity={3} distance={5} />
      )}
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#0a1f0a" roughness={1} />
    </mesh>
  )
}

function Scene({ modules, onSelect, selectedId }) {
  const positions = useMemo(() => {
    return modules.map((_, i) => {
      const angle = (i / modules.length) * Math.PI * 2
      const r = Math.max(4, modules.length * 1.2)
      return [Math.cos(angle) * r, 0, Math.sin(angle) * r]
    })
  }, [modules.length])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <pointLight position={[0, 8, 0]} color="#22c55e" intensity={0.5} distance={20} />
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade />
      <Ground />
      {modules.map((m, i) => (
        <Island
          key={m.id}
          position={positions[i]}
          module={m}
          onClick={onSelect}
          isSelected={selectedId === m.id}
        />
      ))}
      <OrbitControls
        enableZoom maxZoom={3} minZoom={0.5}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.2}
        autoRotate autoRotateSpeed={0.3}
      />
    </>
  )
}

// ─── Module Detail Panel ──────────────────────────────────────────────────────

function ModulePanel({ module, onClose }) {
  const [expandedTopic, setExpandedTopic] = useState(null)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="absolute right-0 top-0 bottom-0 w-80 glass border-l border-forest-900/40 overflow-y-auto z-20"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-forest-100 text-lg">{module.title}</h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-300 text-xl">✕</button>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-forest-500 mb-1.5">
            <span>Overall Progress</span>
            <span className="text-forest-300 font-display font-semibold">{module.completed}/{module.total} done</span>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill bg-gradient-to-r from-forest-700 to-forest-400" style={{ width: `${module.progress}%` }} />
          </div>
          <p className="text-forest-400 text-xs mt-1">{Math.round(module.progress)}% complete</p>
        </div>

        {/* Topics */}
        <div className="space-y-3">
          {module.topics.map((topic) => (
            <div key={topic.id} className="bg-night-850 rounded-xl border border-forest-900/30 overflow-hidden">
              <button
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-forest-900/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌳</span>
                  <div>
                    <p className="font-display font-semibold text-forest-200 text-sm">{topic.title}</p>
                    <p className="text-forest-600 text-xs">{topic.avgScore > 0 ? `Avg: ${topic.avgScore}%` : 'Not started'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${topic.progress >= 100 ? 'badge-green' : topic.progress > 0 ? 'badge-yellow' : 'badge-red'}`}>
                    {Math.round(topic.progress)}%
                  </span>
                  <span className="text-forest-600">{expandedTopic === topic.id ? '▲' : '▼'}</span>
                </div>
              </button>

              <AnimatePresence>
                {expandedTopic === topic.id && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-2 border-t border-forest-900/30">
                      {topic.assessments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{a.completed ? '🍎' : '⚪'}</span>
                            <span className="text-forest-300 text-xs font-display">{a.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.completed ? (
                              <span className={`badge text-xs ${a.score >= 80 ? 'badge-green' : a.score >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                                {a.score}%
                              </span>
                            ) : (
                              <span className="text-forest-700 text-xs">pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {topic.assessments.length === 0 && (
                        <p className="text-forest-700 text-xs text-center py-2">No assessments</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentRoadmap() {
  const [selectedModule, setSelectedModule] = useState(null)

  const { data: roadmap = [], isLoading } = useQuery({
    queryKey: ['studentRoadmap'],
    queryFn: () => api.get('/student/roadmap').then(r => r.data),
  })

  const totalProgress = roadmap.length
    ? roadmap.reduce((s, m) => s + m.progress, 0) / roadmap.length
    : 0

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="font-display font-bold text-2xl text-forest-100 text-glow">Learning Roadmap</h1>
          <p className="text-forest-500 text-sm">Explore your modules in 3D · {roadmap.length} islands</p>
        </div>
        <div className="pointer-events-auto glass px-4 py-2 rounded-xl">
          <p className="text-forest-500 text-xs font-display uppercase tracking-wide">Overall Progress</p>
          <p className="text-forest-300 font-display font-bold text-xl">{Math.round(totalProgress)}%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 glass px-4 py-3 rounded-xl">
        <p className="text-forest-600 text-xs font-display font-semibold mb-2 uppercase tracking-wide">Legend</p>
        <div className="space-y-1.5">
          {[['🟢', 'Completed (≥80%)', '#22c55e'], ['🟡', 'In Progress (40–79%)', '#eab308'], ['⚫', 'Not Started', '#374151']].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-sm">{icon}</span>
              <span className="text-forest-500 text-xs">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-forest-700 text-xs mt-3">Click island to view details</p>
        <p className="text-forest-700 text-xs">Drag to rotate • Scroll to zoom</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl animate-bounce mb-4">🌿</div>
            <p className="text-forest-400 font-display animate-pulse">Growing your learning world…</p>
          </div>
        </div>
      ) : roadmap.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center glass-card p-10">
            <div className="text-6xl mb-4">🏝️</div>
            <h2 className="font-display font-bold text-forest-200 text-xl mb-2">No modules yet</h2>
            <p className="text-forest-600 text-sm">Ask your admin to enroll you in modules</p>
          </div>
        </div>
      ) : (
        <Canvas
          shadows
          camera={{ position: [0, 8, 14], fov: 55 }}
          className="w-full h-full"
          style={{ background: 'linear-gradient(to bottom, #040810, #0a1f0a)' }}
        >
          <Suspense fallback={null}>
            <Scene
              modules={roadmap}
              onSelect={setSelectedModule}
              selectedId={selectedModule?.id}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Module detail panel */}
      <AnimatePresence>
        {selectedModule && (
          <ModulePanel module={selectedModule} onClose={() => setSelectedModule(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
