import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Button,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {request, PERMISSIONS} from 'react-native-permissions';
import {
  IonageWebView,
  handleAndroidBackPress,
  type IonageWebViewRef,
  type IonageMessageType,
} from 'ionage-rnsdk';

function App(): JSX.Element {
  const [openWebview, setopenWebview] = useState<boolean>(false);
  const webViewRef = useRef<IonageWebViewRef>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  const backgroundStyle = {
    flex: 1,
    backgroundColor: '#FFFFFF',
  };

  const requestCameraPermission = useCallback(async () => {
    try {
      const STATUS = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA,
      );
      console.log(STATUS);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const STATUS = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );
      console.log(STATUS);
    } catch (error) {
      console.log(error);
    }
  }, []);

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
          setopenWebview(false);
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
        <>
          <Button title="Close" onPress={() => setopenWebview(false)} />
          <View style={styles.webViewContainer}>
            <IonageWebView
              ref={webViewRef}
              options={{
                apikey: apiKey,
                ...(token ? {token} : {}),
                ...(lat ? {lat} : {}),
                ...(lng ? {lng} : {}),
              }}
              onIonageMessageHandler={onIonageMessageHandler}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Text>apiKey</Text>
            <TextInput
              onChangeText={setApiKey}
              value={apiKey}
              style={styles.textInput}
              placeholder="Enter API key"
            />
            <Text>token</Text>
            <TextInput
              onChangeText={setToken}
              value={token}
              style={styles.textInput}
              placeholder="Enter Token"
            />
            <Text>lat/lng</Text>
            <View style={styles.flexRow}>
              <TextInput
                onChangeText={setLat}
                value={lat}
                // eslint-disable-next-line react-native/no-inline-styles
                style={[styles.textInput, styles.flex1, {marginRight: 8}]}
                placeholder="Enter Lat"
              />
              <TextInput
                onChangeText={setLng}
                value={lng}
                // eslint-disable-next-line react-native/no-inline-styles
                style={[styles.textInput, styles.flex1, {marginLeft: 8}]}
                placeholder="Enter Lng"
              />
            </View>
            <View style={styles.buttonSpacing}>
              <Button
                title="Open Webview"
                onPress={() => {
                  setopenWebview(true);
                }}
              />
            </View>
            <View style={styles.buttonSpacing}>
              <Button
                title="Camera Permission"
                onPress={requestCameraPermission}
              />
            </View>
            <View style={styles.buttonSpacing}>
              <Button
                title="Location Permission"
                onPress={requestLocationPermission}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textInput: {
    color: 'black',
    borderWidth: 1,
    marginVertical: 8,
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginVertical: 16,
  },
  webViewContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'red',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
});

export default App;
