import React from "react";
import { Composition } from "remotion";
import { CaffeinateProduct, FPS, DURATION } from "./video";

export const Root: React.FC = () => (
  <Composition
    id="CaffeinateProduct"
    component={CaffeinateProduct}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
