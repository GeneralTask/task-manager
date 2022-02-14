import React from 'react'
import { View, Text, Button, SafeAreaView, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Landing from './src/screens/LandingScreen'


const linking = {
  prefixes: ['https://generaltask.com', 'generaltask://'],
  config: {
    screens: {
      Landing: '/',
    }
  }
}

const App = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName='Landing' screenOptions={{ headerShown: false }} >
          <Stack.Screen name="Landing" component={Landing} />
        </Stack.Navigator>
      </NavigationContainer >
    </SafeAreaView >

  )
}

const Stack = createNativeStackNavigator()
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  }
})

export default App
