import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Monitor, Shield } from "lucide-react";
import { motion } from "motion/react";
import { getLeagueConfig } from "./SettingsPage";

export default function LandingPage() {
  const navigate = useNavigate();
  const leagueConfig = getLeagueConfig();
  const shortName = leagueConfig.shortName || "SPL";
  const fullName = leagueConfig.fullName || "Siddhivinayak Premier League";
  const logoUrl =
    leagueConfig.logoUrl || "/assets/generated/spl-logo.dim_400x400.png";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden broadcast-overlay flex flex-col items-center justify-center">
      {/* Background: radial glow layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.14 0.06 265 / 0.9) 0%, transparent 70%)",
        }}
      />
      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.78 0.165 85 / 0.2) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.78 0.165 85 / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Diagonal accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.165 85 / 0.03) 0%, transparent 50%, oklch(0.78 0.165 85 / 0.05) 100%)",
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl"
      >
        {/* Logo — 2x size, free-form (no circle clip on img) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div
            className="w-64 h-64 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, oklch(0.18 0.06 265) 0%, oklch(0.1 0.03 265) 100%)",
              border: "2px solid oklch(0.78 0.165 85 / 0.6)",
              boxShadow:
                "0 0 60px oklch(0.78 0.165 85 / 0.35), 0 0 120px oklch(0.78 0.165 85 / 0.12)",
            }}
          >
            <img
              src={logoUrl}
              alt={`${shortName} Logo`}
              className="w-56 h-56 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/generated/spl-logo.dim_400x400.png";
              }}
            />
          </div>
        </motion.div>

        {/* Event badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <span
            className="inline-block px-4 py-1 text-xs font-broadcast tracking-widest"
            style={{
              background: "oklch(0.78 0.165 85 / 0.15)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.85 0.18 88)",
            }}
          >
            LIVE AUCTION EVENT
          </span>
        </motion.div>

        {/* Main title — dynamic */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-broadcast text-5xl md:text-7xl lg:text-8xl leading-none mb-2"
          style={{ color: "oklch(0.78 0.165 85)" }}
        >
          {shortName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="w-full h-px mb-4"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.165 85), transparent)",
          }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="font-broadcast text-lg md:text-2xl tracking-widest mb-2"
          style={{ color: "oklch(0.75 0.04 90)" }}
        >
          {fullName.toUpperCase()}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-base md:text-lg mb-12"
          style={{ color: "oklch(0.55 0.02 90)" }}
        >
          Player Auction — Season 2025
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/live" })}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-base font-broadcast tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.165 85), oklch(0.65 0.14 75))",
              color: "oklch(0.08 0.025 265)",
              boxShadow: "0 0 30px oklch(0.78 0.165 85 / 0.4)",
            }}
          >
            <Monitor size={20} />
            LIVE SCREEN
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: "/admin" })}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-base font-broadcast tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "oklch(0.12 0.035 265 / 0.8)",
              border: "1px solid oklch(0.78 0.165 85 / 0.4)",
              color: "oklch(0.78 0.165 85)",
              boxShadow: "0 0 20px oklch(0.78 0.165 85 / 0.1)",
            }}
          >
            <Shield size={20} />
            ADMIN PANEL
            <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { value: "10", label: "TEAMS" },
            { value: "90", label: "PLAYERS" },
            { value: "20,000", label: "PURSE PTS" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="font-digital text-2xl md:text-3xl font-bold"
                style={{ color: "oklch(0.78 0.165 85)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs font-broadcast tracking-widest mt-1"
                style={{ color: "oklch(0.45 0.02 90)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-0 right-0 text-center text-xs"
        style={{ color: "oklch(0.35 0.02 90)" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.6 0.12 82)" }}
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
