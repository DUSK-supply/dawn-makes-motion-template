import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";

type Scene = {
  text?: string;
};

export const EpisodeTemplate: React.FC<{
  title: string;
  scenes: Scene[];
}> = ({ title }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b1020",
        color: "white",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 64,
        fontFamily: "Arial, sans-serif"
      }}
    >
      <Sequence from={0} durationInFrames={900}>
        <div style={{ opacity, textAlign: "center", padding: 80 }}>{title}</div>
      </Sequence>
    </AbsoluteFill>
  );
};
