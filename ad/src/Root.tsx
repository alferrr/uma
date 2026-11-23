import { Composition } from 'remotion';

import { Explainer, TOTAL_FRAMES } from './Explainer';
import { Explainer2, TOTAL_FRAMES_2 } from './Explainer2';
import { FPS } from './theme';

export function Root() {
  return (
    <>
      <Composition
        id="UmaExplainer"
        component={Explainer}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ layout: 'landscape' as const }}
      />
      <Composition
        id="UmaExplainerVertical"
        component={Explainer}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ layout: 'portrait' as const }}
      />
      <Composition
        id="UmaExplainer2"
        component={Explainer2}
        durationInFrames={TOTAL_FRAMES_2}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ layout: 'landscape' as const }}
      />
      <Composition
        id="UmaExplainer2Vertical"
        component={Explainer2}
        durationInFrames={TOTAL_FRAMES_2}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ layout: 'portrait' as const }}
      />
    </>
  );
}
