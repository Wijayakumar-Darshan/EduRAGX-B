import {
  useState,
  useRef,
  useEffect,
  Suspense,
  useMemo,
} from 'react'
import {
  Canvas,
  useFrame,
  useThree,
} from '@react-three/fiber'
import {
  Text,
  Float,
  OrbitControls,
  Sparkles,
} from '@react-three/drei'
import {
  motion,
  AnimatePresence,
} from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import * as THREE from 'three'
import api from '../../utils/api'

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const PATH_AMPLITUDE = 3.6
const PATH_WAVELENGTH = 22
const MODULE_SPACING = 8.5

const TREE_COLORS = ['#3f8f4c', '#5ca85c', '#72b85c', '#88c76b', '#3c7f45']
const FLOWER_COLORS = ['#f6b6d8', '#ffd166', '#ff8c69', '#b8a1ff', '#ffffff']

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function getPathPoint(t) {
  const x = Math.sin((t / PATH_WAVELENGTH) * Math.PI * 2) * PATH_AMPLITUDE
  return { x, z: -t }
}

function getPathAngle(t) {
  const dxdt =
    Math.cos((t / PATH_WAVELENGTH) * Math.PI * 2) *
    PATH_AMPLITUDE *
    ((Math.PI * 2) / PATH_WAVELENGTH)
  const dzdt = -1
  return Math.atan2(dxdt, dzdt)
}

function perpendicular(angle, side = 1) {
  return [Math.cos(angle) * side, -Math.sin(angle) * side]
}

function getRoadLength(moduleCount) {
  return Math.max(80, (moduleCount + 3) * MODULE_SPACING)
}

