import Svg, { Circle, G, type SvgProps } from 'react-native-svg';

type LogoMarkProps = SvgProps & {
  size?: number;
};

const dots = [
  { cx: 0, cy: -42, r: 7.7, fill: '#3EA8CC' },
  { cx: 21, cy: -36.38, r: 6.2, fill: '#78A0B8' },
  { cx: 36.38, cy: -21, r: 6.2, fill: '#A89478' },
  { cx: 42, cy: 0, r: 7.7, fill: '#C89858' },
  { cx: 36.38, cy: 21, r: 6.2, fill: '#303840' },
  { cx: 21, cy: 36.38, r: 6.2, fill: '#303840' },
  { cx: 0, cy: 42, r: 7.7, fill: '#1A2830' },
  { cx: -21, cy: 36.38, r: 6.2, fill: '#303840' },
  { cx: -36.38, cy: 21, r: 6.2, fill: '#506878' },
  { cx: -42, cy: 0, r: 7.7, fill: '#E8CC70' },
  { cx: -36.38, cy: -21, r: 6.2, fill: '#F0E090' },
  { cx: -21, cy: -36.38, r: 6.2, fill: '#88B0C0' },
] as const;

export function LogoMark({ size = 48, ...props }: LogoMarkProps) {
  return (
    <Svg accessibilityRole="image" width={size} height={size} viewBox="0 0 160 160" {...props}>
      <G transform="translate(80 80)">
        {dots.map((dot) => (
          <Circle key={`${dot.cx}-${dot.cy}`} {...dot} />
        ))}
      </G>
    </Svg>
  );
}
