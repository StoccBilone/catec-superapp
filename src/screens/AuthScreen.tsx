import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, Pressable, Alert } from '../components/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, ChevronDown, Delete, LockKeyhole } from 'lucide-react-native';
import { UserProfile } from '../types';
import { CATEC_GROUPS } from '../data/catecData';
import { useTheme } from '../theme/themeContext';
import { authPalette } from '../theme/authTheme';
import { usePreferences } from '../context/PreferencesContext';
import { CatecAvatar } from '../components/CatecAvatar';
import { GlassModal } from '../components/GlassModal';

interface AuthScreenProps {
  existingProfile: UserProfile | null;
  onSuccessLogin: (profile: UserProfile) => Promise<void>;
  onRegisterNew: (profile: UserProfile) => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  existingProfile,
  onSuccessLogin,
  onRegisterNew,
}) => {
  const { mode } = useTheme();
  const colors = authPalette(mode);
  const { motionReduced } = usePreferences();
  const [welcome, setWelcome] = useState(true);
  const [groupPicker, setGroupPicker] = useState(false);
  const [formError, setFormError] = useState('');
  const [entrance] = useState(() => new Animated.Value(0));

  // State
  const [isRegisterMode, setIsRegisterMode] = useState(!existingProfile);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // PIN login state
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState(false);

  // Success modal after registration
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [registeredProfile, setRegisteredProfile] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const entering = useRef(false);
  const alive = useRef(true);
  const pinReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { entrance.setValue(0); const animation = Animated.timing(entrance, { toValue: 1, duration: motionReduced ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }); animation.start(); return () => animation.stop(); }, [entrance, motionReduced, isRegisterMode, welcome]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; if (pinReset.current) clearTimeout(pinReset.current); }; }, []);
  const login = async (profile: UserProfile, register = false) => {
    if (entering.current) return;
    entering.current = true; setSubmitting(true);
    try { await (register ? onRegisterNew(profile) : onSuccessLogin(profile)); }
    catch { if (!alive.current) return; setPinDigits(''); Alert.alert('Не удалось войти', 'Проверьте подключение к интернету и попробуйте ещё раз.'); }
    finally { entering.current = false; if (alive.current) setSubmitting(false); }
  };

  const handleKeyPress = (num: string) => {
    if (submitting || pinDigits.length >= 4) return;
    try {
      void Haptics.selectionAsync().catch(() => {});
    } catch {}

    if (pinReset.current) clearTimeout(pinReset.current);
    const next = pinDigits + num;
    setPinDigits(next);
    setPinError(false);

    if (next.length === 4) {
      // Validate
      if (existingProfile && next === existingProfile.passCode) {
        try {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch {}
        void login(existingProfile);
      } else {
        try {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } catch {}
        setPinError(true);
        pinReset.current = setTimeout(() => {
          setPinDigits('');
          setPinError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    if (submitting || pinDigits.length === 0) return;
    try {
      void Haptics.selectionAsync().catch(() => {});
    } catch {}
    if (pinReset.current) clearTimeout(pinReset.current);
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleRegisterSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !CATEC_GROUPS.some(group => group.name === selectedGroup)) {
      setFormError('Введите имя, фамилию и выберите учебную группу.');
      return;
    }

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}

    setFormError('');
    Keyboard.dismiss();
    // Generate a device PIN; the cloud assigns the public student ID.
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const groupMeta = CATEC_GROUPS.find((g) => g.name === selectedGroup) || CATEC_GROUPS[0];

    const newProfile: UserProfile = {
      id: `std-${Date.now()}`,
      fullName: `${lastName.trim()} ${firstName.trim()}`,
      role: 'student',
      group: selectedGroup,
      studentId: randomCode,
      passCode: randomCode,
      course: groupMeta.course,
      faculty: 'Отделение информационных технологий ЦАТЭК',
      averageGrade: 4.82,
      attendancePercent: 96,
      bannerId: 'catec_blue',
    };

    setGeneratedCode(randomCode);
    setRegisteredProfile(newProfile);
  };

  const handleFinishRegistration = () => {
    if (registeredProfile) {
      void login(registeredProfile, true);
    }
  };

  const canRegister = !!firstName.trim() && !!lastName.trim() && !!selectedGroup;
  const brand = <View style={s.brand}><View style={s.logo}><Image source={require('../../assets/catec-logo.png')} resizeMode="contain" accessibilityLabel="ЦАТЭК" style={s.logoImage}/></View><Text translate={false} style={[s.wordmark,{color:colors.text}]}>CATEC SuperApp</Text></View>;

  return <View style={{flex:1,backgroundColor:colors.background}}>
    <LinearGradient pointerEvents="none" colors={[colors.wash,colors.fade,colors.background]} locations={[0,.48,1]} style={[s.topWash,{height:welcome?460:300}]}/>
    <Animated.View style={{flex:1,opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[motionReduced?0:12,0]})}]}}>
      <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.content}>
        {welcome ? <View style={s.welcome}>
          {brand}
          <View style={s.welcomeAvatar}><CatecAvatar size={212} pose="welcome"/></View>
          <Text accessibilityRole="header" style={[s.heading,s.center,{color:colors.text}]}>Добро пожаловать в CATEC</Text>
          <Text style={[s.subtitle,s.center,{color:colors.secondary}]}>Расписание, новости и общение — в одном приложении.</Text>
          <View style={s.welcomeActions}><AuthAction title="Начать" onPress={()=>{setIsRegisterMode(true);setWelcome(false);}} submitting={false} colors={colors}/>
          {existingProfile&&<Pressable accessibilityRole="button" onPress={()=>{setIsRegisterMode(false);setWelcome(false);}} style={s.textButton}><Text style={{color:colors.action,fontSize:15,fontWeight:'600'}}>Войти по коду</Text></Pressable>}</View>
        </View> : <>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" disabled={submitting} onPress={()=>{Keyboard.dismiss();setWelcome(true);setPinDigits('');setPinError(false);}} style={[s.back,{backgroundColor:'rgba(255,255,255,0.16)',borderColor:'rgba(255,255,255,0.32)'}]}><ArrowLeft size={22} color={colors.onAction}/></Pressable>
        <View style={s.formAvatar}><CatecAvatar size={112} pose="neutral"/></View>
        <View style={[s.panel,{backgroundColor:colors.surface}]}>
        {!isRegisterMode && existingProfile ? <>
          <Text accessibilityRole="header" style={[s.heading,{color:colors.text,textAlign:'center'}]}>С возвращением</Text>
          <Text translate={false} style={[s.subtitle,{color:colors.secondary,textAlign:'center'}]}>{existingProfile.fullName}</Text>
          <Text translate={false} style={{color:colors.secondary,textAlign:'center',fontSize:14,marginTop:4}}>{existingProfile.group}</Text>
          <View accessibilityLabel="Код входа" style={s.dots}>{[0,1,2,3].map(index=><View key={index} style={[s.dot,{borderColor:pinError?colors.danger:colors.accent,backgroundColor:index<pinDigits.length?(pinError?colors.danger:colors.accent):'transparent'}]}/>)}</View>
          <View style={s.pinFeedback}><Text accessibilityLiveRegion="polite" style={{color:pinError?colors.danger:colors.secondary,fontSize:14,textAlign:'center'}}>{submitting?'Входим…':pinError?'Неверный код. Попробуйте снова.':'Введите 4-значный код'}</Text></View>
          <View style={s.keypad}>{[['1','2','3'],['4','5','6'],['7','8','9'],['','0','del']].map((row,index)=><View key={index} style={s.keyRow}>{row.map((key,column)=>key?<Pressable key={key} accessibilityRole="button" accessibilityLabel={key==='del'?'Удалить цифру':key} disabled={submitting} onPress={()=>key==='del'?handleDelete():handleKeyPress(key)} style={({pressed})=>[s.key,{backgroundColor:pressed?colors.selected:colors.surface,borderColor:colors.border,opacity:submitting?.5:1}]}>{key==='del'?<Delete size={24} color={colors.text}/>:<Text translate={false} style={{color:colors.text,fontSize:28,fontWeight:'400'}}>{key}</Text>}</Pressable>:<View key={column} style={s.keyEmpty}/>)}</View>)}</View>
          <Pressable disabled={submitting} accessibilityRole="button" onPress={()=>{setIsRegisterMode(true);setPinDigits('');setPinError(false);}} style={s.textButton}><Text style={{color:colors.action,fontSize:14,fontWeight:'600'}}>Регистрация другого студента</Text></Pressable>
        </>:<>
          <Text accessibilityRole="header" style={[s.heading,{color:colors.text}]}>Создать профиль</Text>
          <Text style={[s.subtitle,{color:colors.secondary}]}>Укажите имя и учебную группу.</Text>
          <View style={s.form}>
            <Text style={[s.label,{color:colors.text}]}>Фамилия</Text>
            <TextInput accessibilityLabel="Фамилия" value={lastName} onChangeText={value=>{setLastName(value);setFormError('');}} maxLength={48} autoComplete="family-name" textContentType="familyName" autoCorrect={false} placeholder="Ваша фамилия" placeholderTextColor={colors.secondary} style={[s.input,{backgroundColor:colors.input,borderColor:colors.input,color:colors.text}]}/>
            <Text style={[s.label,{color:colors.text}]}>Имя</Text>
            <TextInput accessibilityLabel="Имя" value={firstName} onChangeText={value=>{setFirstName(value);setFormError('');}} maxLength={48} autoComplete="given-name" textContentType="givenName" autoCorrect={false} placeholder="Ваше имя" placeholderTextColor={colors.secondary} style={[s.input,{backgroundColor:colors.input,borderColor:colors.input,color:colors.text}]}/>
            <Text style={[s.label,{color:colors.text}]}>Учебная группа</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Выбрать учебную группу" accessibilityState={{expanded:groupPicker}} onPress={()=>{Keyboard.dismiss();setGroupPicker(true);}} style={({pressed})=>[s.input,s.groupField,{backgroundColor:pressed?colors.selected:colors.input,borderColor:colors.border}]}><Text translate={false} style={{color:selectedGroup?colors.text:colors.secondary,fontSize:16,flex:1}}>{selectedGroup||'Выберите группу'}</Text><ChevronDown size={20} color={colors.secondary}/></Pressable>
            <Text style={{color:colors.secondary,fontSize:13,lineHeight:19,marginTop:10}}>Группа закрепляется при регистрации.</Text>
            {!!formError&&<Text accessibilityLiveRegion="polite" style={{color:colors.danger,fontSize:14,marginTop:12}}>{formError}</Text>}
          </View>
          <AuthAction title="Получить код входа" onPress={handleRegisterSubmit} disabled={!canRegister} submitting={submitting} colors={colors}/>
          <View style={s.privacy}><LockKeyhole size={16} color={colors.secondary}/><Text style={{flex:1,color:colors.secondary,fontSize:13,lineHeight:19}}>Четыре цифры для быстрого входа на этом устройстве.</Text></View>
          {existingProfile&&<Pressable accessibilityRole="button" onPress={()=>setIsRegisterMode(false)} style={s.textButton}><Text style={{color:colors.action,fontSize:14,fontWeight:'600'}}>Войти по коду</Text></Pressable>}
        </>}
        </View>
        </>}
        </View>
      </ScrollView>
    </Animated.View>
    <GlassModal visible={groupPicker} onClose={()=>setGroupPicker(false)}><Text accessibilityRole="header" style={[s.modalTitle,{color:colors.text}]}>Учебная группа</Text><Text style={{color:colors.secondary,fontSize:14,marginBottom:16}}>Выберите свою группу</Text>{CATEC_GROUPS.map(group=><Pressable accessibilityRole="radio" accessibilityState={{checked:selectedGroup===group.name}} key={group.id} onPress={()=>{setSelectedGroup(group.name);setFormError('');setGroupPicker(false);void Haptics.selectionAsync().catch(()=>{});}} style={({pressed})=>[s.groupOption,{backgroundColor:selectedGroup===group.name||pressed?colors.selected:'transparent',borderColor:colors.border}]}><View style={{flex:1}}><Text translate={false} style={{color:colors.text,fontSize:17,fontWeight:'600'}}>{group.name}</Text><Text translate={false} style={{color:colors.secondary,fontSize:13,lineHeight:18,marginTop:4}}>{group.specialty}</Text></View>{selectedGroup===group.name&&<Check size={22} color={colors.action}/>}</Pressable>)}</GlassModal>
    <GlassModal visible={!!generatedCode} onClose={()=>{if(!submitting){setGeneratedCode(null);setRegisteredProfile(null);}}}><View style={s.codeContent}><View style={s.codeAvatar}><CatecAvatar size={132} pose="pass"/></View><Text accessibilityRole="header" style={[s.modalTitle,{color:colors.text,textAlign:'center'}]}>Сохраните код входа</Text><Text style={{color:colors.secondary,textAlign:'center',fontSize:15,lineHeight:22}}>Он понадобится для входа на этом устройстве.</Text><View style={[s.codeBox,{backgroundColor:colors.selected}]}><Text translate={false} style={{color:colors.accent,fontSize:42,fontWeight:'600',letterSpacing:10,fontVariant:['tabular-nums']}}>{generatedCode}</Text></View><Text translate={false} style={{color:colors.secondary,fontSize:14,marginBottom:24}}>{registeredProfile?.fullName} · {registeredProfile?.group}</Text><View style={{width:'100%'}}><AuthAction title="Создать профиль" onPress={handleFinishRegistration} submitting={submitting} colors={colors}/></View></View></GlassModal>
  </View>;
};