function getProgress(module) {
  const value = Number(module?.progress || 0)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function getModuleState(progress) {
  if (progress >= 80) return 'completed'
  if (progress > 0) return 'progress'
  return 'not-started'
}

function resolveGender(student) {
  if (!student) return 'neutral'
  const gender = String(student.gender || '').trim().toLowerCase()
  if (['male', 'm', 'boy'].includes(gender)) return 'male'
  if (['female', 'f', 'girl'].includes(gender)) return 'female'
  return 'neutral'
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═════════════════════════════════════════════════════════════════════════════

const TRANSLATIONS = {
  en: {
    overall: 'Overall Progress',
    details: 'Module Details',
    language: 'Language',
    done: 'done',
    complete: 'complete',
    notStarted: 'Not started',
    pending: 'Pending',
    noAssessments: 'No assessments yet',
    avg: 'Avg',
    learningJourney: 'Student Learning Journey',
    completed: 'Completed',
    inProgress: 'In Progress',
    yourPosition: 'Your Position',
    finish: 'School',
    environment: 'Protect Nature',
  },
  si: {
    overall: 'සමස්ත ප්‍රගතිය',
    details: 'මොඩියුල විස්තර',
    language: 'භාෂාව',
    done: 'සම්පූර්ණයි',
    complete: 'සම්පූර්ණයි',
    notStarted: 'ආරම්භ කර නැත',
    pending: 'බලා සිටින',
    noAssessments: 'තවම ඇගයීම් නැත',
    avg: 'සාමාන්‍යය',
    learningJourney: 'ශිෂ්‍ය ඉගෙනුම් ගමන',
    completed: 'සම්පූර්ණයි',
    inProgress: 'ඉදිරියට යමින්',
    yourPosition: 'ඔබ සිටින ස්ථානය',
    finish: 'පාසල',
    environment: 'ස්වභාවය ආරක්ෂා කරමු',
  },
  ta: {
    overall: 'மொத்த முன்னேற்றம்',
    details: 'தொகுதி விவரங்கள்',
    language: 'மொழி',
    done: 'முடிந்தது',
    complete: 'முடிந்தது',
    notStarted: 'தொடங்கப்படவில்லை',
    pending: 'நிலுவையில்',
    noAssessments: 'இன்னும் மதிப்பீடுகள் இல்லை',
    avg: 'சராசரி',
    learningJourney: 'மாணவர் கற்றல் பயணம்',
    completed: 'முடிந்தது',
    inProgress: 'முன்னேற்றத்தில்',
    yourPosition: 'உங்கள் நிலை',
    finish: 'பள்ளி',
    environment: 'இயற்கையை பாதுகாப்போம்',
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// SKY / ATMOSPHERE
// ═════════════════════════════════════════════════════════════════════════════

function Sun() {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = state.clock.elapsedTime * 0.012
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.02
    ref.current.scale.setScalar(pulse)
  })

  return (
    <group ref={ref} position={[-14, 18, -35]}>
      <mesh>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial color="#fff1a8" />
      </mesh>
      <pointLight color="#fff2c4" intensity={4.5} distance={70} decay={1.5} />
    </group>
  )
}

function Cloud({ position, scale = 1, speed = 0.15 }) {
  const ref = useRef()
  const startX = position[0]

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.x = startX + Math.sin(state.clock.elapsedTime * speed) * 2.8
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.12 + position[2]) * 0.12
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {[
        [0, 0, 0, 1.2],
        [1.15, 0.1, 0, 0.8],
        [-1.05, 0, 0.05, 0.75],
        [0.25, 0.55, 0, 0.7],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <sphereGeometry args={[1, 14, 14]} />
          <meshStandardMaterial color={i === 2 ? '#eef7ff' : '#ffffff'} roughness={1} transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  )
}

function Bird({ position, scale = 1, speed = 1, phase = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + phase
    ref.current.position.x = position[0] + Math.sin(t * 0.35) * 5
    ref.current.position.y = position[1] + Math.sin(t * 0.7) * 0.55
    ref.current.position.z = position[2] + Math.cos(t * 0.25) * 4
    ref.current.rotation.z = Math.sin(t * 1.5) * 0.12
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[-0.18, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.38, 0.025, 0.12]} />
        <meshStandardMaterial color="#29333b" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.38, 0.025, 0.12]} />
        <meshStandardMaterial color="#29333b" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#20272c" />
      </mesh>
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// NATURE ELEMENTS
// ═════════════════════════════════════════════════════════════════════════════

function AnimatedTree({ position, scale = 1, color = '#5ca85c', phase = 0 }) {
  const foliageRef = useRef()
  useFrame((state) => {
    if (!foliageRef.current) return
    const t = state.clock.elapsedTime * 0.65 + phase
    foliageRef.current.rotation.z = Math.sin(t) * 0.03
    foliageRef.current.rotation.x = Math.cos(t * 0.8) * 0.02
  })

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2.1, 8]} />
        <meshStandardMaterial color="#684329" roughness={0.95} />
      </mesh>
      <mesh position={[0.15, 1.55, 0]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.07, 0.1, 0.85, 7]} />
        <meshStandardMaterial color="#684329" roughness={1} />
      </mesh>
      <group ref={foliageRef}>
        {[
          [0, 2.15, 0, 0.8],
          [0.65, 2.05, 0.1, 0.75],
          [-0.58, 2.05, -0.05, 0.7],
          [0, 2.65, 0, 0.58],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={s} castShadow>
            <sphereGeometry args={[0.7, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function GrassPatch({ position, scale = 1, phase = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3 + phase) * 0.07
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i - 1.5) * 0.08, 0.12, 0]} rotation={[0, 0, (i - 1.5) * 0.15]}>
          <coneGeometry args={[0.025, 0.3, 4]} />
          <meshStandardMaterial color="#4f9a4e" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Flower({ position, color, phase = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3 + phase) * 0.07
  })

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.2, 5]} />
        <meshStandardMaterial color="#438747" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Butterfly({ position, color, phase = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 0.85 + phase
    ref.current.position.x = position[0] + Math.sin(t) * 1.15
    ref.current.position.y = position[1] + Math.sin(t * 1.6) * 0.32
    ref.current.position.z = position[2] + Math.cos(t * 0.75) * 1.05
    ref.current.rotation.y = Math.sin(t) * 0.45
    ref.current.children.forEach((child, index) => {
      if (index < 2) child.rotation.y = Math.sin(t * 7.5) * 0.75
    })
  })

  return (
    <group ref={ref} position={position}>
      <mesh scale={[0.18, 0.35, 0.02]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh scale={[0.18, 0.35, 0.02]} position={[0.24, 0, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#33251f" />
      </mesh>
    </group>
  )
}

function Mountain({ position, scale = 1, color = '#67985b' }) {
  return (
    <group position={position} scale={scale}>
      <mesh receiveShadow>
        <coneGeometry args={[5, 5, 8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 2.15, 0.1]} scale={[0.45, 0.45, 0.45]}>
        <coneGeometry args={[5, 5, 8]} />
        <meshStandardMaterial color="#dfead4" roughness={1} />
      </mesh>
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ROAD & RIVER
// ═════════════════════════════════════════════════════════════════════════════

function LearningRoad({ roadLength }) {
  const segments = useMemo(() => {
    const result = []
    for (let t = 0; t < roadLength; t += 1.15) {
      const mid = t + 0.57
      result.push({ p: getPathPoint(mid), angle: getPathAngle(mid), length: 1.35 })
    }
    return result
  }, [roadLength])

  const laneMarks = useMemo(() => {
    const result = []
    for (let t = 0.8; t < roadLength; t += 2) {
      result.push({ p: getPathPoint(t), angle: getPathAngle(t) })
    }
    return result
  }, [roadLength])

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh
          key={`road-${index}`}
          position={[segment.p.x, 0, segment.p.z]}
          rotation={[0, segment.angle, 0]}
          receiveShadow
        >
          <boxGeometry args={[6.3, 0.12, segment.length]} />
          <meshStandardMaterial color="#55544f" roughness={0.92} />
        </mesh>
      ))}

      {segments.map((segment, index) => {
        const perp = perpendicular(segment.angle, 1)
        return (
          <group key={`edge-${index}`}>
            <mesh
              position={[segment.p.x + perp[0] * 3.1, 0.09, segment.p.z + perp[1] * 3.1]}
              rotation={[0, segment.angle, 0]}
            >
              <boxGeometry args={[0.18, 0.12, segment.length]} />
              <meshStandardMaterial color="#e7d9ae" roughness={0.8} />
            </mesh>
            <mesh
              position={[segment.p.x - perp[0] * 3.1, 0.09, segment.p.z - perp[1] * 3.1]}
              rotation={[0, segment.angle, 0]}
            >
              <boxGeometry args={[0.18, 0.12, segment.length]} />
              <meshStandardMaterial color="#e7d9ae" roughness={0.8} />
            </mesh>
          </group>
        )
      })}

      {laneMarks.map((mark, index) => (
        <mesh
          key={`lane-${index}`}
          position={[mark.p.x, 0.08, mark.p.z]}
          rotation={[0, mark.angle, 0]}
        >
          <boxGeometry args={[0.12, 0.025, 0.9]} />
          <meshStandardMaterial color="#f7e6a7" emissive="#f7d66a" emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  )
}

function River({ roadLength }) {
  const waterRef = useRef()
  const geometry = useMemo(() => {
    const segments = []
    for (let t = 0; t <= roadLength; t += 1.2) {
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const perp = perpendicular(angle, 1)
      segments.push({
        left: [p.x + perp[0] * 5.2, 0.03, p.z + perp[1] * 5.2],
        right: [p.x + perp[0] * 7.8, 0.03, p.z + perp[1] * 7.8],
      })
    }

    const positions = []
    const indices = []
    for (let i = 0; i < segments.length - 1; i++) {
      const s = segments[i]
      const n = segments[i + 1]
      const base = i * 4
      positions.push(...s.left, ...s.right, ...n.left, ...n.right)
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [roadLength])

  useFrame((state) => {
    if (!waterRef.current) return
    waterRef.current.position.y = 0.03 + Math.sin(state.clock.elapsedTime * 0.65) * 0.008
  })

  return (
    <mesh ref={waterRef} geometry={geometry}>
      <meshStandardMaterial
        color="#4ba8bd"
        transparent
        opacity={0.65}
        roughness={0.12}
        metalness={0.06}
      />
    </mesh>
  )
}

function Fish({ start, roadLength, speed, color }) {
  const ref = useRef()
  const progress = useRef(start / roadLength)

  useFrame((state) => {
    progress.current += speed * 0.00065
    if (progress.current > 1) progress.current = 0

    const t = progress.current * roadLength
    const p = getPathPoint(t)
    const angle = getPathAngle(t)
    const perp = perpendicular(angle, 1)

    if (!ref.current) return
    ref.current.position.set(
      p.x + perp[0] * 6.3,
      0.14 + Math.sin(state.clock.elapsedTime * 2 + t) * 0.035,
      p.z + perp[1] * 6.3
    )
    ref.current.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE STONE
// ═════════════════════════════════════════════════════════════════════════════

function ModuleStone({ module, position, rotationY, selected, onClick, index }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const progress = getProgress(module)
  const state = getModuleState(progress)

  useFrame((clockState) => {
    const t = clockState.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationY + Math.sin(t * 0.4 + index) * 0.02
      groupRef.current.position.y = position[1] + Math.sin(t * 0.85 + index) * 0.03
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = selected
        ? 0.32 + Math.sin(t * 1.8) * 0.12
        : state === 'completed'
          ? 0.1 + Math.sin(t * 1.3) * 0.04
          : 0
    }
  })

  const stoneColor = state === 'completed' ? '#68a95b' : state === 'progress' ? '#c59b52' : '#8c918d'
  const stoneDark = state === 'completed' ? '#3f7439' : state === 'progress' ? '#806335' : '#626662'
  const glowColor = state === 'completed' ? '#74e06c' : state === 'progress' ? '#ffd166' : '#ffffff'

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick(module)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      <mesh ref={glowRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 2.05, 48]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      <group ref={groupRef} rotation={[0, rotationY, 0]}>
        <mesh position={[0, 0.35, 0]} scale={[1.45, 0.55, 1.15]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial color={stoneColor} roughness={0.9} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.18, 0.08]} scale={[1.5, 0.32, 1.18]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={stoneDark} roughness={1} />
        </mesh>
        <mesh position={[-0.45, 0.65, 0.42]} scale={[0.3, 0.07, 0.15]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={state === 'not-started' ? 0.08 : 0.16} />
        </mesh>

        <Text
          position={[0, 0.83, 0]}
          fontSize={0.24}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.014}
          outlineColor="#243125"
        >
          {`MODULE ${index + 1}`}
        </Text>
        <Text
          position={[0, 0.58, 0]}
          fontSize={0.18}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
          outlineWidth={0.011}
          outlineColor="#28322b"
        >
          {module.title || `Module ${index + 1}`}
        </Text>
        <Text
          position={[0, 0.30, 0]}
          fontSize={0.27}
          color={state === 'completed' ? '#d9ffd1' : state === 'progress' ? '#fff1b0' : '#e5e7e5'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.011}
          outlineColor="#263028"
        >
          {`${Math.round(progress)}%`}
        </Text>
        <Text
          position={[0, 0.05, 0]}
          fontSize={0.125}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.009}
          outlineColor="#263028"
        >
          {state === 'completed' ? 'COMPLETED' : state === 'progress' ? 'IN PROGRESS' : 'NOT STARTED'}
        </Text>

        {state === 'completed' &&
          [0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2
            return (
              <AnimatedTree
                key={i}
                position={[Math.cos(angle) * 1.25, 0, Math.sin(angle) * 1.0]}
                scale={0.18}
                color="#72b85c"
                phase={i}
              />
            )
          })}
      </group>

      {selected && (
        <pointLight
          position={[0, 1.2, 0]}
          color={state === 'completed' ? '#8cff7c' : '#ffd166'}
          intensity={2.6}
          distance={5}
        />
      )}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT CHARACTER
// ═════════════════════════════════════════════════════════════════════════════

function StudentCharacter({ gender }) {
  const leftLeg = useRef()
  const rightLeg = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const body = useRef()

  const isGirl = gender === 'female'
  const isBoy = gender === 'male'
  const skin = '#d9a47e'
  const hair = isGirl ? '#4a2d20' : '#28221c'
  const shirt = isGirl ? '#e66a91' : isBoy ? '#3b82d0' : '#4d9b5a'
  const pants = isGirl ? '#df658d' : '#26384e'

  useFrame((state) => {
    const t = state.clock.elapsedTime * 6.5
    const walk = Math.sin(t)
    if (leftLeg.current) leftLeg.current.rotation.x = walk * 0.48
    if (rightLeg.current) rightLeg.current.rotation.x = -walk * 0.48
    if (leftArm.current) leftArm.current.rotation.x = -walk * 0.32
    if (rightArm.current) rightArm.current.rotation.x = walk * 0.32
    if (body.current) body.current.position.y = 0.02 + Math.abs(walk) * 0.022
  })

  return (
    <group ref={body}>
      <mesh position={[0, 0.72, -0.17]}>
        <boxGeometry args={[0.25, 0.38, 0.12]} />
        <meshStandardMaterial color="#8a5136" roughness={0.8} />
      </mesh>

      <group ref={leftLeg} position={[-0.09, 0.36, 0]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.42, 7]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.25, 0.04]}>
          <boxGeometry args={[0.12, 0.07, 0.23]} />
          <meshStandardMaterial color="#30343a" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.09, 0.36, 0]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.42, 7]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.25, 0.04]}>
          <boxGeometry args={[0.12, 0.07, 0.23]} />
          <meshStandardMaterial color="#30343a" />
        </mesh>
      </group>

      <mesh position={[0, 0.72, 0]}>
        {isGirl ? (
          <coneGeometry args={[0.28, 0.55, 10]} />
        ) : (
          <boxGeometry args={[0.34, 0.48, 0.22]} />
        )}
        <meshStandardMaterial color={shirt} roughness={0.75} />
      </mesh>

      <group ref={leftArm} position={[-0.22, 0.79, 0]}>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.36, 7]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.22, 0.79, 0]}>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.36, 7]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh position={[0.12, -0.18, 0.04]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.28, 0.08, 0.2]} />
          <meshStandardMaterial color="#f2d16b" roughness={0.6} />
        </mesh>
        <mesh position={[0.12, -0.18, 0.08]}>
          <boxGeometry args={[0.23, 0.015, 0.16]} />
          <meshStandardMaterial color="#f8f5e9" />
        </mesh>
      </group>

      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.1, 8]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.31, 0]} scale={[1.02, 0.62, 1.02]}>
        <sphereGeometry args={[0.185, 12, 12]} />
        <meshStandardMaterial color={hair} roughness={0.9} />
      </mesh>

      {isGirl && (
        <>
          <mesh position={[-0.17, 1.18, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={hair} />
          </mesh>
          <mesh position={[0.17, 1.18, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={hair} />
          </mesh>
        </>
      )}
    </group>
  )
}

function StudentMarker({ travelRef, gender, name }) {
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const t = travelRef.current
    const p = getPathPoint(t)
    const angle = getPathAngle(t)

    ref.current.position.x += (p.x - ref.current.position.x) * 0.075
    ref.current.position.z += (p.z - ref.current.position.z) * 0.075
    ref.current.rotation.y += THREE.MathUtils.lerp(0, angle - ref.current.rotation.y, 0.075)
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 4.5) * 0.02
  })

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial color="#f5c84b" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <StudentCharacter gender={gender} />
      <Float speed={2} floatIntensity={0.22} rotationIntensity={0}>
        <Text
          position={[0, 1.62, 0]}
          fontSize={0.16}
          color="#ffffff"
          anchorX="center"
          outlineWidth={0.014}
          outlineColor="#31523b"
        >
          {name || 'YOU'}
        </Text>
      </Float>
      <pointLight color="#ffe08a" intensity={1.3} distance={3} />
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// BOARDS, SCHOOL, GATE
// ═════════════════════════════════════════════════════════════════════════════

