"use client";

import dynamic from "next/dynamic";

// 3D scenes must render only in the browser (WebGL). Dynamically
// import with ssr:false and a lightweight gradient placeholder.
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-bg" />,
});

export default function HeroSceneClient() {
  return <HeroScene />;
}