function AuthAction({title,onPress,disabled=false,submitting,colors}:{title:string;onPress:()=>void;disabled?:boolean;submitting:boolean;colors:ReturnType<typeof authPalette>}) {
  return <Pressable accessibilityRole="button" disabled={disabled||submitting} onPress={onPress} style={({pressed})=>[s.action,{backgroundColor:colors.action,opacity:disabled?.45:pressed?.8:1}]}>{submitting?<ActivityIndicator color={colors.onAction}/>:<Text style={{color:colors.onAction,fontSize:16,fontWeight:'600'}}>{title}</Text>}</Pressable>;
}
const s=StyleSheet.create({
  topWash:{position:'absolute',top:0,left:0,right:0},scroll:{flexGrow:1,paddingHorizontal:20,paddingTop:16,paddingBottom:40},content:{width:'100%',maxWidth:440,alignSelf:'center'},
  center:{textAlign:'center'},welcome:{minHeight:660,justifyContent:'center',paddingHorizontal:4,paddingBottom:12},welcomeAvatar:{alignItems:'center',marginBottom:24},welcomeActions:{marginTop:36},formAvatar:{alignItems:'center',marginTop:-28,marginBottom:24},panel:{borderRadius:28,padding:20},back:{width:44,height:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center',marginBottom:8},brand:{alignItems:'center',marginBottom:24},logo:{width:120,height:62,backgroundColor:'#FFFFFF',borderRadius:16,padding:10},logoImage:{width:'100%',height:'100%'},wordmark:{fontSize:17,fontWeight:'600',marginTop:12},
  heading:{fontSize:27,lineHeight:33,fontWeight:'700',letterSpacing:-.65},subtitle:{fontSize:15,lineHeight:22,marginTop:8},form:{marginTop:12,marginBottom:24},label:{fontSize:13,fontWeight:'600',marginBottom:8,marginTop:16},input:{minHeight:56,borderWidth:1,borderRadius:20,paddingHorizontal:16,paddingVertical:14,fontSize:16},groupField:{flexDirection:'row',alignItems:'center',gap:12},
  action:{minHeight:56,borderRadius:28,alignItems:'center',justifyContent:'center',paddingHorizontal:20,paddingVertical:16},privacy:{flexDirection:'row',alignItems:'flex-start',gap:10,marginTop:18},textButton:{minHeight:48,alignItems:'center',justifyContent:'center',marginTop:16,padding:8},
  dots:{flexDirection:'row',gap:20,justifyContent:'center',marginTop:28},dot:{width:16,height:16,borderRadius:8,borderWidth:1.5},pinFeedback:{minHeight:42,justifyContent:'center',marginTop:12},keypad:{width:'100%',maxWidth:288,alignSelf:'center',gap:12,marginTop:16},keyRow:{flexDirection:'row',justifyContent:'space-between'},key:{width:76,height:68,borderRadius:24,borderWidth:1,justifyContent:'center',alignItems:'center'},keyEmpty:{width:76,height:68},
  modalTitle:{fontSize:24,fontWeight:'600',lineHeight:30,marginBottom:10},groupOption:{minHeight:72,padding:14,borderRadius:16,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center',gap:12,marginBottom:6},codeContent:{alignItems:'center',paddingTop:4},codeAvatar:{alignItems:'center',marginBottom:20},codeBox:{paddingHorizontal:26,paddingVertical:18,borderRadius:20,marginVertical:24}
});