function EnvironmentBoard({ position, rotationY = 0, title, subtitle }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.01
  })

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-0.8, 0.85, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 1.7, 6]} />
        <meshStandardMaterial color="#66432a" />
      </mesh>
      <mesh position={[0.8, 0.85, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 1.7, 6]} />
        <meshStandardMaterial color="#66432a" />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[2.15, 1.05, 0.1]} />
        <meshStandardMaterial color="#805332" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.55, 0.06]}>
        <boxGeometry args={[1.92, 0.82, 0.025]} />
        <meshStandardMaterial color="#e9d8a6" roughness={0.7} />
      </mesh>
      <Text position={[0, 1.72, 0.08]} fontSize={0.15} color="#2e5533" anchorX="center" anchorY="middle" maxWidth={1.75}>
        {title}
      </Text>
      <Text position={[0, 1.45, 0.08]} fontSize={0.1} color="#5d5947" anchorX="center" anchorY="middle" maxWidth={1.7}>
        {subtitle}
      </Text>
      <mesh position={[-0.75, 1.88, 0.08]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.09, 7, 7]} />
        <meshStandardMaterial color="#4f9c4b" />
      </mesh>
      <mesh position={[0.75, 1.88, 0.08]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.09, 7, 7]} />
        <meshStandardMaterial color="#4f9c4b" />
      </mesh>
    </group>
  )
}

