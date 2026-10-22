import {Composition} from 'remotion';
import {Promo, PromoProps} from './v2/Promo';
import {T} from './v2/theme';

const defaultProps: PromoProps = {lang: 'en'};

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={T.total} fps={T.fps} width={1920} height={1080} defaultProps={defaultProps} />
    <Composition id="PromoVertical" component={Promo} durationInFrames={T.total} fps={T.fps} width={1080} height={1920} defaultProps={defaultProps} />
  </>
);
