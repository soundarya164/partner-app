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

const OPTIONS: IonageWebViewProps['options'] = {
  apikey: '',
};

function App(): JSX.Element {
  const [openWebview, setopenWebview] = useState<boolean>(false);
  const [permissionsStatus, setPermissionsStatus] = useState<{
    camera: boolean;
    location: boolean;
    loading: boolean;
  }>({camera: false, location: false, loading: true});
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

  useEffect(() => {
    if (permissionsStatus.camera && permissionsStatus.location) {
      setopenWebview(true);
    }
  }, [permissionsStatus]);

  useEffect(() => {
    const initialcall = async () => {
      await requestCameraPermission();
      await requestLocationPermission();
      setPermissionsStatus(prevValue => ({...prevValue, loading: false}));
      await BootSplash.hide({fade: true});
    };

    initialcall();
  }, [requestCameraPermission, requestLocationPermission]);

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
    async (message: IonageMessageType) => {
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
            options={OPTIONS}
            onIonageMessageHandler={onIonageMessageHandler}
          />
        </View>
      ) : permissionsStatus.loading ? (
        <>
          <View style={styles.buttonContainer}>
            <ActivityIndicator size="large" color="#E20613" />
            <Text style={styles.text}>Loading...</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Text style={styles.text}>
              Please Grant Camera & Location Permission to show nearby chargers
              & scan QR
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
    backgroundColor: '#E20613',
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