function School({ position }) {
  const flag = useRef()
  useFrame((state) => {
    if (!flag.current) return
    flag.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.8) * 0.07
  })

  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[7, 4, 3]} />
        <meshStandardMaterial color="#f1e4c8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <coneGeometry args={[5, 2, 4]} />
        <meshStandardMaterial color="#a8573b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, 1.55]}>
        <boxGeometry args={[1.25, 2.3, 0.12]} />
        <meshStandardMaterial color="#6d4c3d" />
      </mesh>
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 2.5, 1.56]}>
          <boxGeometry args={[1.1, 1, 0.08]} />
          <meshStandardMaterial color="#8fd4e8" roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[2.7, 5.7, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 3, 8]} />
        <meshStandardMaterial color="#6a573f" />
      </mesh>
      <group ref={flag} position={[3.2, 6.8, 0]}>
        <mesh>
          <boxGeometry args={[1, 0.55, 0.03]} />
          <meshStandardMaterial color="#e9c46a" />
        </mesh>
      </group>
      <Text position={[0, 4.95, 1.6]} fontSize={0.42} color="#315c3d" anchorX="center" anchorY="middle" outlineWidth={0.018} outlineColor="#ffffff">
        SCHOOL
      </Text>
      <Text position={[0, 5.45, 1.6]} fontSize={0.17} color="#66836b" anchorX="center" anchorY="middle">
        YOUR FUTURE STARTS HERE
      </Text>
    </group>
  )
}

