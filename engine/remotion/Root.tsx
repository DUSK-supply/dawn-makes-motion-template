import { Composition } from "remotion";
import { EpisodeTemplate } from "./compositions/EpisodeTemplate";
export const Root = () => {
  return (
    <>
      <Composition
        id="EpisodeTemplate"
        component={EpisodeTemplate}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Sample Episode",
          scenes: []
        }}
      />
    </>
  );
};
