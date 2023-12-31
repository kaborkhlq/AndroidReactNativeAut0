import { ActivityIndicator, BackHandler, Dimensions, SafeAreaView, View, Text, Alert, Picker, TouchableOpacity, StyleSheet, FlatList, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import NetInfo from "@react-native-community/netinfo";
import { ConnectionLost } from './src/ConnectionLost';
import { PantallaReact } from './src/PantallaReact';
import { encode } from 'base-64';
export default function App() {
  const [viewport, setViewport] = useState(<ActivityIndicator size="large" color="#0000ff" />);
  const [visible, setVisible] = useState(true);
  const webViewRef = useRef();
  const [location, setLocation] = useState(null);
  const baseUrl = "https://cargauy-tse23.web.elasticloud.uy"
  const baseUrlEzequiel = "https://mi-testing.iduruguay.gub.uy/logout-process"

  const initLoginUrl = baseUrl + "/services/rest/gubUy/reservar?onSuccess=http://localhost:8080/success&onFailure=http://localhost:8080/failure"
  const initLogoutUrl = baseUrl + "/services/rest/gubUy/logout?"

  const callbackUrl = 'http://localhost:8080/success';
  let  urlForLoginAndLogoutSantiago = ""
  
  const generateWebView = () => {
    fetch(initLoginUrl, { 
      method: 'GET',
    }).then((response) => {
      return response.text();
   })
   .then((initialUri) => {
      urlForLoginAndLogoutSantiago = initialUri
      const unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected){
          setViewport(<WebView
            onLoad={() => hideSpinner()}
            style={{ flex: 1 }}
            source={{ uri: initialUri }}
            javaScriptEnabled = {true}
            geolocationEnabled={true}
            setBuiltInZoomControls={false}
            ref={webViewRef}
            onNavigationStateChange={onCallbackSaveTocken}
          />);
        } else {
          setViewport(<ConnectionLost onConectionBack={onConectionBack}/>)
        }
      });
    }).catch((error) => {
      console.log("error", error)
      setViewport(<ConnectionLost onConectionBack={onConectionBack} />)
    });
  }
  
  const onCallbackLogout = (navState) => {
    console.log("onCallbackLogout", navState)
    if (navState.url.startsWith(baseUrlEzequiel)) {
      fetch(navState.url.replace(callbackUrl, baseUrl), {
        method: 'GET',
      }).then((response) => {
        console.log("response", response)
        generateWebView()
      }).catch((error) => {
        console.log("error", error)
        setViewport(<ConnectionLost onConectionBack={onConectionBack} />)
      });
    }
  }

  const handleCloseSesion = () => {
    console.log("handleCloseSesion ")
    fetch(initLogoutUrl + "url=" + encodeURIComponent(urlForLoginAndLogoutSantiago)
      , { 
      method: 'GET',
    }).then((response) => {
      return response.text();
   }).then((initialUri) => {
      console.log("initialUri", initialUri)
      setViewport(<WebView
        onLoad={() => hideSpinner()}
        style={{ flex: 1 }}
        source={{ uri: initialUri }}
        javaScriptEnabled = {true}
        geolocationEnabled={true}
        setBuiltInZoomControls={false}
        ref={webViewRef}
        onNavigationStateChange={onCallbackLogout}
      />);
    }).catch((error) => {
      console.error(error);
    });
  }

  const onConectionBack = () => {
    console.log("onConectionBack")
    generateWebView()
  }

  const onCallbackSaveTocken = (navState)=>{
    console.log ('navState', navState);
    if(navState.title == "Error"){
      // setViewport(<ConnectionLost onConectionBack={onConectionBack} />)
    }
    if (navState.url.startsWith(callbackUrl)) {
      console.log("callbackUrl", navState.url.replace(callbackUrl, baseUrl))
      fetch(navState.url.replace(callbackUrl, baseUrl), {  
        method: 'GET',
      }).then((response) => {
        console.log("Santiago", baseUrl + "/services/rest/gubUy/verificar?url=" + encodeURIComponent(urlForLoginAndLogoutSantiago))
        fetch(baseUrl + "/services/rest/gubUy/verificar?url=" + encodeURIComponent(urlForLoginAndLogoutSantiago), {
          method: 'GET',
        }).then((responce)=>{return responce.text();}
        ).then((json)=>{
          console.log("response", response)
          console.log("json",json)
          token = encode(json.toString())
          return token;
        }).then((token) => {
          // let token = "ewogICAgImlkIjogIjQ3NTkxMzg5IiwKICAgICJyb2wiOiAiQ0lVREFEQU5PIiwKICAgICJzZWN1cml0eSI6ICIzRjQ3QjE5QSIKfQ=="
          setViewport(
            <>
              <PantallaReact token={token}/>
              <Button title="Cerrar Sesión" onPress={handleCloseSesion} />
            </>
            );
        }).catch((error) => {
          console.log("error", error)
          setViewport(<ConnectionLost onConectionBack={onConectionBack} />)
        });
      }).catch((error) => {
        console.log("error", error)
        setViewport(<ConnectionLost onConectionBack={onConectionBack} />)
      });
    }
  }

  const handleBackButtonPress = () => {
    try {
        webViewRef.current?.goBack()
        return true
    } catch (err) {
        console.log("[handleBackButtonPress] Error : ", err.message)
    }
  }
  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonPress)
    return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleBackButtonPress)
    };
  }, []);
  
  useEffect(() => {
    // Retorna funcion para borrar el evento.
    generateWebView();

    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Localización",
          "Para una mejor experiencia, activa la ubicación de esta App desde la configuración de tu celular",
          [
            { text: "OK" }
          ]
        );
      }
    }
    requestLocationPermission();
    return () => unsubscribe();
  },[]);

  const hideSpinner = () => {
      setVisible(false);
    };

  return (
    <SafeAreaView style={ { flex: 1} }>
      {viewport}
    </SafeAreaView>
  );

}