function FinishGate({ roadLength }) {
  const p = getPathPoint(roadLength - 3)
  const angle = getPathAngle(roadLength - 3)

  return (
    <group position={[p.x, 0, p.z]} rotation={[0, angle, 0]}>
      <mesh position={[-3, 1.8, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 3.6, 8]} />
        <meshStandardMaterial color="#69472b" />
      </mesh>
      <mesh position={[3, 1.8, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 3.6, 8]} />
        <meshStandardMaterial color="#69472b" />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <boxGeometry args={[6.3, 0.7, 0.12]} />
        <meshStandardMaterial color="#6c9b5a" />
      </mesh>
      <Text position={[0, 3.35, 0.08]} fontSize={0.33} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.014} outlineColor="#36543c">
        KEEP LEARNING
      </Text>
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// CAMERA & SCROLL
// ═════════════════════════════════════════════════════════════════════════════

function ScrollTravel({ roadLength, travelRef, controlsRef }) {
  const { camera, gl } = useThree()
  const cameraZ = useRef(camera.position.z)

  useEffect(() => {
    const dom = gl.domElement
    const minZ = -(roadLength - 6)
    const maxZ = 8

    const handleWheel = (event) => {
      event.preventDefault()
      const movement = event.deltaY * 0.016
      const next = THREE.MathUtils.clamp(cameraZ.current - movement, minZ, maxZ)
      const difference = next - cameraZ.current
      cameraZ.current = next
      camera.position.z += difference
      if (controlsRef.current) {
        controlsRef.current.target.z += difference
        controlsRef.current.update()
      }
      travelRef.current = THREE.MathUtils.clamp(travelRef.current - difference, 0, roadLength - 7)
    }

    dom.addEventListener('wheel', handleWheel, { passive: false })
    return () => dom.removeEventListener('wheel', handleWheel)
  }, [camera, gl, roadLength, controlsRef, travelRef])

  return null
}

function CameraAtmosphere() {
  const { camera } = useThree()
  useFrame((state) => {
    camera.position.y = 3.55 + Math.sin(state.clock.elapsedTime * 0.28) * 0.04
  })
  return null
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN 3D SCENE
// ═════════════════════════════════════════════════════════════════════════════

function Scene({ modules, onSelect, selectedId, gender, studentName }) {
  const controlsRef = useRef()
  const roadLength = getRoadLength(modules.length)
  const travelRef = useRef(0)

  const modulePositions = useMemo(() => {
    return modules.map((_, index) => {
      const t = (index + 1) * MODULE_SPACING
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const side = index % 2 === 0 ? -1 : 1
      const perp = perpendicular(angle, side)
      const offset = 2.8 + seededRandom(index * 3.4) * 0.7
      return {
        position: [p.x + perp[0] * offset, 0.15, p.z + perp[1] * offset],
        rotationY: angle + (side === 1 ? Math.PI / 2 : -Math.PI / 2),
      }
    })
  }, [modules])

  const trees = useMemo(() => {
    const result = []
    const count = Math.max(48, modules.length * 7)
    for (let i = 0; i < count; i++) {
      const t = seededRandom(i * 11.7) * roadLength
      const side = seededRandom(i * 3.7) > 0.5 ? 1 : -1
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const perp = perpendicular(angle, side)
      const distance = 6 + seededRandom(i * 5.2) * 8
      result.push({
        position: [p.x + perp[0] * distance, 0, p.z + perp[1] * distance],
        scale: 0.65 + seededRandom(i * 8.1) * 0.9,
        color: TREE_COLORS[i % TREE_COLORS.length],
        phase: seededRandom(i * 2.4) * Math.PI * 2,
      })
    }
    return result
  }, [roadLength, modules.length])

  const flowers = useMemo(() => {
    const result = []
    const count = Math.max(75, modules.length * 9)
    for (let i = 0; i < count; i++) {
      const t = seededRandom(i * 2.8) * roadLength
      const side = seededRandom(i * 5.1) > 0.5 ? 1 : -1
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const perp = perpendicular(angle, side)
      const distance = 3.8 + seededRandom(i * 7.2) * 7
      result.push({
        position: [p.x + perp[0] * distance, 0, p.z + perp[1] * distance],
        color: FLOWER_COLORS[i % FLOWER_COLORS.length],
        phase: seededRandom(i * 4.8) * Math.PI * 2,
      })
    }
    return result
  }, [roadLength, modules.length])

  const grass = useMemo(() => {
    const result = []
    const count = Math.max(100, modules.length * 14)
    for (let i = 0; i < count; i++) {
      const t = seededRandom(i * 6.3) * roadLength
      const side = seededRandom(i * 4.4) > 0.5 ? 1 : -1
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const perp = perpendicular(angle, side)
      const distance = 3.5 + seededRandom(i * 1.8) * 8
      result.push({
        position: [p.x + perp[0] * distance, 0, p.z + perp[1] * distance],
        scale: 0.5 + seededRandom(i * 3.5),
        phase: seededRandom(i * 9) * Math.PI * 2,
      })
    }
    return result
  }, [roadLength, modules.length])

  const mountains = useMemo(() => {
    const result = []
    for (let i = 0; i < 18; i++) {
      const t = seededRandom(i * 4.2) * roadLength
      const side = i % 2 === 0 ? 1 : -1
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const perp = perpendicular(angle, side)
      const distance = 15 + seededRandom(i * 2.7) * 10
      result.push({
        position: [p.x + perp[0] * distance, -2, p.z + perp[1] * distance],
        scale: 0.8 + seededRandom(i * 1.7) * 1.4,
      })
    }
    return result
  }, [roadLength])

  const clouds = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      position: [
        (seededRandom(i * 4.2) - 0.5) * 40,
        10 + seededRandom(i * 2.8) * 5,
        -seededRandom(i * 7.4) * roadLength,
      ],
      scale: 1 + seededRandom(i * 3.1) * 1.4,
      speed: 0.08 + seededRandom(i * 2.1) * 0.1,
    }))
  }, [roadLength])

  const birds = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      position: [
        (seededRandom(i * 3.3) - 0.5) * 24,
        7 + seededRandom(i * 5.2) * 7,
        -seededRandom(i * 6.4) * roadLength,
      ],
      scale: 0.6 + seededRandom(i * 2.2) * 0.7,
      speed: 0.4 + seededRandom(i * 7.1) * 0.5,
      phase: seededRandom(i * 8.4) * Math.PI * 2,
    }))
  }, [roadLength])

  const butterflies = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      position: [
        (seededRandom(i * 2.5) - 0.5) * 12,
        0.8 + seededRandom(i * 4.8) * 2,
        -seededRandom(i * 6.7) * roadLength,
      ],
      color: FLOWER_COLORS[i % FLOWER_COLORS.length],
      phase: seededRandom(i * 3.8) * Math.PI * 2,
    }))
  }, [roadLength])

  const fish = useMemo(() => {
    const colors = ['#ff8a65', '#ffd166', '#4ecdc4', '#6fb7ff', '#ef7bc5']
    return Array.from({ length: 10 }, (_, i) => ({
      start: seededRandom(i * 4.1) * roadLength,
      speed: 0.7 + seededRandom(i * 3.7) * 0.9,
      color: colors[i % colors.length],
    }))
  }, [roadLength])

  const boards = useMemo(() => {
    const boardData = [
      ['PROTECT NATURE', 'Every tree creates a better future.'],
      ['SAVE WATER', 'Every drop is part of our future.'],
      ['KEEP IT GREEN', 'Learn today. Protect tomorrow.'],
      ['REDUCE • REUSE • RECYCLE', 'Small actions create big change.'],
    ]
    return boardData.map(([title, subtitle], i) => {
      const t = 10 + i * 16
      const p = getPathPoint(t)
      const angle = getPathAngle(t)
      const side = i % 2 === 0 ? -1 : 1
      const perp = perpendicular(angle, side)
      return {
        title,
        subtitle,
        position: [p.x + perp[0] * 6.2, 0, p.z + perp[1] * 6.2],
        rotationY: angle + (side === 1 ? Math.PI / 2 : -Math.PI / 2),
      }
    })
  }, [])

  const schoolPosition = useMemo(() => {
    const p = getPathPoint(roadLength + 3)
    return [p.x, 0, p.z - 3]
  }, [roadLength])

  return (
    <>
      <hemisphereLight args={['#c9ecff', '#557b45', 1.05]} />
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[-10, 18, 8]}
        intensity={1.6}
        color="#fff4cf"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
      />
      <Sun />

      <Sparkles count={420} scale={[70, 12, roadLength]} size={0.32} speed={0.22} color="#fff3b0" opacity={0.25} />
      <Sparkles count={260} scale={[70, 8, roadLength]} size={0.18} speed={0.14} color="#d8ffd2" opacity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -roadLength / 2]} receiveShadow>
        <planeGeometry args={[100, roadLength + 50]} />
        <meshStandardMaterial color="#79b86b" roughness={1} />
      </mesh>

      {clouds.map((cloud, i) => <Cloud key={`cloud-${i}`} {...cloud} />)}
      {birds.map((bird, i) => <Bird key={`bird-${i}`} {...bird} />)}
      {mountains.map((m, i) => <Mountain key={`mountain-${i}`} {...m} />)}

      <River roadLength={roadLength} />
      {fish.map((item, i) => <Fish key={`fish-${i}`} roadLength={roadLength} {...item} />)}

      <LearningRoad roadLength={roadLength} />

      {trees.map((tree, i) => <AnimatedTree key={`tree-${i}`} {...tree} />)}
      {grass.map((item, i) => <GrassPatch key={`grass-${i}`} {...item} />)}
      {flowers.map((flower, i) => <Flower key={`flower-${i}`} {...flower} />)}
      {butterflies.map((b, i) => <Butterfly key={`butterfly-${i}`} {...b} />)}

      {boards.map((board, i) => <EnvironmentBoard key={`board-${i}`} {...board} />)}

      {modules.map((module, index) => {
        const location = modulePositions[index]
        return (
          <ModuleStone
            key={module.id || `module-${index}`}
            module={module}
            position={location.position}
            rotationY={location.rotationY}
            index={index}
            selected={selectedId === module.id}
            onClick={onSelect}
          />
        )
      })}

      {modules.length > 0 && (
        <StudentMarker travelRef={travelRef} gender={gender} name={studentName} />
      )}

      {modules.length > 0 && <FinishGate roadLength={roadLength} />}
      {modules.length > 0 && <School position={schoolPosition} />}

      <CameraAtmosphere />
      <ScrollTravel roadLength={roadLength} travelRef={travelRef} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableRotate
        rotateSpeed={0.42}
        dampingFactor={0.08}
        enableDamping
        maxPolarAngle={Math.PI / 2.25}
        minPolarAngle={0.35}
        target={[0, 1.3, 0]}
      />
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE DETAIL PANEL (Professional UI)
// ═════════════════════════════════════════════════════════════════════════════

