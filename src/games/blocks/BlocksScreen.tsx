import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { ScreenSafeArea } from '../../components/ScreenSafeArea';
import { GlassTool } from '../../components/GlassTool';
import { GlassModal } from '../../components/GlassModal';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { translate } from '../../i18n/strings';
import { BlocksGame, SHAPES, canPlay, fits, newBlocks, place } from './engine';
import { loadBlocks, saveBlocks } from './storage';

type Target = {slot:number; row:number; col:number};
function Piece({shape, slot, selected, cell, blocked, onSelect, onDrag, onDrop}: {shape:number; slot:number; selected:boolean; cell:number; blocked:boolean; onSelect:()=>void; onDrag:(x:number,y:number)=>void; onDrop:(x:number,y:number)=>void}) {
  const {colors}=useTheme(); const {motionReduced,language}=usePreferences();
  const [offset]=useState(()=>new Animated.ValueXY());
  const callbacks=useRef({blocked,onSelect,onDrag,onDrop});
  useEffect(()=>{callbacks.current={blocked,onSelect,onDrag,onDrop};},[blocked,onSelect,onDrag,onDrop]);
  // eslint-disable-next-line react-hooks/refs
  const [responder]=useState(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>!callbacks.current.blocked,
    onMoveShouldSetPanResponder:()=>!callbacks.current.blocked,
    onPanResponderTerminationRequest:()=>false,
    onPanResponderGrant:()=>callbacks.current.onSelect(),
    onPanResponderMove:(_e,g)=>{offset.setValue({x:g.dx,y:g.dy-68}); callbacks.current.onDrag(g.moveX,g.moveY);},
    onPanResponderRelease:(_e,g)=>{if(Math.abs(g.dx)+Math.abs(g.dy)>8)callbacks.current.onDrop(g.moveX,g.moveY); Animated.timing(offset,{toValue:{x:0,y:0},duration:motionReduced?0:160,useNativeDriver:true}).start();},
    onPanResponderTerminate:()=>{offset.setValue({x:0,y:0}); callbacks.current.onDrop(-1000,-1000);},
  }));
  const cells=SHAPES[shape], rows=Math.max(...cells.map(p=>p[0]))+1, cols=Math.max(...cells.map(p=>p[1]))+1;
  const unit=Math.min(22,cell*.55);
  const touchWidth=Math.max(52,cols*unit), touchHeight=Math.max(52,rows*unit);
  return <View style={s.slot}><Animated.View {...responder.panHandlers} accessible accessibilityRole="button" accessibilityLabel={`${translate('Фигура',language)} ${slot+1}`} accessibilityState={{selected,disabled:blocked}} onAccessibilityTap={onSelect} style={{width:touchWidth,height:touchHeight,transform:offset.getTranslateTransform(),opacity:blocked?.35:1}}>
    {cells.map(([r,c])=><View key={`${r}:${c}`} style={{position:'absolute',top:r*unit+(touchHeight-rows*unit)/2,left:c*unit+(touchWidth-cols*unit)/2,width:unit-3,height:unit-3,borderRadius:4,backgroundColor:colors.textPrimary,borderWidth:selected?1:0,borderColor:colors.textMuted}}/>)}
  </Animated.View></View>;
}

