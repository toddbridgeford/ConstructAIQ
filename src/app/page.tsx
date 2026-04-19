"use client";
import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
LOGO — GitHub raw URL (also works once copied to /public/)
───────────────────────────────────────────────────────── */
const LOGO = "https://raw.githubusercontent.com/toddbridgeford/ConstructAIQ/Predictive-Model/ConstructAIQWhiteLogo.svg";

const blue       = "#0A84FF";
const blueHover  = "#409CFF";
const blueDim    = "rgba(10,132,255,0.12)";
const blueBorder = "rgba(10,132,255,0.25)";
const green      = "#30D158";
const red        = "#FF453A";
const amber      = "#FF9F0A";

const TICKS = [
["TTLCONS  $2,190B", "+0.42%", true],
["HOUST  1,487K",    "+7.22%", true],
["PERMIT  1,386K",   "−0.87%", false],
["EMPLOY  8,330K",   "+0.31%", true],
["LUMBER  $512",     "+3.2%",  true],
["STEEL HR  $748",   "−1.4%",  false],
["COPPER  $4.82",    "+0.8%",  true],
["IIJA  $890B",      "ACTIVE", null],
["10YR  4.32%",      "−2bp",   false],
["AGC BCI  58.4",    "+2.1",   true],
];

/* ══════════════════════════════════════════════════════════
GLOBAL STYLES — Apple HIG compliant responsive CSS
══════════════════════════════════════════════════════════ */
function GlobalStyles() {
return (
<style dangerouslySetInnerHTML={{__html: `
@font-face {
font-family: 'Aeonik Pro';
src: url('https://db.onlinewebfonts.com/t/12ff62164c9778917bddb93c6379cf47.woff2') format('woff2');
font-weight: 400; font-display: swap;
}
@font-face {
font-family: 'Aeonik Pro';
src: url('https://db.onlinewebfonts.com/t/81c9cfcec66a1bb46e90e184f4d04641.woff2') format('woff2');
font-weight: 500; font-display: swap;
}
@font-face {
font-family: 'Aeonik Pro';
src: url('https://db.onlinewebfonts.com/t/362636484f8ad521fec5a297fdc0ab12.woff2') format('woff2');
font-weight: 700; font-display: swap;
}
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

```
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  body { background: #060608; color: #fff; }
  a { text-decoration: none; color: inherit; }
  img { display: block; }
  button { cursor: pointer; font-family: inherit; border: none; background: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

  .fa {
    font-family: 'Aeonik Pro','Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
  }
  .fm {
    font-family: 'SF Mono','Fira Code','JetBrains Mono',monospace;
  }

  @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .d1 { opacity: 0; animation: fadeUp 0.7s ease 0.00s forwards; }
  .d2 { opacity: 0; animation: fadeUp 0.7s ease 0.12s forwards; }
  .d3 { opacity: 0; animation: fadeUp 0.7s ease 0.22s forwards; }
  .d4 { opacity: 0; animation: fadeUp 0.7s ease 0.32s forwards; }
  .d5 { opacity: 0; animation: fadeUp 0.7s ease 0.42s forwards; }

  /* Layout */
  .wrap { max-width: 1100px; margin: 0 auto; padding: 0 48px; }
  @media (max-width: 900px)  { .wrap { padding: 0 28px; } }
  @media (max-width: 480px)  { .wrap { padding: 0 20px; } }

  /* Ticker */
  .ticker { background: #0F0F13; border-bottom: 1px solid rgba(255,255,255,0.07); height: 36px; overflow: hidden; position: relative; }
  .ticker-track { display: flex; gap: 56px; align-items: center; animation: tickerScroll 100s linear infinite; white-space: nowrap; padding-left: 56px; height: 100%; }
  .ticker-item { display: inline-flex; align-items: center; gap: 8px; font-size: 10.5px; letter-spacing: 0.04em; }
  .ticker-edge-l { position: absolute; left: 0; top: 0; width: 80px; height: 100%; background: linear-gradient(to right, #0F0F13, transparent); z-index: 2; pointer-events: none; }
  .ticker-edge-r { position: absolute; right: 0; top: 0; width: 80px; height: 100%; background: linear-gradient(to left, #0F0F13, transparent); z-index: 2; pointer-events: none; }

  /* Nav */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    height: 64px; display: flex; align-items: center; padding: 0 48px;
    transition: background 0.35s, backdrop-filter 0.35s, border-color 0.35s;
  }
  .nav.on {
    background: rgba(6,6,8,0.90);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .nav-logo-img { height: 28px; width: auto; }
  .nav-center { display: flex; align-items: center; gap: 2px; flex: 1; margin-left: 36px; }
  .nav-a {
    font-size: 14px; font-weight: 500; letter-spacing: -0.01em;
    color: rgba(255,255,255,0.48); padding: 10px 14px; border-radius: 8px;
    min-height: 44px; display: inline-flex; align-items: center;
    transition: color 0.15s, background 0.15s;
  }
  .nav-a:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav-right { display: flex; align-items: center; gap: 8px; }

  /* Apple HIG Button System */
  /* Primary — Filled */
  .btn-f {
    display: inline-flex; align-items: center; justify-content: center;
    height: 44px; padding: 0 24px; border-radius: 12px; gap: 6px;
    background: #0A84FF; color: #fff;
    font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
    box-shadow: 0 4px 20px rgba(10,132,255,0.36);
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    white-space: nowrap; border: none;
  }
  .btn-f:hover { background: #409CFF; box-shadow: 0 6px 28px rgba(10,132,255,0.5); transform: translateY(-1px); }
  .btn-f:active { transform: translateY(0); }

  /* Primary Large — Hero */
  .btn-fl {
    display: inline-flex; align-items: center; justify-content: center;
    height: 52px; padding: 0 32px; border-radius: 14px; gap: 6px;
    background: #0A84FF; color: #fff;
    font-size: 16px; font-weight: 600; letter-spacing: -0.01em;
    box-shadow: 0 4px 24px rgba(10,132,255,0.40);
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    white-space: nowrap; border: none;
  }
  .btn-fl:hover { background: #409CFF; box-shadow: 0 8px 32px rgba(10,132,255,0.54); transform: translateY(-2px); }

  /* Secondary — Tinted */
  .btn-t {
    display: inline-flex; align-items: center; justify-content: center;
    height: 44px; padding: 0 20px; border-radius: 12px; gap: 6px;
    background: rgba(10,132,255,0.12); border: 1px solid rgba(10,132,255,0.26);
    color: #0A84FF; font-size: 13px; font-weight: 500; letter-spacing: 0.02em;
    transition: background 0.15s; white-space: nowrap;
  }
  .btn-t:hover { background: rgba(10,132,255,0.20); }

  /* Ghost — Bordered */
  .btn-g {
    display: inline-flex; align-items: center; justify-content: center;
    height: 52px; padding: 0 28px; border-radius: 14px; gap: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.13);
    color: rgba(255,255,255,0.88); font-size: 16px; font-weight: 500; letter-spacing: -0.01em;
    transition: all 0.15s; backdrop-filter: blur(8px); white-space: nowrap;
  }
  .btn-g:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.22); }

  /* Hamburger */
  .ham { display: none; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; margin-left: auto; }

  /* Mobile menu */
  .mob-menu {
    display: none; position: fixed; top: 64px; left: 0; right: 0; z-index: 490;
    background: rgba(6,6,8,0.97); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-direction: column; padding: 16px 20px 24px; gap: 2px;
  }
  .mob-menu.open { display: flex; }
  .mob-a {
    font-size: 17px; font-weight: 500; letter-spacing: -0.01em;
    color: rgba(255,255,255,0.72); padding: 14px 12px; border-radius: 10px;
    display: block; transition: background 0.15s, color 0.15s;
  }
  .mob-a:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .mob-ctas { display: flex; flex-direction: column; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); margin-top: 12px; }

  /* Hero */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 148px 48px 108px;
    background:
      radial-gradient(ellipse 85% 55% at 15% 0%,   rgba(10,132,255,0.13) 0%, transparent 55%),
      radial-gradient(ellipse 55% 40% at 85% 15%,  rgba(48,209,88,0.05)  0%, transparent 50%),
      radial-gradient(ellipse 50% 65% at 50% 105%, rgba(10,132,255,0.08) 0%, transparent 60%),
      #060608;
    position: relative;
  }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 18px; border-radius: 99px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
    backdrop-filter: blur(8px); margin-bottom: 44px;
  }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #30D158; box-shadow: 0 0 8px #30D158; animation: pulse 2s infinite; flex-shrink: 0; }
  .hero-h1 { font-size: 88px; font-weight: 700; letter-spacing: -0.045em; line-height: 1.01; color: #fff; max-width: 860px; margin-bottom: 28px; }
  .grad-text { background: linear-gradient(135deg, #0A84FF 0%, #40C4FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-sub { font-size: 20px; font-weight: 400; letter-spacing: -0.01em; color: rgba(255,255,255,0.50); max-width: 380px; line-height: 1.6; margin-bottom: 52px; }
  .hero-ctas { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 68px; }
  .hero-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }

  /* Signal Pill */
  .pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 99px; backdrop-filter: blur(8px); }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .pill-type { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; }
  .pill-text { font-size: 12px; color: rgba(255,255,255,0.52); }

  /* Divider */
  .div { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); }

  /* Stats Bar */
  .stats { display: grid; grid-template-columns: repeat(4,1fr); background: #0F0F13; }
  .stat { padding: 52px 32px; text-align: center; border-right: 1px solid rgba(255,255,255,0.07); }
  .stat:last-child { border-right: none; }
  .stat-v { font-size: 54px; font-weight: 700; letter-spacing: -0.045em; line-height: 1; margin-bottom: 10px; }
  .stat-l { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: rgba(255,255,255,0.88); margin-bottom: 5px; }
  .stat-s { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.24); }

  /* Sections */
  .sec { padding: 116px 0; }
  .sec-dk { background: #0F0F13; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .hd-center { text-align: center; margin-bottom: 76px; }
  .eyebrow-lbl { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #0A84FF; margin-bottom: 18px; }
  .h2 { font-size: 52px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.07; color: #fff; margin-bottom: 20px; }
  .sub { font-size: 16px; font-weight: 400; letter-spacing: -0.01em; color: rgba(255,255,255,0.42); line-height: 1.72; }

  /* Features */
  .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .feat-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 32px 28px 36px;
    transition: all 0.24s cubic-bezier(0.4,0,0.2,1);
  }
  .feat-card:hover { background: rgba(10,132,255,0.05); border-color: rgba(10,132,255,0.2); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.28); }
  .feat-tag { display: inline-flex; padding: 4px 10px; border-radius: 6px; background: rgba(10,132,255,0.11); border: 1px solid rgba(10,132,255,0.2); font-size: 9.5px; letter-spacing: 0.12em; color: #0A84FF; margin-bottom: 20px; }
  .feat-icon { font-size: 20px; margin-bottom: 14px; }
  .feat-title { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; color: #fff; margin-bottom: 10px; }
  .feat-desc { font-size: 13.5px; font-weight: 400; letter-spacing: -0.005em; color: rgba(255,255,255,0.40); line-height: 1.72; }

  /* Steps */
  .steps { display: grid; grid-template-columns: repeat(3,1fr); }
  .step { padding: 52px 44px; border-right: 1px solid rgba(255,255,255,0.07); }
  .step:last-child { border-right: none; }
  .step-n { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; margin-bottom: 24px; opacity: 0.5; }
  .step-t { font-size: 27px; font-weight: 700; letter-spacing: -0.03em; color: #fff; margin-bottom: 12px; }
  .step-d { font-size: 14px; font-weight: 400; letter-spacing: -0.005em; color: rgba(255,255,255,0.42); line-height: 1.76; }
  .step-bar { margin-top: 28px; height: 2px; border-radius: 1px; opacity: 0.56; }

  /* Data */
  .data-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .srcs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .src { font-size: 10px; letter-spacing: 0.06em; color: rgba(255,255,255,0.34); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); transition: all 0.15s; }
  .src:hover { color: #fff; border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.04); }

  /* Terminal strip */
  .t-strip { border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); background: linear-gradient(135deg, rgba(10,132,255,0.07) 0%, transparent 55%); padding: 52px 0; }
  .t-strip-in { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }

  /* Pricing */
  .price-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .price-card { border-radius: 20px; padding: 40px 32px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); position: relative; transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s; }
  .price-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.36); }
  .price-feat { background: linear-gradient(160deg, rgba(10,132,255,0.15) 0%, rgba(10,132,255,0.04) 100%); border-color: rgba(10,132,255,0.28); box-shadow: 0 0 0 1px rgba(10,132,255,0.16), 0 12px 48px rgba(10,132,255,0.10); }
  .price-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #0A84FF; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.14em; padding: 4px 16px; border-radius: 99px; box-shadow: 0 4px 12px rgba(10,132,255,0.48); white-space: nowrap; }
  .price-tier { font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 16px; }
  .price-num { font-size: 52px; font-weight: 700; letter-spacing: -0.045em; line-height: 1; color: #fff; }
  .price-unit { font-size: 14px; color: rgba(255,255,255,0.34); font-weight: 400; letter-spacing: -0.01em; }
  .price-desc { font-size: 13.5px; color: rgba(255,255,255,0.34); margin: 10px 0 28px; line-height: 1.6; font-weight: 400; letter-spacing: -0.005em; }
  .price-feats { border-top: 1px solid rgba(255,255,255,0.07); padding-top: 24px; margin-bottom: 28px; }
  .price-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .price-ck { color: #0A84FF; font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .price-txt { font-size: 13px; color: rgba(255,255,255,0.58); line-height: 1.5; font-weight: 400; letter-spacing: -0.005em; }

  /* Serve */
  .serve-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .serve-card { padding: 36px 32px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); transition: all 0.2s; }
  .serve-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.11); }
  .serve-em { font-size: 28px; margin-bottom: 20px; }
  .serve-role { font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: #fff; margin-bottom: 5px; }
  .serve-org { font-size: 10px; letter-spacing: 0.1em; color: #0A84FF; margin-bottom: 16px; }
  .serve-desc { font-size: 13.5px; color: rgba(255,255,255,0.40); line-height: 1.72; font-weight: 400; letter-spacing: -0.005em; }

  /* CTA */
  .cta-sec { padding: 124px 0; text-align: center; background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(10,132,255,0.09) 0%, transparent 65%), #060608; border-top: 1px solid rgba(255,255,255,0.07); }
  .cta-h2 { font-size: 72px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.03; color: #fff; margin-bottom: 16px; }
  .cta-sub { font-size: 18px; color: rgba(255,255,255,0.42); font-weight: 400; letter-spacing: -0.01em; margin-bottom: 52px; }
  .cta-form { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 14px; }
  .cta-inp { height: 52px; padding: 0 20px; width: 296px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.11); color: #fff; font-size: 15px; outline: none; transition: border-color 0.15s; backdrop-filter: blur(8px); font-family: 'Aeonik Pro','Plus Jakarta Sans',-apple-system,sans-serif; }
  .cta-inp::placeholder { color: rgba(255,255,255,0.28); }
  .cta-inp:focus { border-color: rgba(10,132,255,0.42); }
  .cta-disc { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.18); }

  /* Footer */
  .ftr { background: #0F0F13; border-top: 1px solid rgba(255,255,255,0.07); padding: 72px 0 40px; }
  .ftr-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 56px; }
  .ftr-hd { font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #0A84FF; margin-bottom: 20px; }
  .ftr-links { display: flex; flex-direction: column; gap: 10px; }
  .ftr-lnk { font-size: 13.5px; font-weight: 400; letter-spacing: -0.005em; color: rgba(255,255,255,0.36); transition: color 0.15s; }
  .ftr-lnk:hover { color: rgba(255,255,255,0.78); }
  .ftr-btm { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .ftr-copy { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.18); }
  .ftr-soc { display: flex; gap: 24px; }
  .ftr-sl { font-size: 10px; letter-spacing: 0.08em; color: rgba(255,255,255,0.20); transition: color 0.15s; }
  .ftr-sl:hover { color: #0A84FF; }

  /* ── RESPONSIVE ────────────────────────────────────────── */
  @media (max-width: 1080px) {
    .hero-h1 { font-size: 68px; }
    .h2 { font-size: 44px; }
    .cta-h2 { font-size: 58px; }
    .feat-grid { grid-template-columns: repeat(2,1fr); }
    .ftr-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
    .stat-v { font-size: 46px; }
  }
  @media (max-width: 860px) {
    .nav { padding: 0 24px; }
    .nav-center { display: none; }
    .nav-right .btn-t { display: none; }
    .ham { display: flex; }
    .hero { padding: 120px 28px 88px; }
    .hero-h1 { font-size: 54px; letter-spacing: -0.04em; }
    .hero-sub { font-size: 17px; }
    .stats { grid-template-columns: 1fr 1fr; }
    .stat { border-right: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 40px 24px; }
    .stat:nth-child(2) { border-right: none; }
    .stat:nth-child(3), .stat:nth-child(4) { border-bottom: none; }
    .stat:nth-child(4) { border-right: none; }
    .sec { padding: 84px 0; }
    .hd-center { margin-bottom: 56px; }
    .h2 { font-size: 38px; }
    .feat-grid { grid-template-columns: 1fr; gap: 12px; }
    .steps { grid-template-columns: 1fr; }
    .step { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 40px 28px; }
    .step:last-child { border-bottom: none; }
    .data-2col { grid-template-columns: 1fr; gap: 48px; }
    .t-strip-in { flex-direction: column; text-align: center; gap: 20px; }
    .t-strip { padding: 40px 0; }
    .price-grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; gap: 16px; }
    .price-feat { order: -1; }
    .serve-grid { grid-template-columns: 1fr; gap: 12px; }
    .cta-h2 { font-size: 46px; }
    .cta-inp { width: 100%; max-width: 340px; }
    .ftr-grid { grid-template-columns: 1fr; gap: 36px; }
    .mob-menu { top: 64px; }
  }
  @media (max-width: 480px) {
    .nav { padding: 0 20px; height: 56px; padding-top: env(safe-area-inset-top,0); }
    .mob-menu { top: calc(56px + env(safe-area-inset-top,0)); }
    .hero { padding: 108px 20px 80px; }
    .hero-h1 { font-size: 42px; letter-spacing: -0.035em; }
    .hero-sub { font-size: 16px; max-width: 300px; }
    .hero-ctas { flex-direction: column; align-items: stretch; }
    .btn-fl, .btn-g { width: 100%; justify-content: center; }
    .stat-v { font-size: 38px; }
    .stat { padding: 32px 16px; }
    .h2 { font-size: 30px; letter-spacing: -0.03em; }
    .hd-center { margin-bottom: 44px; }
    .feat-card { padding: 24px 20px 28px; }
    .price-card { padding: 32px 24px; }
    .price-num { font-size: 46px; }
    .serve-card { padding: 28px 22px; }
    .cta-h2 { font-size: 36px; letter-spacing: -0.035em; }
    .cta-sub { font-size: 16px; margin-bottom: 40px; }
    .cta-inp { width: 100%; max-width: none; }
    .cta-form { flex-direction: column; align-items: stretch; }
    .cta-form .btn-fl { width: 100%; }
    .ftr { padding: 56px 0 calc(32px + env(safe-area-inset-bottom,0)); }
  }
`}} />
```

);
}

/* ── TICKER ──────────────────────────────────────────────────────────────── */
function Ticker() {
const all = […TICKS, …TICKS];
return (
<div className="ticker">
<div className="ticker-edge-l" />
<div className="ticker-edge-r" />
<div className="ticker-track fm">
{all.map(([label, chg, up], i) => (
<span key={i} className="ticker-item">
<span style={{ color: "rgba(255,255,255,0.30)" }}>{label}</span>
{chg && <span style={{ color: up === true ? green : up === false ? red : blue, fontWeight: 500 }}>{chg}</span>}
</span>
))}
</div>
</div>
);
}

/* ── NAV ─────────────────────────────────────────────────────────────────── */
function Nav({ scrolled }) {
const [open, setOpen] = useState(false);
return (
<>
<nav className={`nav fa ${scrolled ? "on" : ""}`}>
<a href="/" style={{ display: "flex", alignItems: "center", minHeight: 44 }}>
<img src={LOGO} alt="ConstructAIQ" className="nav-logo-img" />
</a>
<div className="nav-center">
{[["Features","#features"],["Data","#data"],["Pricing","#pricing"],["About","#about"]].map(([l,h]) => (
<a key={l} href={h} className="nav-a">{l}</a>
))}
</div>
<div className="nav-right">
<a href="/dashboard" className="btn-t fm" style={{ fontSize: 10, letterSpacing: "0.1em", height: 40 }}>
LIVE TERMINAL →
</a>
<a href="#access" className="btn-f fa" style={{ height: 40, fontSize: 14 }}>Get Access</a>
</div>
<button className="ham" onClick={() => setOpen(o => !o)} aria-label="Menu">
<svg width="22" height="16" viewBox="0 0 22 16" fill="none">
<rect y="0"  width="22" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
<rect y="7"  width="15" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
<rect y="14" width="22" height="2" rx="1" fill={open ? blue : "rgba(255,255,255,0.66)"} style={{ transition: "fill 0.15s" }} />
</svg>
</button>
</nav>
<div className={`mob-menu fa ${open ? "open" : ""}`}>
{[["Features","#features"],["Data","#data"],["Pricing","#pricing"],["About","#about"]].map(([l,h]) => (
<a key={l} href={h} className="mob-a" onClick={() => setOpen(false)}>{l}</a>
))}
<div className="mob-ctas">
<a href="/dashboard" className="btn-g fa" onClick={() => setOpen(false)} style={{ fontSize: 14 }}>Open Live Terminal →</a>
<a href="#access" className="btn-fl fa" onClick={() => setOpen(false)}>Get Early Access</a>
</div>
</div>
</>
);
}

/* ── PRICING CARD ────────────────────────────────────────────────────────── */
function PCard({ tier, price, unit, desc, features, cta, featured }) {
return (
<div className={`price-card fa ${featured ? "price-feat" : ""}`}>
{featured && <div className="price-badge fm">MOST POPULAR</div>}
<div className="price-tier fm" style={{ color: featured ? blue : "rgba(255,255,255,0.28)" }}>{tier}</div>
<div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
<span className="price-num">{price}</span>
{unit && <span className="price-unit">{unit}</span>}
</div>
<div className="price-desc">{desc}</div>
<div className="price-feats">
{features.map((f, i) => (
<div key={i} className="price-row">
<span className="price-ck">✓</span>
<span className="price-txt">{f}</span>
</div>
))}
</div>
<a href="#access"
className={featured ? "btn-fl fa" : "btn-g fa"}
style={{ width: "100%", fontSize: 14, fontWeight: featured ? 600 : 500, height: 44,
…(featured ? {} : { color: blue, borderColor: "rgba(10,132,255,0.26)", background: "rgba(10,132,255,0.08)", height: 44, borderRadius: 12 })
}}>
{cta}
</a>
</div>
);
}

/* ══════════════════════════════════════════════════════════
MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
const h = () => setScrolled(window.scrollY > 40);
window.addEventListener("scroll", h, { passive: true });
return () => window.removeEventListener("scroll", h);
}, []);

return (
<div className="fa" style={{ background: "#060608", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
<GlobalStyles />
<Nav scrolled={scrolled} />
<Ticker />

```
  {/* ────── HERO ────── */}
  <section className="hero">
    <div className="eyebrow d1 fa">
      <div className="live-dot" />
      <span className="fm" style={{ fontSize: 10, letterSpacing: "0.1em", color: green }}>LIVE</span>
      <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.12)" }} />
      <span className="fm" style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.34)" }}>312 SOURCES</span>
    </div>
    <h1 className="hero-h1 fa d2">
      The Construction<br />
      <span className="grad-text">Intelligence Terminal.</span>
    </h1>
    <p className="hero-sub fa d3">
      Market signals.<br />Before the market moves.
    </p>
    <div className="hero-ctas d4">
      <a href="#access" className="btn-fl fa">Get Early Access</a>
      <a href="/dashboard" className="btn-g fa">
        View Live Terminal <span style={{ color: blue }}>→</span>
      </a>
    </div>
    <div className="hero-pills d5">
      {[
        { t: "BULLISH", txt: "Infrastructure Surge", c: green },
        { t: "WARNING", txt: "Craft Labor 12-yr Low", c: amber },
        { t: "DATA",    txt: "BLS +18,400 Jobs",     c: blue  },
        { t: "BEARISH", txt: "Multifamily Pullback", c: red   },
      ].map(({ t, txt, c }, i) => (
        <div key={i} className="pill fa" style={{ background: `${c}10`, border: `1px solid ${c}20` }}>
          <div className="pill-dot" style={{ background: c }} />
          <span className="pill-type fm" style={{ color: c }}>{t}</span>
          <span className="pill-text">{txt}</span>
        </div>
      ))}
    </div>
  </section>

  {/* ────── STATS ────── */}
  <div className="div" />
  <div className="stats">
    {[
      { v: "312",  u: "",    l: "Data Sources",      s: "Federal + State",    c: blue  },
      { v: "94.8", u: "%",   l: "Forecast Accuracy", s: "12-Month Horizon",   c: green },
      { v: "4",    u: " hrs",l: "Data Freshness",    s: "Rolling Updates",    c: amber },
      { v: "50",   u: "+",   l: "Metro Markets",     s: "Full U.S. Coverage", c: blue  },
    ].map((s, i) => (
      <div key={i} className="stat">
        <div className="stat-v fa" style={{ color: s.c }}>
          {s.v}<span style={{ fontSize: "0.44em" }}>{s.u}</span>
        </div>
        <div className="stat-l fa">{s.l}</div>
        <div className="stat-s fm">{s.s}</div>
      </div>
    ))}
  </div>
  <div className="div" />

  {/* ────── FEATURES ────── */}
  <section id="features" className="sec">
    <div className="wrap">
      <div className="hd-center">
        <div className="eyebrow-lbl fm">Platform</div>
        <h2 className="h2">Intelligence that moves<br />at construction speed.</h2>
        <p className="sub">Six modules. One terminal. Zero manual aggregation.</p>
      </div>
      <div className="feat-grid">
        {[
          { icon: "◎", tag: "AI FORECAST", title: "Predictive Market Model",   desc: "Predict spend, permits, and labor 12 months out. 94.8% accuracy." },
          { icon: "◈", tag: "DATA",         title: "312 Sources Unified",       desc: "Every federal feed. All 50 state permit offices. One platform." },
          { icon: "⬡", tag: "SECTORS",      title: "Sector Heat Map",           desc: "8 construction sectors. Real-time momentum scores." },
          { icon: "△", tag: "LABOR",         title: "Craft Labor Intelligence",  desc: "Wage pressure signals across 200+ metropolitan areas." },
          { icon: "◻", tag: "MATERIALS",    title: "Materials Cost Monitor",    desc: "BUY. SELL. HOLD. AI-scored signals on 6 key commodities." },
          { icon: "⬤", tag: "FEDERAL",      title: "Pipeline Tracker",          desc: "$890B in IIJA and federal contracts. None missed." },
        ].map((f, i) => (
          <div key={i} className="feat-card">
            <div className="feat-tag fm">{f.tag}</div>
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-title fa">{f.title}</div>
            <div className="feat-desc fa">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ────── HOW IT WORKS ────── */}
  <div className="sec-dk">
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <div className="eyebrow-lbl fm">How It Works</div>
          <h2 className="h2" style={{ fontSize: "clamp(26px,3.5vw,44px)" }}>
            Raw data.<br />Refined signal.
          </h2>
        </div>
        <div className="steps">
          {[
            { n: "01", t: "Ingest",  d: "312 feeds. Every 4 hours. Fully automatic.",          c: blue  },
            { n: "02", t: "Analyze", d: "AI ensemble models. 20 years of construction data.",   c: green },
            { n: "03", t: "Act",     d: "Your signal. Confidence intervals. Before the bid.",   c: amber },
          ].map((s, i) => (
            <div key={i} className="step">
              <div className="step-n fm" style={{ color: s.c }}>{s.n}</div>
              <div className="step-t fa">{s.t}</div>
              <div className="step-d fa">{s.d}</div>
              <div className="step-bar" style={{ background: `linear-gradient(to right, ${s.c}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>

  {/* ────── DATA SOURCES ────── */}
  <section id="data" className="sec">
    <div className="wrap">
      <div className="data-2col">
        <div>
          <div className="eyebrow-lbl fm">Data Infrastructure</div>
          <h2 className="h2">One platform.<br />Every source<br />that matters.</h2>
          <p className="sub" style={{ marginBottom: 36 }}>
            Federal agencies. State permit offices. Commodity exchanges. Normalized, weighted, refreshed every four hours.
          </p>
          <a href="/dashboard" className="btn-t fm" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
            VIEW LIVE TERMINAL →
          </a>
        </div>
        <div className="srcs fm">
          {["Census Bureau VIP","BLS CES / QCEW","FRED / Fed Reserve","HUD SOCDS","DOT FHWA","AGC Data Digest","USASpending.gov","RSMeans Cost Index","Dodge Construction","50 State Permit APIs","FEMA Flood Maps","EPA Air Quality"].map((s, i) => (
            <div key={i} className="src">{s}</div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* ────── TERMINAL STRIP ────── */}
  <div className="t-strip">
    <div className="wrap">
      <div className="t-strip-in">
        <div>
          <div className="fm" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: blue, marginBottom: 8, textTransform: "uppercase" }}>Live — No Login Required</div>
          <div className="fa" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>See the full Bloomberg-grade terminal.</div>
        </div>
        <a href="/dashboard" className="btn-fl fa" style={{ flexShrink: 0 }}>Open Terminal</a>
      </div>
    </div>
  </div>

  {/* ────── PRICING ────── */}
  <section id="pricing" className="sec">
    <div className="wrap">
      <div className="hd-center">
        <div className="eyebrow-lbl fm">Pricing</div>
        <h2 className="h2">Plans for every scale.</h2>
        <p className="sub">Early access pricing. Locked in at launch.</p>
      </div>
      <div className="price-grid">
        <PCard tier="Starter"      price="$490"   unit="/mo" desc="New markets. Sharp instincts."   cta="Start Free Trial"  featured={false}
          features={["5 metro dashboards","Monthly AI forecasts","Materials cost index","Permit volume trends","Email support"]} />
        <PCard tier="Professional" price="$1,490" unit="/mo" desc="For ENR 400 firms."              cta="Get Early Access"  featured={true}
          features={["25 metro dashboards","Weekly forecast updates","Full labor market signals","Federal pipeline monitor","Bid intelligence module","API 50k calls/mo","Slack / Teams alerts","Priority support"]} />
        <PCard tier="Enterprise"   price="Custom" unit=""    desc="For ENR 100."                    cta="Contact Sales"     featured={false}
          features={["Unlimited metro coverage","Daily data refresh","Scenario modeling suite","Portfolio stress-testing","Dedicated analyst","Unlimited API access","SSO + audit logs","SLA guarantee"]} />
      </div>
    </div>
  </section>

  {/* ────── WHO WE SERVE ────── */}
  <div id="about" className="sec-dk">
    <section className="sec">
      <div className="wrap">
        <div className="hd-center">
          <div className="eyebrow-lbl fm">Who We Serve</div>
          <h2 className="h2" style={{ fontSize: "clamp(26px,3.5vw,44px)" }}>Built for professionals<br />who move the market.</h2>
        </div>
        <div className="serve-grid">
          {[
            { em: "📊", role: "Economists",      org: "NAHB · AGC · Regional Fed", desc: "Unified construction data. No manual aggregation. Cite it in your next report." },
            { em: "🏗️", role: "Contractors",     org: "ENR 400 to ENR 100",        desc: "Sharpen bids. Time procurement. Expand into new markets with confidence." },
            { em: "🏦", role: "Capital Markets", org: "Lenders · PE · REITs",       desc: "Underwrite deals with forward data. Stress-test portfolios against 12-month forecasts." },
          ].map((a, i) => (
            <div key={i} className="serve-card">
              <div className="serve-em">{a.em}</div>
              <div className="serve-role fa">{a.role}</div>
              <div className="serve-org fm">{a.org}</div>
              <div className="serve-desc fa">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>

  {/* ────── CTA BAND ────── */}
  <section id="access" className="cta-sec">
    <div className="wrap">
      <div className="eyebrow-lbl fm" style={{ marginBottom: 28 }}>Early Access</div>
      <h2 className="cta-h2 fa">
        The market<br />
        <span className="grad-text">doesn't wait.</span>
      </h2>
      <p className="cta-sub fa">Neither should you.</p>
      <div className="cta-form">
        <input type="email" placeholder="your@email.com" className="cta-inp fa" />
        <button className="btn-fl fa">Request Access</button>
      </div>
      <div className="cta-disc fm">No spam — launch updates only</div>
    </div>
  </section>

  {/* ────── FOOTER ────── */}
  <footer className="ftr">
    <div className="wrap">
      <div className="ftr-grid">
        <div>
          <img src={LOGO} alt="ConstructAIQ" style={{ height: 24, marginBottom: 20 }} />
          <p className="fa" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.34)", lineHeight: 1.76, maxWidth: 255, marginBottom: 24, fontWeight: 400, letterSpacing: "-0.005em" }}>
            AI-powered construction market intelligence. 312 sources. One terminal.
          </p>
          <a href="/dashboard" className="btn-t fm" style={{ fontSize: 9.5, letterSpacing: "0.1em", height: 36 }}>OPEN TERMINAL →</a>
        </div>
        {[
          { h: "Product", ls: ["Features","Pricing","Data Sources","API Docs","Changelog"] },
          { h: "Company", ls: ["About","Blog","Careers","Press","Contact"] },
          { h: "Legal",   ls: ["Privacy","Terms","Data Usage","Security","Cookies"] },
        ].map((col, i) => (
          <div key={i}>
            <div className="ftr-hd fm">{col.h}</div>
            <div className="ftr-links">
              {col.ls.map(l => <a key={l} href="#" className="ftr-lnk fa">{l}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="ftr-btm">
        <span className="ftr-copy fm">© 2026 ConstructAIQ Inc. All rights reserved.</span>
        <div className="ftr-soc">
          {["LinkedIn","X / Twitter","GitHub"].map(s => <a key={s} href="#" className="ftr-sl fm">{s}</a>)}
        </div>
      </div>
    </div>
  </footer>
</div>
```

);
}