function ModulePanel({ module, onClose, show }) {
  const [expandedTopic, setExpandedTopic] = useState(null)
  const [lang, setLang] = useState('en')
  const t = (key) => TRANSLATIONS[lang]?.[key] || key

  return (
    <AnimatePresence>
      {show && module && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="absolute right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] overflow-y-auto bg-gradient-to-b from-[#0f2a1e]/96 via-[#0c1f1a]/97 to-[#1a140c]/97 backdrop-blur-2xl border-l border-emerald-400/15 shadow-2xl"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">🪨</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/60 font-medium">
                    Learning Module
                  </span>
                </div>
                <h2 className="text-[1.65rem] font-bold text-white leading-tight tracking-tight">
                  {module.title}
                </h2>
                <p className="text-emerald-200/40 text-xs mt-1.5 font-medium">{t('details')}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Language Switcher */}
            <div className="mb-6">
              <p className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-2.5 font-medium">
                {t('language')}
              </p>
              <div className="grid grid-cols-3 gap-1 p-1 bg-black/25 rounded-xl">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'si', label: 'සිංහල' },
                  { code: 'ta', label: 'தமிழ்' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      lang === item.code
                        ? 'bg-emerald-400/18 text-emerald-200 border border-emerald-300/25 shadow-sm'
                        : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Progress Card */}
            <div className="rounded-2xl p-5 mb-6 bg-white/[0.04] border border-white/10 shadow-inner">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-white/55 text-xs font-medium">{t('overall')}</span>
                <span className="text-emerald-300 font-bold text-xl tracking-tight">
                  {Math.round(getProgress(module))}%
                </span>
              </div>
              <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgress(module)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-300"
                />
              </div>
              <div className="flex justify-between mt-2.5 text-[10px] text-white/35 font-medium">
                <span>
                  {module.completed || 0}/{module.total || 0} {t('done')}
                </span>
                <span>
                  {Math.round(getProgress(module))}% {t('complete')}
                </span>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2.5">
              {(module.topics || []).map((topic) => {
                const progress = Number(topic.progress || 0)
                const expanded = expandedTopic === topic.id

                return (
                  <div
                    key={topic.id}
                    className="rounded-2xl overflow-hidden bg-white/[0.035] border border-white/8 transition-colors hover:border-white/12"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTopic(expanded ? null : topic.id)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center text-base shrink-0">
                          {progress >= 100 ? '🌳' : progress > 0 ? '🌱' : '○'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{topic.title}</p>
                          <p className="text-white/35 text-xs mt-0.5">
                            {topic.avgScore > 0 ? `${t('avg')}: ${topic.avgScore}%` : t('notStarted')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                            progress >= 100
                              ? 'bg-emerald-400/15 text-emerald-300'
                              : progress > 0
                                ? 'bg-amber-400/15 text-amber-300'
                                : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {Math.round(progress)}%
                        </span>
                        <span className="text-white/25 text-xs">{expanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-white/8">
                            {(topic.assessments || []).map((assessment) => (
                              <div
                                key={assessment.id}
                                className="flex items-center justify-between gap-3 py-2.5"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-sm">{assessment.completed ? '✓' : '○'}</span>
                                  <span className="text-white/65 text-xs truncate">{assessment.title}</span>
                                </div>
                                {assessment.completed ? (
                                  <span className="text-emerald-300 text-xs font-bold">{assessment.score}%</span>
                                ) : (
                                  <span className="text-white/25 text-[10px] font-medium">{t('pending')}</span>
                                )}
                              </div>
                            ))}
                            {(topic.assessments || []).length === 0 && (
                              <p className="text-white/25 text-xs text-center py-3.5">{t('noAssessments')}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentRoadmap() {
  const [selectedModule, setSelectedModule] = useState(null)
  const [showPanel, setShowPanel] = useState(false)

  const { data: roadmap = [], isLoading } = useQuery({
    queryKey: ['studentRoadmap'],
    queryFn: () => api.get('/student/roadmap').then((res) => res.data),
  })

  const { data: student } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: () => api.get('/student/profile').then((res) => res.data),
    retry: false,
  })

  const gender = resolveGender(student)
  const studentFirstName = student?.name
    ? String(student.name).trim().split(' ')[0]
    : null

  const totalProgress = roadmap.length
    ? roadmap.reduce((sum, m) => sum + getProgress(m), 0) / roadmap.length
    : 0

  const completedModules = roadmap.filter((m) => getProgress(m) >= 80).length
  const startedModules = roadmap.filter((m) => getProgress(m) > 0).length

  useEffect(() => {
    if (roadmap.length > 0 && !selectedModule) {
      setSelectedModule(roadmap[0])
    }
  }, [roadmap, selectedModule])

  const handleModuleClick = (module) => {
    setSelectedModule(module)
    setShowPanel(true)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#79b86b]">
      {/* ═══════════════════════════════════════════════════════════════
    TOP UI  –  fixed to avoid notification icon overlap
═══════════════════════════════════════════════════════════════ */}

<div className="
  absolute
  top-0
  left-0
  right-0
  z-30
  px-4
  sm:px-6
  lg:px-8
  pt-5
  sm:pt-6
  pb-4
  pointer-events-none
">
  <div className="
    flex
    items-start
    justify-between
    gap-4
  ">

    {/* Title */}
    <div className="
      pointer-events-auto
      bg-black/25
      backdrop-blur-xl
      rounded-2xl
      px-5
      py-3.5
      border
      border-white/12
      shadow-lg
    ">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🌿</span>
        <span className="
          text-white
          font-bold
          text-lg
          sm:text-xl
          tracking-tight
          drop-shadow-md
        ">
          Student Learning Roadmap
        </span>
      </div>
      <p className="
        text-white/55
        text-[10px]
        sm:text-xs
        mt-1
        font-medium
        tracking-wide
      ">
        Learn • Grow • Explore • Achieve
      </p>
    </div>

    {/* Overall Progress – offset from right edge to clear notification icon */}
    <div className="
      pointer-events-auto
      bg-black/30
      backdrop-blur-xl
      rounded-2xl
      px-5
      py-3.5
      border
      border-white/12
      shadow-xl
      min-w-[130px]
      sm:min-w-[160px]
      mr-10
      sm:mr-12
      lg:mr-14
    ">
      <p className="
        text-white/45
        text-[9px]
        uppercase
        tracking-[0.16em]
        font-medium
      ">
        Overall Progress
      </p>

      <div className="flex items-end gap-1 mt-0.5">
        <span className="
          text-white
          font-bold
          text-2xl
          sm:text-3xl
          tracking-tight
        ">
          {Math.round(totalProgress)}
        </span>
        <span className="
          text-emerald-300
          font-semibold
          text-sm
          mb-1
        ">
          %
        </span>
      </div>

      <div className="
        h-1.5
        bg-white/10
        rounded-full
        overflow-hidden
        mt-2
      ">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-emerald-400
            to-lime-300
          "
        />
      </div>
    </div>
  </div>
</div>

      {/* Legend */}
      <div className="absolute bottom-5 left-5 z-30 hidden lg:block bg-black/30 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/12 shadow-xl">
        <p className="text-white/55 text-[10px] uppercase tracking-[0.16em] mb-3.5 font-medium">Roadmap Status</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#68a95b] shadow-[0_0_10px_#74e06c]" />
            <span className="text-white/70 text-xs font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#c59b52] shadow-[0_0_8px_#ffd166]" />
            <span className="text-white/70 text-xs font-medium">In Progress</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#8c918d]" />
            <span className="text-white/70 text-xs font-medium">Not Started</span>
          </div>
        </div>
        <div className="border-t border-white/10 mt-3.5 pt-3.5">
          <p className="text-white/35 text-[10px] font-medium">Scroll to travel</p>
          <p className="text-white/35 text-[10px] font-medium">Drag to explore</p>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute right-5 bottom-5 z-30 hidden md:flex gap-2.5">
        {[
          { value: completedModules, label: 'Completed', color: 'text-emerald-300' },
          { value: startedModules, label: 'Started', color: 'text-amber-300' },
          { value: roadmap.length, label: 'Modules', color: 'text-white' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="px-4 py-3.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/12 text-center shadow-lg min-w-[72px]"
          >
            <p className={`${stat.color} text-xl font-bold tracking-tight`}>{stat.value}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-wider mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Loading / Empty / Canvas */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 to-emerald-300">
          <div className="text-center bg-black/20 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-5"
            >
              🌿
            </motion.div>
            <p className="text-white font-bold text-lg tracking-tight">Preparing your journey...</p>
            <p className="text-white/55 text-sm mt-1.5">Building your learning environment</p>
          </div>
        </div>
      ) : roadmap.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 via-emerald-200 to-emerald-400">
          <div className="max-w-md mx-4 text-center bg-white/20 backdrop-blur-xl p-12 rounded-3xl border border-white/30 shadow-2xl">
            <div className="text-6xl mb-5">🌱</div>
            <h2 className="text-2xl font-bold text-emerald-950 tracking-tight">Your journey is waiting</h2>
            <p className="text-emerald-900/65 text-sm mt-3 leading-relaxed">
              Ask your administrator to enroll you in learning modules to begin your roadmap.
            </p>
          </div>
        </div>
      ) : (
        <Canvas
          shadows
          dpr={[1, 1.6]}
          camera={{ position: [0, 3.55, 7], fov: 56 }}
          className="w-full h-full"
          style={{
            background: 'linear-gradient(to bottom, #71c8ef 0%, #a8ddf2 38%, #d7f0d0 67%, #79b86b 100%)',
          }}
        >
          <Suspense fallback={null}>
            <Scene
              modules={roadmap}
              onSelect={handleModuleClick}
              selectedId={selectedModule?.id}
              gender={gender}
              studentName={studentFirstName}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Mobile instruction */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden pointer-events-none">
        <div className="px-4 py-2 rounded-full bg-black/35 backdrop-blur-md border border-white/12">
          <p className="text-white/70 text-[10px] whitespace-nowrap font-medium">
            Scroll to travel • Tap a stone to explore
          </p>
        </div>
      </div>

      {/* Module Panel */}
      <ModulePanel
        module={selectedModule}
        show={showPanel && !!selectedModule}
        onClose={() => setShowPanel(false)}
      />
    </div>
  )
}