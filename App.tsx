import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Pressable,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import {
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  PermissionStatus,
  openSettings,
} from 'react-native-permissions';
import {
  IonageWebView,
  handleAndroidBackPress,
  type IonageWebViewRef,
  type IonageMessageType,
  IonageWebViewProps,
} from 'ionage-rnsdk';
import BootSplash from 'react-native-bootsplash';
import Config from 'react-native-config';
import {WebViewNavigation} from 'react-native-webview';

const OPTIONS: IonageWebViewProps['options'] = {
  apikey: '',
};

const INJECTEDJAVASCRIPT =
  "const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta); ";

function App(): JSX.Element {
  const [openWebview, setopenWebview] = useState<boolean>(false);
  const [permissionsStatus, setPermissionsStatus] = useState<{
    camera: boolean;
    location: boolean;
    appTrackingTransparency: boolean;
    loading: boolean;
  }>({
    camera: false,
    location: false,
    appTrackingTransparency: false,
    loading: true,
  });
  const webViewRef = useRef<IonageWebViewRef>(null);

  const backgroundStyle = {
    flex: 1,
    backgroundColor: '#FFFFFF',
  };

  const openSettingsHandler = useCallback(async () => {
    try {
      await openSettings();
    } catch (error) {
      console.log(error);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const STATUS = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA,
      );
      if (STATUS === RESULTS.GRANTED) {
        setPermissionsStatus(prevValue => ({...prevValue, camera: true}));
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const requestAppTrackingTransparency = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const STATUS = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
        if (STATUS === RESULTS.GRANTED) {
          setPermissionsStatus(prevValue => ({
            ...prevValue,
            appTrackingTransparency: true,
          }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      let STATUS: PermissionStatus = RESULTS.DENIED;
      if (Platform.OS === 'ios') {
        STATUS = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      } else if (Platform.OS === 'android') {
        const STATUSES = await requestMultiple([
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ]);
        STATUS = STATUSES[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];
      }
      if (STATUS === RESULTS.GRANTED) {
        setPermissionsStatus(prevValue => ({...prevValue, location: true}));
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const loadRequestHandler = useCallback((event: WebViewNavigation) => {
    if (event.url === 'https://www.ionage.in/privacy-policy') {
      webViewRef.current?.stopLoading();
      return false;
    } else if (event.url === 'https://www.ionage.in/terms-and-conditions') {
      webViewRef.current?.stopLoading();
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    if (permissionsStatus.camera && permissionsStatus.location) {
      setopenWebview(true);
    }
  }, [permissionsStatus]);

  useEffect(() => {
    const initialcall = async () => {
      await BootSplash.hide({fade: true});
      await requestCameraPermission();
      await requestLocationPermission();
      await requestAppTrackingTransparency();
      setPermissionsStatus(prevValue => ({...prevValue, loading: false}));
    };

    initialcall();
  }, [
    requestAppTrackingTransparency,
    requestCameraPermission,
    requestLocationPermission,
  ]);

  // Handle Hardware Back Button for Ionage
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onAndroidBackPress = () => {
        if (webViewRef.current) {
          handleAndroidBackPress(webViewRef.current);
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => {
        BackHandler.removeEventListener(
          'hardwareBackPress',
          onAndroidBackPress,
        );
      };
    }
    return () => {};
  }, [webViewRef]);

  // Handle Messages from Ionage Web
  const onIonageMessageHandler = useCallback(
    async (
      message:
        | IonageMessageType
        | 'ionage_privacy_policy'
        | 'ionage_terms_conditions',
    ) => {
      switch (message) {
        case 'ionage_close_app':
          //hide or close Webview
          // setopenWebview(false);
          break;
        case 'ionage_camera_permission':
          //Ask for Camera Permission for QR Scanner to work
          requestCameraPermission();
          break;
        case 'ionage_location_permission':
          //Ask for Fine Location Permission for Current Location in Maps
          requestLocationPermission();
          break;
        case 'ionage_privacy_policy':
          Linking.openURL(
            Config.PARTNER_PRIVACY_POLICY ||
              'https://www.ionage.in/privacy-policy',
          );
          break;
        case 'ionage_terms_conditions':
          Linking.openURL(
            Config.PARTNER_TERMS_CONDITION ||
              'https://www.ionage.in/terms-and-conditions',
          );
          break;
      }
    },
    [requestCameraPermission, requestLocationPermission],
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {openWebview ? (
        <View style={styles.webViewContainer}>
          <IonageWebView
            geolocationEnabled={true}
            ref={webViewRef}
            //Handle Zoom
            setSupportMultipleWindows={false}
            injectedJavaScript={INJECTEDJAVASCRIPT}
            options={OPTIONS}
            onShouldStartLoadWithRequest={loadRequestHandler} //for iOS
            onNavigationStateChange={loadRequestHandler} //for Android
            onIonageMessageHandler={onIonageMessageHandler}
            source={{
              uri: Config.PARTNER_WEB_URI || 'https://flux.ionage.app/',
            }}
          />
        </View>
      ) : permissionsStatus.loading ? (
        <>
          <View style={styles.buttonContainer}>
            <ActivityIndicator
              size="large"
              color={Config.PARTNER_PRIMARY_COLOR}
            />
            <Text style={styles.text}>Loading...</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Text style={styles.text}>
              Please Grant Camera, Location
              {Platform.OS === 'ios' && ' & App Tracking'} Permission to show
              nearby chargers & scan QR
            </Text>
            <View style={styles.buttonSpacing}>
              <Pressable
                android_ripple={{borderless: false}}
                style={styles.button}
                onPress={openSettingsHandler}>
                <Text style={styles.buttonText}>Open Settings</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 30,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: Config.PARTNER_PRIMARY_COLOR,
  },
  text: {
    color: 'black',
    textAlign: 'center',
    marginHorizontal: 30,
    fontSize: 16,
    fontWeight: '500',
  },
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginVertical: 16,
    marginTop: 32,
  },
  webViewContainer: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
});

export default App;
