import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Button,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';
import {request, PERMISSIONS} from 'react-native-permissions';

function App(): JSX.Element {
  const [openWebview, setopenWebview] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);
  const [startingURL, onChangeURL] = React.useState<string>(
    'https://web.staging.ionage.app',
  );

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

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onAndroidBackPress = () => {
        if (webViewRef.current) {
          const run = 'window.go_to_previous_screen()';
          webViewRef.current.injectJavaScript(run);
          return true; // prevent default behavior (exit app)
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
  }, []);

  const onMessageHandler = useCallback(
    (event: WebViewMessageEvent) => {
      console.log(event.nativeEvent.data);
      switch (event.nativeEvent.data) {
        case 'ionage_close_app':
          setopenWebview(false);
          break;
        case 'ionage_location_permission':
          //Request Location Permission if not handled by Ionage PWA
          // requestLocationPermission();
          break;
        case 'ionage_camera_permission':
          //Request Camera Permission if not handled by Ionage PWA
          // requestCameraPermission();
          break;
      }
    },
    [
      // requestCameraPermission,
      // requestLocationPermission
    ],
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
            <WebView
              ref={webViewRef}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              source={{uri: startingURL}}
              onMessage={onMessageHandler}
              onError={syntheticEvent => {
                const {nativeEvent} = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <TextInput
              onChangeText={onChangeURL}
              value={startingURL}
              style={styles.textInput}
              placeholder="Enter Ionage URL"
            />
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
    marginVertical: 16,
    borderRadius: 4,
    paddingHorizontal: 8,
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
