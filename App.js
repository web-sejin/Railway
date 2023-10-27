import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Button,
  Dimensions,
  LogBox,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  useColorScheme,
  View,
  Platform,
  Alert,
  TouchableOpacity,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import SplashScreen from 'react-native-splash-screen';
import {check, checkMultiple, PERMISSIONS, RESULTS, request, requestMultiple} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import { CALL_PERMISSIONS_NOTI, usePermissions } from './hooks/usePermissions'; 

const widnowHeight = Dimensions.get('window').height;
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

let codePopState = false;
let leavePopState = false;
let agreePopState = false;
let privacyPopState = false;
let regiChkPopState = false;

const App = () => {
  let { height, width } = Dimensions.get('window');

  const app_domain = "https://cnj05.cafe24.com";  
  const url = app_domain+"?chk_app=Y&app_token=";

  const [urls, set_urls] = useState("ss");
  const [appToken, setAppToken] = useState();
  const webViews = useRef();
  const [is_loading, set_is_loading] = useState(false);
  const [stateColor, setStateColor] = useState("#28305B");

  let canGoBack = false;
  let timeOut;

  useEffect(() => { 
    setTimeout(function(){SplashScreen.hide();}, 1500);     
  }, []);

  //권한
  if(Platform.OS == 'android'){
    usePermissions(CALL_PERMISSIONS_NOTI);
  }  

  //토큰값 구하기
  useEffect(() => {
    PushNotification.setApplicationIconBadgeNumber(0);

    async function requestUserPermission() {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            //console.log('Authorization status:', authStatus);
        if (enabled) {
            //console.log('Authorization status:', authStatus);
            await get_token();
        }
    }

    //기기토큰 가져오기
    async function get_token() {
        await messaging()
            .getToken()
            .then(token => {
                //console.log("appToken", token);
                if(token) {
                  setAppToken(token);
                    return true;
                } else {
                    return false;
                }
            });
    }

    requestUserPermission();

    set_is_loading(true);

    return messaging().onTokenRefresh(token => {
      setAppToken(token);
    });
  } ,[]);

  function fnPopState(pop_id, type){
    if(pop_id == "code_pop"){
      codePopState = type;
    }else if(pop_id == "leave_pop"){
      leavePopState = type;
    }else if(pop_id == "agree_pop"){
      agreePopState = type;
    }else if(pop_id == "privacy_pop"){
      privacyPopState = type;
    }else if(pop_id == "regi_chk_pop"){
      regiChkPopState = type;
    }
  }

  //포스트메세지 (웹 -> 앱)
  const onWebViewMessage = (webViews) => {
    let jsonData = JSON.parse(webViews.nativeEvent.data);
    console.log("jsonData.data : ", jsonData.data);
    if(jsonData.data == "popup"){      
      fnPopState(jsonData.pop_id, jsonData.type);
    }
  }

  const onNavigationStateChange = (webViewState)=>{
    set_urls(webViewState.url);
    
    //console.log("webViewState.url : ", webViewState.url);
    //console.log(" :::::::::::: ", webViewState.url.indexOf("login.php"));
    if(webViewState.url.indexOf("index.php") >=0 || webViewState.url.indexOf("login.php") >= 0){
      setStateColor("#28305B");
    }else{
      setStateColor("#2E88A8");
    }

    codePopState = false;
    leavePopState = false;
    agreePopState = false;
    privacyPopState = false;
    regiChkPopState = false;

    //웹에 chk_app 세션 유지 위해 포스트메시지 작성
    const chkAppData =JSON.stringify({
      type: "chk_app_token",
      isapp: "Y",
      istoken: appToken,
    });
    //webViews.current.postMessage(chkAppData);
  }

  //뒤로가기 버튼
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();

    console.log(urls);
  }, [urls]);

  const backAction = () => {
    const app_split = urls.split('?chk_app=')[0];
    console.log("regiChkPopState : ",regiChkPopState)

  if(codePopState){
    const popOffData =JSON.stringify({ type: "codePopOff" });      
    webViews.current.postMessage(popOffData);
  }else if(leavePopState){
    const popOffData =JSON.stringify({ type: "leavePopOff" });
    webViews.current.postMessage(popOffData);
  }else if(privacyPopState){
    const popOffData =JSON.stringify({ type: "fnPrvOff" });
    webViews.current.postMessage(popOffData);
  }else if(agreePopState){
    const popOffData =JSON.stringify({ type: "agreePopOff" });
    webViews.current.postMessage(popOffData);
  }else if(regiChkPopState){
    const popOffData =JSON.stringify({ type: "chkPopOff" });
    webViews.current.postMessage(popOffData);    
  }else{
    if (
        app_split == app_domain + '/' ||
        app_split == app_domain ||
        urls == app_domain ||
        urls == app_domain + '/' ||
        urls == app_domain + '/index.php' ||
        urls.indexOf("login.php") != -1 ||
        urls.indexOf("index.php") != -1 ||
        urls.indexOf("member_list.php") != -1 ||
        (urls.indexOf("pdf_view.php") != -1 && urls.indexOf("is_recently=") != -1) ||
        urls.indexOf("mypage.php") != -1
    ){     
        if(!canGoBack){ 
            ToastAndroid.show('한번 더 누르면 종료합니다.', ToastAndroid.SHORT);
            canGoBack = true;

            timeOut = setTimeout(function(){
              canGoBack = false;
            }, 2000);
        }else{
            clearTimeout(timeOut);
            BackHandler.exitApp();
            canGoBack = false;
            //const sendData =JSON.stringify({ type:"종료" });

            codePopState = false;
            leavePopState = false;
            agreePopState = false;
            privacyPopState = false;
            regiChkPopState = false;
        }
    }else{
      webViews.current.goBack();
    }
  }

    return true;
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <StatusBar backgroundColor={stateColor} barStyle={"light-content"} />
      {is_loading ? (
      <WebView
        ref={webViews}
        source={{
          uri: url+appToken,
        }}
        useWebKit={false}
        onMessage={webViews => onWebViewMessage(webViews)}
        onNavigationStateChange={(webViews) => onNavigationStateChange(webViews)}
        javaScriptEnabledAndroid={true}
        allowFileAccess={true}
        renderLoading={true}
        mediaPlaybackRequiresUserAction={false}
        setJavaScriptEnabled = {false}
        scalesPageToFit={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        textZoom = {100}
      />
      ) : (        
        <View style={{ height:widnowHeight, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  
});

export default App;
