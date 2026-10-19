import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  Easing,
  useCurrentFrame
} from "remotion";
import { Audio } from "@remotion/media";
import events from "./cursor-events.json";

export const FPS = 30;
export const DURATION = FPS * 36;
const INK = "#071c17",
  ACCENT = "#b8e7cd",
  WHITE = "#ecf5ec",
  MUTED = "#98b4a7";
const clip = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const lerp = (f: number, a: number, b: number) => clip((f - a) / (b - a));
interface CursorEvent {
  t: number;
  x: number;
  y: number;
  kind: string;
  name?: string;
}
const actions = events as CursorEvent[];
function position(t: number) {
  let prev: CursorEvent | undefined;
  let next: CursorEvent | undefined;
  for (const e of actions) {
    if (e.t <= t) prev = e;
    else {
      next = e;
      break;
    }
  }
  if (!prev && !next) return { x: 0, y: 0, visible: false };
  if (!prev) return { x: next.x, y: next.y, visible: false };
  if (!next) return { x: prev.x, y: prev.y, visible: t < 33.3 };
  const p = Easing.inOut(Easing.cubic)(clip((t - prev.t) / (next.t - prev.t)));
  return { x: mix(prev.x, next.x, p), y: mix(prev.y, next.y, p), visible: true };
}
const Pointer: React.FC = () => {
  const frame = useCurrentFrame(),
    t = frame / FPS,
    p = position(t);
  if (!p.visible) return null;
  const hits = actions.filter((e) => e.kind === "click" && t >= e.t && t < e.t + 0.65);
  const scale = 1716 / 1440;
  const x = 105 + p.x * scale,
    y = 237 + p.y * scale;
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 10, pointerEvents: "none" }}>
      {hits.map((hit) => {
        const stage = clip((t - hit.t) / 0.65);
        return (
          <div
            key={hit.t}
            style={{
              position: "absolute",
              left: -14,
              top: -14,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid #23644b",
              background: "rgba(135,228,174,.26)",
              opacity: 1 - stage,
              transform: "scale(" + mix(0.5, 3.3, stage) + ")"
            }}
          />
        );
      })}
      <svg
        width="40"
        height="48"
        viewBox="0 0 40 48"
        style={{ filter: "drop-shadow(1px 3px 4px rgba(0,0,0,.60))" }}
      >
        <path
          d="M3 2 V35 L12 26 L19 43 L26 39 L19 23 L33 21 Z"
          fill="#ffffff"
          stroke="#0a3028"
          strokeWidth="2.7"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
