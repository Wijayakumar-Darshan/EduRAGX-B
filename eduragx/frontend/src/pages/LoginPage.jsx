import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

/*
|--------------------------------------------------------------------------
| EduRAGX — Professional Nature Login
|--------------------------------------------------------------------------
| Pure CSS + SVG + Framer Motion. No external images.
| Login panel size increased for better presence.
|--------------------------------------------------------------------------
*/

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);

      const routes = {
        ADMIN: '/admin',
        TEACHER: '/teacher',
        STUDENT: '/student',
        PARENT: '/parent',
      };

      navigate(routes[user.role] || '/');
      toast.success(`Welcome back, ${user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const birds = Array.from({ length: 5 });
  const clouds = Array.from({ length: 4 });
  const leaves = Array.from({ length: 14 });
  const flowers = Array.from({ length: 12 });
  const fireflies = Array.from({ length: 14 });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#7eb8a8]">
      {/* ============================================================
          SKY & ENVIRONMENT
      ============================================================ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#6eb8d4] via-[#a8d4c4] to-[#c8dba0]" />

        {/* Subtle atmospheric haze */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10" />

        {/* ============================================================
            SUN
        ============================================================ */}
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.85, 0.95, 0.85],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[5%] top-[7%] z-[2]"
        >
          <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 via-yellow-200 to-orange-200 shadow-[0_0_80px_40px_rgba(255,220,140,0.35)]">
            <div className="absolute inset-3 rounded-full bg-yellow-100/50 blur-md" />
          </div>
        </motion.div>

        {/* Soft sun rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute left-[-4%] top-[-2%] z-[1] h-72 w-72 rounded-full border-[40px] border-yellow-100/15"
        />

        {/* ============================================================
            CLOUDS
        ============================================================ */}
        {clouds.map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: '-25vw' }}
            animate={{ x: '115vw' }}
            transition={{
              duration: 48 + i * 14,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 9,
            }}
            className="absolute z-[4]"
            style={{
              top: `${7 + i * 9}%`,
              opacity: 0.5 - i * 0.06,
            }}
          >
            <div className="relative h-14 w-52">
              <div className="absolute bottom-0 left-4 h-9 w-32 rounded-full bg-white/75 blur-[0.5px]" />
              <div className="absolute bottom-3 left-12 h-12 w-14 rounded-full bg-white/80" />
              <div className="absolute bottom-2 left-24 h-10 w-12 rounded-full bg-white/70" />
              <div className="absolute bottom-0 left-0 h-7 w-20 rounded-full bg-white/65" />
            </div>
          </motion.div>
        ))}

        {/* ============================================================
            DISTANT MOUNTAINS
        ============================================================ */}
        <svg
          className="absolute bottom-[34%] left-0 z-[5] h-[42%] w-full"
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="mountainBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8aa39c" />
              <stop offset="100%" stopColor="#5f8570" />
            </linearGradient>
            <linearGradient id="mountainFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b9272" />
              <stop offset="100%" stopColor="#3a6a4a" />
            </linearGradient>
          </defs>

          <motion.path
            animate={{
              d: [
                'M0 400 L170 230 L310 330 L490 160 L670 330 L850 190 L1040 340 L1230 220 L1440 350 L1440 500 L0 500 Z',
                'M0 400 L170 220 L310 330 L490 150 L670 330 L850 180 L1040 340 L1230 210 L1440 350 L1440 500 L0 500 Z',
              ],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            fill="url(#mountainBack)"
            opacity="0.7"
          />

          <path
            d="M0 500 L0 370 L180 300 L300 350 L520 150 L700 330 L850 250 L1020 40 L1200 280 L1320 220 L1440 340 L1440 500 Z"
            fill="url(#mountainFront)"
          />

          <path
            d="M1020 40 L950 150 L1020 125 L1090 190 L1200 280 L1130 145 Z"
            fill="#b0c9a4"
            opacity="0.55"
          />
          <path
            d="M520 150 L450 260 L520 235 L590 290 L650 330 L600 215 Z"
            fill="#9cbf96"
            opacity="0.4"
          />

          <g opacity="0.25" fill="#1f3f30">
            {Array.from({ length: 40 }).map((_, i) => (
              <circle
                key={i}
                cx={(i * 97) % 1440}
                cy={250 + ((i * 43) % 180)}
                r={10 + (i % 5) * 2.5}
              />
            ))}
          </g>
        </svg>

        {/* Mountain mist */}
        <motion.div
          animate={{ x: ['-8%', '10%', '-8%'], opacity: [0.18, 0.4, 0.18] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[22%] top-[30%] z-[7] h-16 w-[50%] rounded-full bg-white/35 blur-3xl"
        />
        <motion.div
          animate={{ x: ['8%', '-6%', '8%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[45%] top-[37%] z-[7] h-20 w-[35%] rounded-full bg-white/20 blur-3xl"
        />

        {/* Distant palms */}
        <div className="absolute bottom-[31%] left-0 right-0 z-[8]">
          {[
            ['7%', 72],
            ['16%', 95],
            ['25%', 65],
            ['35%', 82],
            ['69%', 78],
            ['77%', 100],
            ['86%', 68],
            ['93%', 88],
          ].map(([left, height], i) => (
            <motion.div
              key={i}
              animate={{ rotate: [-1.2, 1.2, -1.2] }}
              transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0"
              style={{ left }}
            >
              <div
                className="relative w-[5px] rounded-full bg-[#2a4f35]"
                style={{ height }}
              >
                <div className="absolute -top-2 left-1/2 h-14 w-14 -translate-x-1/2">
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#2a5a38]" />
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-14 -translate-x-1/2 rotate-45 rounded-full bg-[#2a5a38]" />
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-14 -translate-x-1/2 -rotate-45 rounded-full bg-[#2a5a38]" />
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-14 -translate-x-1/2 rotate-90 rounded-full bg-[#2a5a38]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ============================================================
            VILLAGE + SCHOOL
        ============================================================ */}
        <div className="absolute bottom-[22%] left-0 right-0 z-[15]">
          <VillageHouse left="17%" width="140px" height="88px" delay={0} />
          <VillageHouse left="30%" width="112px" height="70px" delay={0.4} />
          <VillageHouse left="39%" width="125px" height="80px" delay={0.8} />
          <VillageHouse left="67%" width="120px" height="75px" delay={0.6} />

          {/* School */}
          <motion.div
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-[55%] h-[122px] w-[200px] -translate-x-1/2"
          >
            <div className="absolute bottom-0 left-0 right-0 h-[86px] rounded-sm border border-[#a89a72]/60 bg-[#e4dcc0] shadow-lg">
              <div className="absolute bottom-0 left-1/2 h-12 w-7 -translate-x-1/2 rounded-t-sm bg-[#5e4630]" />
              <div className="absolute bottom-7 left-4 h-9 w-8 border-[3px] border-[#6f6650] bg-[#9cc4c9]" />
              <div className="absolute bottom-7 right-4 h-9 w-8 border-[3px] border-[#6f6650] bg-[#9cc4c9]" />
              <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded border border-[#7f7258]/70 bg-[#f0e8d0] px-4 py-0.5 shadow-sm">
                <span className="text-[12px] font-bold tracking-wider text-[#2f4035]">
                  SCHOOL
                </span>
              </div>
            </div>
            <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[110px] border-r-[110px] border-b-[52px] border-l-transparent border-r-transparent border-b-[#734f3a]" />
            <div className="absolute left-1/2 top-[11px] h-0 w-0 -translate-x-1/2 border-l-[96px] border-r-[96px] border-b-[44px] border-l-transparent border-r-transparent border-b-[#8d6244]" />
            <div className="absolute -top-[68px] left-1/2 h-[68px] w-[2px] bg-[#5c5648]" />
            <motion.div
              animate={{ skewY: [-3, 3, -3] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-[68px] left-1/2 h-6 w-7 origin-left bg-gradient-to-r from-[#c93f35] via-[#d9b345] to-[#358a4e]"
            />
          </motion.div>
        </div>

        {/* ============================================================
            GROUND
        ============================================================ */}
        <div className="absolute bottom-0 left-0 right-0 z-[20] h-[27%] bg-gradient-to-t from-[#2f5331] via-[#457a42] to-[#6b9a52]" />

        {/* Grass blades */}
        <div className="absolute bottom-0 left-0 right-0 z-[21] h-[24%] overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: i % 2 === 0 ? [-4, 4, -4] : [4, -4, 4] }}
              transition={{
                duration: 2.2 + (i % 4) * 0.35,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-0 w-[1.5px] origin-bottom bg-[#2a4f2c]"
              style={{
                left: `${(i * 19) % 100}%`,
                height: `${18 + (i % 6) * 7}px`,
              }}
            />
          ))}
        </div>

        {/* Road */}
        <div className="absolute bottom-0 left-1/2 z-[25] h-[38%] w-[55%] -translate-x-1/2">
          <div
            className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2"
            style={{
              clipPath: 'polygon(44% 0%, 56% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(to bottom, #c2a06c 0%, #b08955 50%, #8a6840 100%)',
            }}
          />
          <motion.div
            animate={{ opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-0 left-1/2 h-full w-[18%] -translate-x-1/2 bg-amber-100/15 blur-xl"
            style={{ clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)' }}
          />
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#6e5638]/40"
              style={{
                left: `${16 + ((i * 31) % 68)}%`,
                bottom: `${6 + ((i * 19) % 82)}%`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 2)}px`,
              }}
            />
          ))}
        </div>

        {/* Foreground rock wall */}
        <div className="absolute bottom-[6%] right-0 z-[30] flex w-[25%] flex-wrap gap-1 opacity-90">
          {Array.from({ length: 48 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, i % 2 === 0 ? -1 : 1, 0] }}
              transition={{ duration: 4.5 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-md bg-gradient-to-br from-[#7a6f55] to-[#4a4436] shadow-sm"
              style={{
                width: `${16 + (i % 4) * 6}px`,
                height: `${12 + (i % 3) * 4}px`,
              }}
            />
          ))}
        </div>

        {/* Large foreground trees */}
        <ForegroundTree side="left" />
        <ForegroundTree side="right" />

        {/* Walking students */}
        <WalkingStudent left="28%" delay={0} flip={false} />
        <WalkingStudent left="38%" delay={1.1} flip={true} />

        {/* Birds */}
        {birds.map((_, i) => (
          <motion.div
            key={`bird-${i}`}
            initial={{ x: '-8vw' }}
            animate={{
              x: '108vw',
              y: [0, -12, 6, -10, 0],
            }}
            transition={{
              duration: 22 + i * 6,
              repeat: Infinity,
              delay: i * 4.5,
              ease: 'linear',
            }}
            className="absolute z-[32]"
            style={{ top: `${11 + i * 5.5}%` }}
          >
            <svg width={28 - i * 2.5} height={18 - i * 0.8} viewBox="0 0 40 25">
              <motion.path
                animate={{
                  d: [
                    'M2 12 Q10 3 20 12 Q30 3 38 12',
                    'M2 14 Q10 7 20 14 Q30 7 38 14',
                    'M2 12 Q10 3 20 12 Q30 3 38 12',
                  ],
                }}
                transition={{ duration: 0.65, repeat: Infinity }}
                fill="none"
                stroke="#1f2e26"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        ))}

        {/* Floating leaves */}
        {leaves.map((_, i) => (
          <motion.div
            key={`leaf-${i}`}
            initial={{
              x: `${(i * 17) % 100}vw`,
              y: '-8vh',
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              x: [
                `${(i * 17) % 100}vw`,
                `${((i * 23) + 30) % 100}vw`,
                `${((i * 31) + 60) % 100}vw`,
              ],
              y: '108vh',
              rotate: 340 + i * 80,
              opacity: [0, 0.75, 0.5, 0],
            }}
            transition={{
              duration: 13 + (i % 6),
              repeat: Infinity,
              delay: i * 0.9,
              ease: 'linear',
            }}
            className="absolute z-[45] text-base"
          >
            🍃
          </motion.div>
        ))}

        {/* Flowers */}
        {flowers.map((_, i) => (
          <motion.div
            key={`flower-${i}`}
            animate={{ y: [0, -2.5, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{
              duration: 2.8 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.12,
            }}
            className="absolute z-[35] text-lg"
            style={{
              left: `${5 + ((i * 14) % 90)}%`,
              bottom: `${7 + (i % 3) * 2}%`,
            }}
          >
            {['🌸', '🌼', '🌺', '🌷'][i % 4]}
          </motion.div>
        ))}

        {/* Fireflies / dust motes */}
        {fireflies.map((_, i) => (
          <motion.div
            key={`firefly-${i}`}
            animate={{
              x: [0, 20, -12, 0],
              y: [0, -16, 8, 0],
              opacity: [0.15, 0.9, 0.25, 0.15],
              scale: [0.75, 1.2, 0.85, 0.75],
            }}
            transition={{
              duration: 4.5 + (i % 4),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
            className="absolute z-[40] h-1.5 w-1.5 rounded-full bg-yellow-100 shadow-[0_0_12px_4px_rgba(255,230,140,0.4)]"
            style={{
              left: `${9 + ((i * 18) % 82)}%`,
              top: `${34 + ((i * 21) % 48)}%`,
            }}
          />
        ))}
      </div>

      {/* ==============================================================
          LOGIN PANEL — Larger professional glass card
      ============================================================== */}
      <div className="relative z-[100] flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:justify-end lg:px-[7%]">
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 text-center"
          >
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/15 shadow-xl backdrop-blur-xl"
            >
              <span className="text-3xl">🌿</span>
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              EduRAGX
            </h1>
            <p className="mt-1 text-[11px] font-medium tracking-[0.18em] text-white/90">
              LEARN • GROW • DISCOVER
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 p-7 shadow-[0_25px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            {/* Subtle light sweep */}
            <motion.div
              animate={{ x: ['-130%', '140%'] }}
              transition={{ duration: 7, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-[30%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="relative">
              <h2 className="text-xl font-semibold text-slate-800">
                Welcome back
              </h2>
              <p className="mb-6 mt-1 text-sm text-slate-500">
                Sign in to continue your learning journey.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                      🔒
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-11 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-emerald-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <motion.span
                    animate={{ x: ['-160%', '160%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5 }}
                    className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/20"
                  />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          className="inline-block"
                        >
                          ⏳
                        </motion.span>
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              <div className="mt-6 border-t border-slate-200/80 pt-4 text-center">
                <p className="text-xs font-medium text-slate-500">
                  🌱 Your learning journey starts here
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Learn naturally · Grow continuously · Build your future
                </p>
              </div>
            </div>
          </motion.div>

          <p className="mt-5 text-center text-[11px] font-medium text-white/75 drop-shadow-sm">
            © EduRAGX · Explainable Learning Intelligence
          </p>
        </motion.div>
      </div>

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 z-[150] shadow-[inset_0_0_160px_rgba(0,0,0,0.22)]" />
    </div>
  );
}

/* =========================================================================
   VILLAGE HOUSE
============================================================================= */
function VillageHouse({ left, width, height, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -1, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, delay, ease: 'easeInOut' }}
      className="absolute bottom-0"
      style={{ left, width, height }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-[68%] rounded-sm bg-[#d4ccb0] shadow-md">
        <div className="absolute bottom-0 left-1/2 h-[42%] w-[16%] -translate-x-1/2 rounded-t-sm bg-[#654a35]" />
        <div className="absolute bottom-[32%] left-[14%] h-[22%] w-[18%] border-2 border-[#5f5644] bg-[#9bbfc4]" />
        <div className="absolute bottom-[32%] right-[14%] h-[22%] w-[18%] border-2 border-[#5f5644] bg-[#9bbfc4]" />
      </div>
      <div
        className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[50px] border-r-[50px] border-b-[38px] border-l-transparent border-r-transparent border-b-[#6e4e38]"
      />
    </motion.div>
  );
}

/* =========================================================================
   FOREGROUND TREE
============================================================================= */
function ForegroundTree({ side }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      animate={{ rotate: [-0.6, 0.6, -0.6] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute bottom-[14%] z-[50] ${isLeft ? 'left-[-45px]' : 'right-[-45px]'}`}
    >
      <div className="relative h-[460px] w-[68px] rounded-[45%] bg-gradient-to-r from-[#362c23] via-[#5e4a36] to-[#2a241c]">
        <div className="absolute left-1/2 top-8 h-20 w-4 -translate-x-1/2 rotate-[32deg] rounded-full bg-[#3f3226]" />
        <div className="absolute left-1/2 top-14 h-20 w-4 -translate-x-1/2 -rotate-[36deg] rounded-full bg-[#3f3226]" />

        <div className="absolute -left-24 -top-24 h-44 w-44 rounded-full bg-[#1e432a] shadow-xl" />
        <div className="absolute -left-2 -top-32 h-52 w-52 rounded-full bg-[#2a5230] shadow-lg" />
        <div className="absolute left-20 -top-20 h-44 w-44 rounded-full bg-[#1f4329] shadow-xl" />
        <div className="absolute -left-12 top-[-12px] h-36 w-36 rounded-full bg-[#355f38]" />

        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -left-6 -top-20 h-28 w-28 rounded-full bg-[#6e9a4a]/35 blur-2xl"
        />
      </div>
    </motion.div>
  );
}

/* =========================================================================
   WALKING STUDENT
============================================================================= */
function WalkingStudent({ left, delay, flip }) {
  return (
    <motion.div
      animate={{ y: [0, -3.5, 0] }}
      transition={{ duration: 1.25, repeat: Infinity, delay, ease: 'easeInOut' }}
      className="absolute bottom-[23%] z-[70]"
      style={{ left, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <div className="relative h-[168px] w-[70px]">
        {/* Backpack */}
        <motion.div
          animate={{ rotate: [-2.5, 2.5, -2.5] }}
          transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[4px] top-[48px] h-[66px] w-[48px] rounded-[14px] bg-gradient-to-br from-[#1f3344] to-[#0d1620] shadow-lg"
        >
          <div className="absolute left-1/2 top-1.5 h-2.5 w-6 -translate-x-1/2 rounded-full border-2 border-[#4a6270]" />
        </motion.div>

        {/* Head */}
        <div className="absolute left-[19px] top-0 h-[42px] w-[39px] rounded-full bg-[#a86d46] shadow-sm">
          <div className="absolute left-0 top-0 h-3.5 w-full rounded-t-full bg-[#1c1714]" />
        </div>

        {/* Shirt */}
        <div className="absolute left-[14px] top-[39px] h-[54px] w-[46px] rounded-t-[10px] bg-[#ebeae2] shadow-sm">
          <div className="absolute left-1/2 top-0 h-4 w-7 -translate-x-1/2 border-l-[9px] border-r-[9px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#c9c6b8]" />
        </div>

        {/* Shorts */}
        <div className="absolute left-[16px] top-[88px] h-[44px] w-[43px] bg-[#1e3346]" />

        {/* Legs */}
        <motion.div
          animate={{ rotate: [-7, 7, -7] }}
          transition={{ duration: 1.25, repeat: Infinity, delay: delay + 0.08 }}
          className="absolute left-[19px] top-[125px] h-[35px] w-[11px] origin-top rounded-b-md bg-[#a86d46]"
        />
        <motion.div
          animate={{ rotate: [7, -7, 7] }}
          transition={{ duration: 1.25, repeat: Infinity, delay: delay + 0.08 }}
          className="absolute left-[42px] top-[125px] h-[35px] w-[11px] origin-top rounded-b-md bg-[#a86d46]"
        />

        {/* Shoes */}
        <motion.div
          animate={{ x: [-2.5, 2.5, -2.5] }}
          transition={{ duration: 1.25, repeat: Infinity }}
          className="absolute bottom-0 left-[12px] h-3.5 w-6 rounded-full bg-[#1a1e22]"
        />
        <motion.div
          animate={{ x: [2.5, -2.5, 2.5] }}
          transition={{ duration: 1.25, repeat: Infinity }}
          className="absolute bottom-0 left-[40px] h-3.5 w-6 rounded-full bg-[#1a1e22]"
        />
      </div>
    </motion.div>
  );
}