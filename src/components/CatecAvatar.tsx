import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';

/** College uniform stays consistent as more student characters are added. */
export function CatecAvatar({ size = 180 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 240 240">
    <Circle cx="120" cy="120" r="118" fill="#E4F1FF" />
    <Circle cx="185" cy="60" r="17" fill="#FFFFFF" opacity=".65" />
    <Ellipse cx="121" cy="214" rx="77" ry="10" fill="#C9DFFF" />
    <Path d="M49 210l8-49c3-23 24-35 45-37h37c25 2 45 15 49 37l7 49z" fill="#22282E" />
    <Path d="M70 158l-8 39 23 4 7-39M166 154l13 43 20-7-14-34" fill="#171C21" />
    <Path d="M103 108h34v28c-8 13-26 13-34 0z" fill="#DFAC8A" />
    <Path d="M95 127l25 17-13 15-15-25M145 127l-25 17 13 15 15-25" fill="#11171C" />
    <Path d="M120 145v35" stroke="#454D55" strokeWidth="2" />
    <Circle cx="123" cy="159" r="1.8" fill="#899198" />
    <Circle cx="123" cy="172" r="1.8" fill="#899198" />
    <Ellipse cx="82" cy="82" rx="8" ry="13" fill="#E8B998" />
    <Ellipse cx="158" cy="82" rx="8" ry="13" fill="#E8B998" />
    <Path d="M82 65c0-26 76-32 76 0v24c0 29-19 43-38 43S82 115 82 89z" fill="#F2C5A4" />
    <Path d="M79 79V61c0-29 27-43 49-36 17-6 38 12 35 35l-6 24-7-30c-16 9-35 12-56 8l-6 23z" fill="#3A302C" />
    <Path d="M87 51c13-20 42-21 59-10" stroke="#55443A" strokeWidth="5" strokeLinecap="round" fill="none" />
    <Path d="M96 77l10-2M133 75l10 2" stroke="#6D4C3D" strokeWidth="3" strokeLinecap="round" />
    <Ellipse cx="103" cy="85" rx="2.6" ry="3.5" fill="#352D2B" />
    <Ellipse cx="138" cy="85" rx="2.6" ry="3.5" fill="#352D2B" />
    <Path d="M120 86l-3 12h6" stroke="#CB9172" strokeWidth="2" strokeLinecap="round" fill="none" />
    <Path d="M108 107q12 10 24 0" stroke="#955B4E" strokeWidth="2.8" strokeLinecap="round" fill="none" />
    <SvgText x="144" y="159" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="Arial">CATEC</SvgText>
    <Path d="M145 162h30" stroke="#FFFFFF" strokeWidth=".8" opacity=".7" />
    <Path d="M66 188q8-6 17 0l26 15-8 14-28-11q-13-6-7-18" fill="#F2C5A4" />
    <Rect x="100" y="174" width="65" height="44" rx="6" fill="#FFFFFF" stroke="#CAD9EB" strokeWidth="1.5" transform="rotate(-8 132 196)" />
    <Rect x="105" y="180" width="17" height="25" rx="3" fill="#D9EAFF" transform="rotate(-8 132 196)" />
    <Circle cx="113" cy="188" r="4" fill="#1878F3" />
    <Path d="M106 200q7-12 14-1" fill="#1878F3" />
    <SvgText x="128" y="187" fill="#182A40" fontSize="8" fontWeight="800" transform="rotate(-8 132 196)">CATEC</SvgText>
    <Path d="M129 194h25m-25 5h17m-17 5h21" stroke="#A4B8D0" strokeWidth="2" strokeLinecap="round" transform="rotate(-8 132 196)" />
    <Path d="M178 188q-7-5-14-1l-17 10q-4 3-1 6t7 1l8-4q-5 8 1 12 6 3 14-7 10-12 2-17" fill="#F2C5A4" />
  </Svg>;
}