const Atmosphere: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 48% 60% at 88% 14%,rgba(58,120,92,.32),transparent),radial-gradient(ellipse 50% 75% at 5% 90%,rgba(25,70,57,.48),transparent)"
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.12,
          backgroundImage:
            "linear-gradient(rgba(198,237,210,.21) 1px,transparent 1px),linear-gradient(90deg,rgba(198,237,210,.21) 1px,transparent 1px)",
          backgroundSize: "100px 100px",
          backgroundPosition: "0 " + f * 0.16 + "px"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1300,
          top: -730,
          width: 1300,
          height: 1300,
          border: "1px solid rgba(166,218,181,.11)",
          borderRadius: "50%"
        }}
      />
    </AbsoluteFill>
  );
};
const Mac: React.FC = () => {
  const f = useCurrentFrame(),
    float = 1.0 * Math.sin(f / 44);
  const show = clip((f - 12) / 22);
  const zoom = mix(0.973, 1.0, Easing.out(Easing.cubic)(show));
  return (
    <div
      style={{
        position: "absolute",
        left: 84,
        top: 181,
        width: 1752,
        height: 690,
        transform: "translateY(" + float + "px) scale(" + zoom + ")",
        opacity: show,
        transformOrigin: "50% 50%",
        borderRadius: 21,
        overflow: "hidden",
        background: "#edf3eb",
        border: "1px solid rgba(233,255,239,.54)",
        boxShadow: "0 35px 100px rgba(0,0,0,.43), 0 0 0 7px rgba(169,217,183,.03)"
      }}
    >
      <div
        style={{
          height: 54,
          position: "relative",
          background: "#d7dbd6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #c7cec8",
          color: "#435750",
          fontSize: 20,
          fontWeight: 630
        }}
      >
        <div style={{ position: "absolute", left: 25, display: "flex", gap: 12 }}>
          {["#ff6258", "#ffbd2e", "#28c940"].map((c) => (
            <span
              key={c}
              style={{
                height: 18,
                width: 18,
                borderRadius: "50%",
                background: c,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,.17)"
              }}
            />
          ))}
        </div>
        Caffeinate
      </div>
      <div
        style={{
          position: "absolute",
          top: 54,
          left: 0,
          width: 1752,
          height: 630,
          overflow: "hidden",
          background: "#f5f7f1"
        }}
      >
        <Sequence from={0} durationInFrames={1034}>
          <OffthreadVideo
            src={staticFile("footage/live-ui.webm")}
            style={{ position: "absolute", width: 1752, height: 1095, top: 0, left: 0 }}
            muted
          />
        </Sequence>
      </div>
    </div>
  );
};
const Terminal: React.FC = () => {
  const f = useCurrentFrame();
  const command = "/usr/bin/caffeinate -i -d -t 1800";
  const n = Math.round(mix(0, command.length, lerp(f, 98, 171)));
  const awake = f > 245 && f < 1010;
  const fill = interpolate(f, [0, 220, 600, 1040], [0, 36, 72, 100], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 895,
        left: 84,
        right: 84,
        height: 104,
        display: "flex",
        gap: 20,
        alignItems: "center",
        border: "1px solid rgba(174,221,192,.19)",
        background: "rgba(6,26,20,.86)",
        borderRadius: 17,
        padding: "0 30px",
        boxShadow: "0 8px 32px rgba(0,0,0,.18)"
      }}
    >
      <div
        style={{
          fontFamily: "Menlo,ui-monospace,monospace",
          fontSize: 19,
          whiteSpace: "nowrap",
          color: WHITE,
          flex: 1
        }}
      >
        <span style={{ color: "#8cbea7" }}>$ </span>
        {command.slice(0, n)}
        <span style={{ opacity: 0.4 }}>▌</span>
      </div>
      <div
        style={{
          fontSize: 17,
          letterSpacing: 2,
          color: awake ? ACCENT : MUTED,
          fontWeight: 650,
          whiteSpace: "nowrap"
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: awake ? "#83d8a4" : "#6c9281",
            marginRight: 12
          }}
        />
        {awake ? "AWAKE" : "LOCAL • NO CLOUD"}
      </div>
      <div style={{ width: 195, height: 3, background: "rgba(166,214,182,.17)", borderRadius: 20 }}>
        <div style={{ background: ACCENT, width: fill + "%", height: "100%", borderRadius: 20 }} />
      </div>
    </div>
  );
};
const Header: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 86,
        right: 87,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 19, color: WHITE }}>
        <div
          style={{
            height: 36,
            width: 36,
            borderRadius: 10,
            background: "#28765c",
            display: "grid",
            placeItems: "center"
          }}
        >
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <path
              d="M15 39H49M15 28H49M32 13V28"
              stroke="#eff9ef"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span style={{ fontSize: 22, letterSpacing: 1.1, fontWeight: 730 }}>CAFFEINATE</span>
        <span style={{ fontSize: 18, color: MUTED, marginLeft: 17 }}>Awake when it matters.</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 17,
          letterSpacing: 2,
          color: MUTED
        }}
      >
        <span>ACTUAL SVELTE UI · LIVE INTERACTIONS</span>
        <span style={{ color: ACCENT, fontVariantNumeric: "tabular-nums" }}>
          {String(Math.floor(f / FPS)).padStart(2, "0")} / 36
        </span>
      </div>
    </div>
  );
};
const Headline: React.FC = () => {
  const f = useCurrentFrame();
  const sub =
    f < 214
      ? "Choose what stays awake."
      : f < 465
        ? "And for how long."
        : f < 730
          ? "Keep your workflow running."
          : "Always in control.";
  const enter = lerp(f, 0, 30);
  return (
    <div
      style={{
        position: "absolute",
        left: 86,
        top: 103,
        right: 86,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: enter
      }}
    >
      <div
        style={{ fontSize: 55, fontWeight: 780, letterSpacing: -2.2, color: WHITE, lineHeight: 1 }}
      >
        Your Mac. <span style={{ color: ACCENT }}>Still awake.</span>
      </div>
      <div style={{ fontSize: 22, color: MUTED, letterSpacing: 0.1 }}>{sub}</div>
    </div>
  );
};
const End: React.FC = () => {
  const f = useCurrentFrame();
  const o = lerp(f, 996, 1035);
  const y = 20 * (1 - Easing.out(Easing.cubic)(o));
  return (
    <AbsoluteFill
      style={{
        background: "#091f1a",
        opacity: o,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div style={{ textAlign: "center", transform: "translateY(" + y + "px)" }}>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 7,
            color: ACCENT,
            fontWeight: 650,
            marginBottom: 29
          }}
        >
          CAFFEINATE
        </div>
        <div style={{ fontSize: 95, fontWeight: 760, letterSpacing: -5, color: WHITE }}>
          Awake when it matters.
        </div>
        <div style={{ height: 2, width: 210, background: ACCENT, margin: "39px auto" }} />
        <div style={{ fontSize: 25, color: MUTED }}>Free · Open source · Built for macOS</div>
        <div style={{ fontSize: 21, color: ACCENT, marginTop: 48, letterSpacing: 1.2 }}>
          github.com/AungMyoKyaw/caffeinate-app
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const CaffeinateProduct: React.FC = () => {
  const f = useCurrentFrame();
  const volume = interpolate(f, [0, 18, DURATION - 55, DURATION - 1], [0, 0.85, 0.85, 0], {
    extrapolateRight: "clamp"
  });
  return (
    <AbsoluteFill style={{ fontFamily: "-apple-system,BlinkMacSystemFont,Arial,sans-serif" }}>
      <Atmosphere />
      <Header />
      <Headline />
      <Mac />
      <Pointer />
      <Terminal />
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 87,
          right: 87,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          letterSpacing: 2.3,
          color: MUTED
        }}
      >
        <span>MACOS • LOCAL-FIRST • NO TELEMETRY</span>
        <span>PRODUCT FILM / 2026</span>
      </div>
      <End />
      <Audio src={staticFile("audio/caffeinate-chorus.mp3")} volume={volume} />
    </AbsoluteFill>
  );
};
