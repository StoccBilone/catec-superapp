import React from 'react';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/themeContext';
import { GameId } from './catalog';

// Vector artwork stays sharp at every display size and follows the app theme.
export function GameArtwork({ game }: { game: GameId }) {
  const { colors } = useTheme();
  const ink = colors.textPrimary;
  const soft = colors.cardBorderHighlight;
  return <Svg width="100%" height="100%" viewBox="0 0 144 144">
    {game === 'blocks' && <>
      <Rect x={19} y={19} width={106} height={106} rx={22} fill={colors.canvas}/>
      {[[0,0],[1,0],[2,0],[2,1],[0,3],[1,3],[1,4],[3,2],[3,3],[4,2],[4,3]].map(([r,c],i)=><Rect key={i} x={27+c*19} y={27+r*19} width={16} height={16} rx={4} fill={ink} opacity={i<4?1:i<7?.55:.3}/>)}
    </>}
    {game === '2048' && <>
      <Rect x={17} y={17} width={110} height={110} rx={25} fill={colors.canvas} />
      {[{ x: 25, y: 25, n: '2' }, { x: 76, y: 25, n: '4' }, { x: 25, y: 76, n: '8' }, { x: 76, y: 76, n: '16' }].map((tile, i) => <G key={tile.n}>
        <Rect x={tile.x} y={tile.y} width={43} height={43} rx={12} fill={i === 3 ? ink : soft} fillOpacity={i === 3 ? 1 : 0.38 + i * 0.12} />
        <SvgText x={tile.x + 21.5} y={tile.y + 29} textAnchor="middle" fontSize={23} fontWeight="700" fill={i === 3 ? colors.onAccent : ink}>{tile.n}</SvgText>
      </G>)}
    </>}
    {game === 'island' && <>
      <Rect x={37} y={22} width={70} height={21} rx={10.5} fill={ink} />
      <Circle cx={93} cy={32.5} r={3} fill={colors.onAccent} opacity={0.3} />
      <Path d="M 39 102 L 82 54 L 103 78" stroke={soft} strokeWidth={2} strokeDasharray="4 7" strokeLinecap="round" fill="none" />
      <Circle cx={103} cy={78} r={8} fill={ink} />
      <Rect x={25} y={116} width={54} height={8} rx={4} fill={ink} />
    </>}
    {game === 'maze' && <>
      <G transform="translate(72 73) rotate(-12) translate(-72 -73)">
        <Rect x={24} y={27} width={100} height={100} rx={17} fill={soft} opacity={0.35} />
        <Rect x={20} y={19} width={100} height={100} rx={17} fill={colors.canvas} stroke={ink} strokeWidth={3} />
        <Path d="M 46 20 V 67 H 71 V 93 H 96 M 96 20 V 45 H 71 M 20 93 H 46 V 118 M 120 68 H 96 V 93" stroke={ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={102} cy={104} r={7} fill={ink} opacity={0.2} />
        <Circle cx={34} cy={37} r={7} fill={ink} />
        <Circle cx={32} cy={35} r={2} fill={colors.onAccent} opacity={0.65} />
      </G>
    </>}
    {game === 'memory' && <>
      <Rect x={27} y={27} width={60} height={79} rx={16} fill={soft} transform="rotate(-14 57 66)" />
      <Path d="M 43 58 L 48 68 L 43 78 L 38 68 Z" fill={ink} opacity={0.55} />
      <G transform="rotate(10 87 82)">
        <Rect x={58} y={41} width={60} height={79} rx={16} fill={ink} />
        <Path d="M 88 64 L 99 81 L 88 98 L 77 81 Z" stroke={colors.onAccent} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
      </G>
    </>}
  </Svg>;
}
