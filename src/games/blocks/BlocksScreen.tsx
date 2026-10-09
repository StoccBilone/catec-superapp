import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react-native';
import { ScreenSafeArea } from '../../components/ScreenSafeArea';
import { GlassTool } from '../../components/GlassTool';
import { GlassModal } from '../../components/GlassModal';
import { Pressable, Text } from '../../components/Typography';
import { useTheme } from '../../theme/themeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { translate } from '../../i18n/strings';
import { BlocksGame, SHAPES, canPlay, fits, legalPlaces, newBlocks, place, previewPlacement } from './engine';
import { loadBlocks, saveBlocks } from './storage';
import { followOffset, magneticTarget, pieceLift, snappedPointer } from './interaction';

type Target = {slot:number; row:number; col:number};
function Piece({shape, slot, selected, cell, lift, blocked, unavailable, onSelect, onDrag, onDrop}: {shape:number; slot:number; selected:boolean; cell:number; lift:number; blocked:boolean; unavailable:boolean; onSelect:()=>void; onDrag:(x:number,y:number)=>void; onDrop:(x:number,y:number)=>boolean}) {
  const {colors}=useTheme(); const {motionReduced,language}=usePreferences();
  const cells=SHAPES[shape], rows=Math.max(...cells.map(p=>p[0]))+1, cols=Math.max(...cells.map(p=>p[1]))+1;
  const unit=Math.min(25,cell*.58);
  const source=useRef<View>(null), center=useRef({x:0,y:0}), held=useRef(false), alive=useRef(true), measured=useRef(false), pointer=useRef({x:0,y:0});
  const [offset]=useState(()=>new Animated.ValueXY()), [scale]=useState(()=>new Animated.Value(motionReduced?1:.78));
  const [dragging,setDragging]=useState(false);
  const callbacks=useRef({blocked,onSelect,onDrag,onDrop,motionReduced,lift,ratio:cell/unit});
  useEffect(()=>{callbacks.current={blocked,onSelect,onDrag,onDrop,motionReduced,lift,ratio:cell/unit};},[blocked,onSelect,onDrag,onDrop,motionReduced,lift,cell,unit]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;held.current=false;offset.stopAnimation();scale.stopAnimation();};},[offset,scale]);
  useEffect(()=>{const animation=Animated.timing(scale,{toValue:1,duration:110,easing:Easing.out(Easing.cubic),useNativeDriver:true});if(motionReduced)scale.setValue(1);else animation.start();return()=>animation.stop();},[scale,motionReduced]);
  const returnHome=()=>{
    held.current=false;
    const options={useNativeDriver:true,duration:115,easing:Easing.out(Easing.cubic)};
    if(callbacks.current.motionReduced){offset.setValue({x:0,y:0});scale.setValue(1);setDragging(false);return;}
    Animated.parallel([Animated.timing(offset,{...options,toValue:{x:0,y:0}}),Animated.timing(scale,{...options,toValue:1})]).start(({finished})=>{if(finished&&alive.current&&!held.current)setDragging(false);});
  };
  // eslint-disable-next-line react-hooks/refs
  const [responder]=useState(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>!callbacks.current.blocked,
    onMoveShouldSetPanResponder:()=>!callbacks.current.blocked,
    onPanResponderTerminationRequest:()=>false,
    onPanResponderGrant:(event)=>{
      held.current=true;measured.current=false;setDragging(true);callbacks.current.onSelect();
      pointer.current={x:event.nativeEvent.pageX,y:event.nativeEvent.pageY};offset.stopAnimation();scale.stopAnimation();
      if(!callbacks.current.motionReduced)void Haptics.selectionAsync().catch(()=>{});
      source.current?.measureInWindow((x,y,w,h)=>{
        if(!held.current)return;center.current={x:x+w/2,y:y+h/2};measured.current=true;
        const destination=followOffset(pointer.current,center.current,callbacks.current.lift);
        if(callbacks.current.motionReduced){offset.setValue(destination);scale.setValue(callbacks.current.ratio);}
        else Animated.parallel([
          Animated.timing(offset,{toValue:destination,duration:60,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
          Animated.timing(scale,{toValue:callbacks.current.ratio,duration:60,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
        ]).start();
      });
    },
    onPanResponderMove:(_e,g)=>{
      pointer.current={x:g.moveX,y:g.moveY};if(!measured.current)return;
      offset.stopAnimation();scale.stopAnimation();scale.setValue(callbacks.current.ratio);
      offset.setValue(followOffset(pointer.current,center.current,callbacks.current.lift));
      callbacks.current.onDrag(g.moveX,g.moveY);
    },
    onPanResponderRelease:(_e,g)=>{
      const moved=Math.abs(g.dx)+Math.abs(g.dy)>8;
      const accepted=moved&&!callbacks.current.blocked&&callbacks.current.onDrop(g.moveX,g.moveY);
      if(accepted){held.current=false;setDragging(false);offset.stopAnimation();scale.stopAnimation();}
      else returnHome();
    },
    onPanResponderTerminate:()=>{callbacks.current.onDrop(-1000,-1000);returnHome();},
  }));
  return <View ref={source} {...responder.panHandlers} accessible accessibilityRole="button" accessibilityLabel={`${translate('Фигура',language)} ${slot+1}`} accessibilityState={{selected,disabled:blocked}} onAccessibilityTap={onSelect} style={[s.slot,{zIndex:dragging?10:1,opacity:blocked||unavailable&&!dragging?.35:1}]}>
    <Animated.View pointerEvents="none" style={{width:cols*unit,height:rows*unit,transform:[...offset.getTranslateTransform(),{scale}],shadowColor:'#000',shadowOpacity:dragging?.22:0,shadowRadius:12,shadowOffset:{width:0,height:8}}}>
      {cells.map(([r,c])=><View key={`${r}:${c}`} style={{position:'absolute',top:r*unit+2*unit/cell,left:c*unit+2*unit/cell,width:unit-4*unit/cell,height:unit-4*unit/cell,borderRadius:unit*.17,backgroundColor:colors.textPrimary,borderWidth:selected&&!dragging?1:0,borderColor:colors.textMuted}}/>)}
    </Animated.View>
  </View>;
}

export function BlocksScreen({profileId}:{profileId:string}) {
  const {colors,mode}=useTheme(); const {width,height}=useWindowDimensions(); const {motionReduced,language}=usePreferences();
  const [game,setGame]=useState<BlocksGame|null>(null), [selected,setSelected]=useState<number|null>(null), [target,setTarget]=useState<Target|null>(null);
  const [sheet,setSheet]=useState(false), [loadError,setLoadError]=useState(false), [saveError,setSaveError]=useState(false), [retry,setRetry]=useState(0), [cleared,setCleared]=useState<number[]>([]), [placed,setPlaced]=useState<number[]>([]);
  const [endVisible,setEndVisible]=useState(false), [reward,setReward]=useState({points:0,combo:0});
  const current=useRef<BlocksGame|null>(null), mounted=useRef(true), revision=useRef(0), board=useRef<View>(null), origin=useRef({x:0,y:0});
  const snap=useRef<Target|null>(null);
  const [flash]=useState(()=>new Animated.Value(0)), [pop]=useState(()=>new Animated.Value(1)), [pulse]=useState(()=>new Animated.Value(1));
  const [rewardProgress]=useState(()=>new Animated.Value(1));
  const clearAnimation=useRef<Animated.CompositeAnimation|null>(null);
  useEffect(()=>()=>{clearAnimation.current?.stop();flash.stopAnimation();pop.stopAnimation();pulse.stopAnimation();rewardProgress.stopAnimation();},[flash,pop,pulse,rewardProgress]);
  useEffect(()=>{mounted.current=true; let active=true; void loadBlocks(profileId).then(value=>{if(active){current.current=value;setGame(value);setLoadError(false);}}).catch(()=>{if(active)setLoadError(true);}); return()=>{active=false;mounted.current=false;};},[profileId,retry]);
  const persist=(value:BlocksGame)=>{const version=++revision.current; void saveBlocks(profileId,value).then(()=>{if(mounted.current&&version===revision.current)setSaveError(false);}).catch(()=>{if(mounted.current&&version===revision.current)setSaveError(true);});};
  const size=Math.min(width-32,420,Math.max(224,height-330)), cell=size/8;
  const measure=()=>board.current?.measureInWindow((x,y)=>{origin.current={x,y};});
  const commit=(slot:number,row:number,col:number)=>{
    const previous=current.current; if(!previous||sheet)return false;
    const result=place(previous,slot,row,col); if(!result)return false;
    const shape=previous.pieces[slot]!;
    current.current=result.game; setGame(result.game);setSelected(null);setTarget(null);persist(result.game);
    setPlaced(SHAPES[shape].map(([r,c])=>(row+r)*8+col+c).filter(i=>!result.cleared.includes(i)));
    pop.stopAnimation();pop.setValue(motionReduced?1:.86);
    if(!motionReduced)Animated.spring(pop,{toValue:1,damping:24,stiffness:520,mass:.45,useNativeDriver:true}).start();
    if(result.cleared.length){
      setReward({points:result.gained,combo:result.game.combo});rewardProgress.stopAnimation();rewardProgress.setValue(0);
      Animated.timing(rewardProgress,{toValue:1,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
      setCleared(result.cleared);clearAnimation.current?.stop();flash.setValue(1);
      clearAnimation.current=Animated.sequence([Animated.delay(motionReduced?0:60),Animated.timing(flash,{toValue:0,duration:motionReduced?0:280,useNativeDriver:true})]);clearAnimation.current.start();
      pulse.stopAnimation();pulse.setValue(motionReduced?1:1.025);
      if(!motionReduced)Animated.spring(pulse,{toValue:1,damping:16,stiffness:260,mass:.7,useNativeDriver:true}).start();
    }
    if(!motionReduced)void Haptics.impactAsync(result.lines?Haptics.ImpactFeedbackStyle.Light:Haptics.ImpactFeedbackStyle.Soft).catch(()=>{});
    return true;
  };
  const locate=(slot:number,x:number,y:number):Target|null=>{
    const shape=current.current?.pieces[slot]; if(shape==null)return null;
    const next=magneticTarget(current.current!.board,shape,cell,origin.current,{x,y},snap.current?.slot===slot?snap.current:null);
    return next?{slot,...next}:null;
  };
  const chooseCell=(slot:number,row:number,col:number)=>{
    const value=current.current, shape=value?.pieces[slot];if(!value||shape==null)return;
    const next=magneticTarget(value.board,shape,cell,origin.current,snappedPointer(shape,cell,origin.current,{row,col}));
    if(next)commit(slot,next.row,next.col);
  };
  const lost=!!game&&!canPlay(game);
  useEffect(()=>{if(!lost)return;const timer=setTimeout(()=>setEndVisible(true),motionReduced?0:400);return()=>clearTimeout(timer);},[lost,motionReduced]);
  const previewShape=target&&game?.pieces[target.slot];
  const valid=!!target&&previewShape!=null&&!!game&&fits(game.board,previewShape,target.row,target.col);
  const preview=target&&previewShape!=null?SHAPES[previewShape].map(([r,c])=>(target.row+r)*8+target.col+c):[];
  const clearPreview=valid&&target&&previewShape!=null&&game?previewPlacement(game.board,previewShape,target.row,target.col)?.cleared||[]:[];
  const restart=()=>{const next=newBlocks(current.current?.best||0);current.current=next;setGame(next);setSelected(null);setTarget(null);setCleared([]);setPlaced([]);clearAnimation.current?.stop();flash.setValue(0);pulse.stopAnimation();pulse.setValue(1);rewardProgress.stopAnimation();rewardProgress.setValue(1);setEndVisible(false);setSheet(false);persist(next);};
  return <ScreenSafeArea edges={['top','bottom','left','right']} style={{flex:1,backgroundColor:colors.canvas}}>
    <View style={s.header}><GlassTool label="Назад" onPress={()=>router.canGoBack()?router.back():router.replace('/games')}><ChevronLeft size={22} color={colors.textPrimary}/></GlassTool><Text translate={false} style={[s.title,{color:colors.textPrimary}]}>Block Blast</Text><GlassTool label="Новая игра" onPress={()=>setSheet(true)}><RotateCcw size={20} color={colors.textPrimary}/></GlassTool></View>
    {!game?<View style={s.center}>{loadError?<Pressable onPress={()=>setRetry(v=>v+1)}><Text style={{color:colors.textPrimary}}>Не удалось открыть игру. Нажмите, чтобы повторить.</Text></Pressable>:<ActivityIndicator color={colors.textPrimary}/>}</View>:<View style={s.center}>
      <View style={[s.stats,{width:size,alignItems:'center'}]}>
        <Animated.View style={{transform:[{scale:pulse}]}}><Text style={{color:colors.textMuted,fontSize:12}}>Счёт</Text><Text translate={false} style={{color:colors.textPrimary,fontSize:42,fontWeight:'600',fontVariant:['tabular-nums']}}>{game.score}</Text></Animated.View>
        {(game.combo||0)>1&&<View style={{alignItems:'center'}}><Text style={{color:colors.textMuted,fontSize:12}}>Комбо</Text><Text translate={false} style={{color:colors.textPrimary,fontSize:24,fontWeight:'600'}}>×{game.combo}</Text></View>}
        <View style={{alignItems:'flex-end'}}><View style={{flexDirection:'row',gap:5,alignItems:'center'}}><Trophy size={13} color={colors.textMuted}/><Text style={{color:colors.textMuted,fontSize:12}}>Рекорд</Text></View><Text translate={false} style={{color:colors.textPrimary,fontSize:24,fontWeight:'600',fontVariant:['tabular-nums']}}>{game.best}</Text></View>
      </View>
      <View style={{width:size,height:size}}>
      <Animated.View ref={board} onLayout={measure} style={{width:size,height:size,backgroundColor:colors.cardBg,borderRadius:18,overflow:'hidden'}}>
        {game.board.map((value,i)=>{const highlighted=valid&&preview.includes(i); return <Pressable key={i} accessibilityLabel={`${translate('Клетка',language)} ${Math.floor(i/8)+1}, ${i%8+1}`} accessibilityRole="button" disabled={selected===null||lost||sheet} onPress={()=>{if(selected!==null)chooseCell(selected,Math.floor(i/8),i%8);}} style={{position:'absolute',left:(i%8)*cell+2,top:Math.floor(i/8)*cell+2,width:cell-4,height:cell-4,borderRadius:Math.min(7,cell*.17),backgroundColor:clearPreview.includes(i)?colors.textSecondary:(value&&!placed.includes(i))||highlighted?colors.textPrimary:mode==='dark'?'#242625':'#E5E5E5',opacity:highlighted?.45:1}}/>;})}
        {placed.map(i=><Animated.View pointerEvents="none" key={`placed:${i}`} style={{position:'absolute',left:(i%8)*cell+2,top:Math.floor(i/8)*cell+2,width:cell-4,height:cell-4,borderRadius:Math.min(7,cell*.17),backgroundColor:clearPreview.includes(i)?colors.textSecondary:colors.textPrimary,transform:[{scale:pop}]}}/>)}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:flash}]}>{cleared.map(i=><Animated.View key={i} style={{position:'absolute',left:(i%8)*cell+2,top:Math.floor(i/8)*cell+2,width:cell-4,height:cell-4,borderRadius:7,backgroundColor:colors.textPrimary,transform:[{scale:flash.interpolate({inputRange:[0,1],outputRange:[.3,1.06]})}]}}/>)}</Animated.View>
      </Animated.View>
      <Animated.View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',top:size*.28,left:0,right:0,alignItems:'center',opacity:rewardProgress.interpolate({inputRange:[0,.12,.7,1],outputRange:[0,1,1,0]}),transform:[{translateY:motionReduced?0:rewardProgress.interpolate({inputRange:[0,1],outputRange:[12,-25]})}]}}>
        <View style={{backgroundColor:colors.canvasElevated,paddingHorizontal:20,paddingVertical:10,borderRadius:20}}><Text translate={false} style={{color:colors.textPrimary,fontSize:30,fontWeight:'700',textAlign:'center'}}>+{reward.points}</Text>{reward.combo>1&&<View style={{flexDirection:'row',gap:5,justifyContent:'center'}}><Text style={{color:colors.textSecondary,fontSize:13}}>Комбо</Text><Text translate={false} style={{color:colors.textSecondary,fontSize:13}}>×{reward.combo}</Text></View>}</View>
      </Animated.View>
      </View>
      <View style={[s.tray,{width:size}]}>{game.pieces.map((shape,slot)=>shape===null?<View key={`used:${slot}`} style={s.slot}/>:<Piece key={`${Math.floor(game.moves/3)}:${slot}`} shape={shape} slot={slot} selected={selected===slot} cell={cell} lift={pieceLift(shape,cell)} blocked={lost||sheet} unavailable={!legalPlaces(game.board,shape).length} onSelect={()=>{measure();snap.current=null;setTarget(null);setSelected(slot);}} onDrag={(x,y)=>{const next=locate(slot,x,y);snap.current=next;setTarget(previous=>previous?.row===next?.row&&previous?.col===next?.col&&previous?.slot===next?.slot?previous:next);}} onDrop={(x,y)=>{const t=locate(slot,x,y);const accepted=!!t&&commit(slot,t.row,t.col);snap.current=null;setTarget(null);return accepted;}}/>)}</View>
      <View style={{height:72,alignItems:'center',justifyContent:'center'}}>{lost?<Pressable onPress={()=>setEndVisible(true)} style={[s.finish,{backgroundColor:colors.cardBg}]}><Text style={{color:colors.textPrimary,fontSize:18,fontWeight:'600'}}>Ходов больше нет</Text><Text style={{color:colors.textSecondary,marginTop:5}}>Ещё раз</Text></Pressable>:game.moves===0&&<Text style={{color:colors.textMuted,fontSize:12,textAlign:'center',maxWidth:size}}>Перетащите фигуру или выберите её и нажмите на клетку.</Text>}</View>
      {saveError&&<Pressable onPress={()=>{if(current.current)persist(current.current);}}><Text style={{color:colors.danger,fontSize:12,marginTop:8}}>Не удалось сохранить игру. Нажмите, чтобы повторить.</Text></Pressable>}
    </View>}
    <GlassModal visible={sheet} onClose={()=>setSheet(false)}><Text style={{color:colors.textPrimary,fontSize:23,fontWeight:'600'}}>Новая игра</Text><Text style={{color:colors.textSecondary,marginTop:12}}>Текущая партия будет сброшена. Рекорд сохранится.</Text><Pressable onPress={restart} style={[s.finish,{backgroundColor:colors.textPrimary,marginTop:20}]}><Text style={{color:colors.onAccent,fontWeight:'600'}}>Начать заново</Text></Pressable></GlassModal>
    <GlassModal visible={endVisible&&lost&&!sheet} onClose={()=>setEndVisible(false)}><Text style={{color:colors.textPrimary,fontSize:24,fontWeight:'600'}}>Ходов больше нет</Text><Text translate={false} style={{color:colors.textPrimary,fontSize:52,fontWeight:'600',marginVertical:18}}>{game?.score||0}</Text><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:colors.textSecondary}}>Рекорд</Text><Text translate={false} style={{color:colors.textPrimary}}>{game?.best||0}</Text></View><Pressable onPress={restart} style={[s.finish,{backgroundColor:colors.textPrimary,marginTop:24}]}><Text style={{color:colors.onAccent,fontWeight:'600'}}>Ещё раз</Text></Pressable></GlassModal>
  </ScreenSafeArea>;
}
const s=StyleSheet.create({header:{height:72,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:22,fontWeight:'600'},center:{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:12},stats:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:8,marginBottom:20},tray:{flexDirection:'row',height:120,alignItems:'center',zIndex:2},slot:{flex:1,minHeight:88,alignItems:'center',justifyContent:'center'},finish:{padding:16,borderRadius:18,alignItems:'center',minWidth:200}});