export function BlocksScreen({profileId}:{profileId:string}) {
  const {colors,mode}=useTheme(); const {width,height}=useWindowDimensions(); const {motionReduced,language}=usePreferences();
  const [game,setGame]=useState<BlocksGame|null>(null), [selected,setSelected]=useState<number|null>(null), [target,setTarget]=useState<Target|null>(null);
  const [sheet,setSheet]=useState(false), [loadError,setLoadError]=useState(false), [saveError,setSaveError]=useState(false), [retry,setRetry]=useState(0), [cleared,setCleared]=useState<number[]>([]);
  const current=useRef<BlocksGame|null>(null), mounted=useRef(true), revision=useRef(0), board=useRef<View>(null), origin=useRef({x:0,y:0});
  const [flash]=useState(()=>new Animated.Value(0));
  useEffect(()=>{mounted.current=true; let active=true; void loadBlocks(profileId).then(value=>{if(active){current.current=value;setGame(value);setLoadError(false);}}).catch(()=>{if(active)setLoadError(true);}); return()=>{active=false;mounted.current=false;};},[profileId,retry]);
  const persist=(value:BlocksGame)=>{const version=++revision.current; void saveBlocks(profileId,value).then(()=>{if(mounted.current&&version===revision.current)setSaveError(false);}).catch(()=>{if(mounted.current&&version===revision.current)setSaveError(true);});};
  const size=Math.min(width-32,420,Math.max(224,height-330)), cell=size/8;
  const measure=()=>board.current?.measureInWindow((x,y)=>{origin.current={x,y};});
  const commit=(slot:number,row:number,col:number)=>{
    const previous=current.current; if(!previous||sheet)return;
    const result=place(previous,slot,row,col); if(!result)return;
    current.current=result.game; setGame(result.game);setSelected(null);setTarget(null);persist(result.game);
    if(result.cleared.length){setCleared(result.cleared);flash.stopAnimation();flash.setValue(1);Animated.timing(flash,{toValue:0,duration:motionReduced?0:320,useNativeDriver:true}).start();}
    if(!motionReduced)void Haptics.impactAsync(result.lines?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
  };
  const locate=(slot:number,x:number,y:number):Target|null=>{
    const shape=current.current?.pieces[slot]; if(shape==null)return null;
    const cells=SHAPES[shape], rows=Math.max(...cells.map(p=>p[0]))+1, cols=Math.max(...cells.map(p=>p[1]))+1;
    return {slot,row:Math.round((y-68-origin.current.y)/cell-rows/2),col:Math.round((x-origin.current.x)/cell-cols/2)};
  };
  const lost=!!game&&!canPlay(game);
  const previewShape=target&&game?.pieces[target.slot];
  const valid=!!target&&previewShape!=null&&!!game&&fits(game.board,previewShape,target.row,target.col);
  const preview=target&&previewShape!=null?SHAPES[previewShape].map(([r,c])=>(target.row+r)*8+target.col+c):[];
  const restart=()=>{const next=newBlocks(current.current?.best||0);current.current=next;setGame(next);setSelected(null);setTarget(null);setCleared([]);setSheet(false);persist(next);};
  return <ScreenSafeArea edges={['top','bottom','left','right']} style={{flex:1,backgroundColor:colors.canvas}}>
    <View style={s.header}><GlassTool label="Назад" onPress={()=>router.canGoBack()?router.back():router.replace('/games')}><ChevronLeft size={22} color={colors.textPrimary}/></GlassTool><Text translate={false} style={[s.title,{color:colors.textPrimary}]}>Block Blast</Text><GlassTool label="Новая игра" onPress={()=>setSheet(true)}><RotateCcw size={20} color={colors.textPrimary}/></GlassTool></View>
    {!game?<View style={s.center}>{loadError?<Pressable onPress={()=>setRetry(v=>v+1)}><Text style={{color:colors.textPrimary}}>Не удалось открыть игру. Нажмите, чтобы повторить.</Text></Pressable>:<ActivityIndicator color={colors.textPrimary}/>}</View>:<View style={s.center}>
      <View style={[s.stats,{width:size}]}>{[{label:'Счёт',value:game.score},{label:'Рекорд',value:game.best}].map(item=><View key={item.label}><Text style={{color:colors.textMuted,fontSize:13}}>{item.label}</Text><Text translate={false} style={{color:colors.textPrimary,fontSize:30,fontWeight:'600',fontVariant:['tabular-nums']}}>{item.value}</Text></View>)}</View>
      <View ref={board} onLayout={measure} style={{width:size,height:size,backgroundColor:colors.cardBg,borderRadius:18,overflow:'hidden'}}>
        {game.board.map((value,i)=>{const highlighted=valid&&preview.includes(i); return <Pressable key={i} accessibilityLabel={`${translate('Клетка',language)} ${Math.floor(i/8)+1}, ${i%8+1}`} accessibilityRole="button" disabled={selected===null||lost||sheet} onPress={()=>{if(selected!==null)commit(selected,Math.floor(i/8),i%8);}} style={{position:'absolute',left:(i%8)*cell+2,top:Math.floor(i/8)*cell+2,width:cell-4,height:cell-4,borderRadius:Math.min(7,cell*.17),backgroundColor:value||highlighted?colors.textPrimary:mode==='dark'?'#242625':'#E5E5E5',opacity:highlighted?.45:1}}/>;})}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:flash}]}>{cleared.map(i=><View key={i} style={{position:'absolute',left:(i%8)*cell+2,top:Math.floor(i/8)*cell+2,width:cell-4,height:cell-4,borderRadius:7,backgroundColor:colors.textMuted}}/>)}</Animated.View>
      </View>
      <View style={[s.tray,{width:size}]}>{game.pieces.map((shape,slot)=>shape===null?<View key={`used:${slot}`} style={s.slot}/>:<Piece key={`${game.moves}:${slot}`} shape={shape} slot={slot} selected={selected===slot} cell={cell} blocked={lost||sheet} onSelect={()=>{measure();setSelected(slot);}} onDrag={(x,y)=>setTarget(locate(slot,x,y))} onDrop={(x,y)=>{const t=locate(slot,x,y);if(t)commit(slot,t.row,t.col);setTarget(null);}}/>)}</View>
      {lost?<Pressable onPress={restart} style={[s.finish,{backgroundColor:colors.cardBg}]}><Text style={{color:colors.textPrimary,fontSize:18,fontWeight:'600'}}>Ходов больше нет</Text><Text style={{color:colors.textSecondary,marginTop:5}}>Ещё раз</Text></Pressable>:<Text style={{color:colors.textMuted,fontSize:12,textAlign:'center',maxWidth:size}}>Перетащите фигуру или выберите её и нажмите на клетку.</Text>}
      {saveError&&<Pressable onPress={()=>{if(current.current)persist(current.current);}}><Text style={{color:colors.danger,fontSize:12,marginTop:8}}>Не удалось сохранить игру. Нажмите, чтобы повторить.</Text></Pressable>}
    </View>}
    <GlassModal visible={sheet} onClose={()=>setSheet(false)}><Text style={{color:colors.textPrimary,fontSize:23,fontWeight:'600'}}>Новая игра</Text><Text style={{color:colors.textSecondary,marginTop:12}}>Текущая партия будет сброшена. Рекорд сохранится.</Text><Pressable onPress={restart} style={[s.finish,{backgroundColor:colors.textPrimary,marginTop:20}]}><Text style={{color:colors.onAccent,fontWeight:'600'}}>Начать заново</Text></Pressable></GlassModal>
  </ScreenSafeArea>;
}
const s=StyleSheet.create({header:{height:72,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:22,fontWeight:'600'},center:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:12},stats:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:8,marginBottom:20},tray:{flexDirection:'row',height:120,alignItems:'center',zIndex:2},slot:{flex:1,minHeight:88,alignItems:'center',justifyContent:'center'},finish:{padding:16,borderRadius:18,alignItems:'center',minWidth:200}});
