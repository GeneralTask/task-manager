import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from './src/screens/LandingScreen'
import { isAuthenticated } from './src/utils/auth'
import TasksScreen from './src/screens/TasksScreen'


const linking = {
  prefixes: ['https://generaltask.com', 'generaltask://'],
  config: {
    screens: {
      Landing: '/',
    }
  }
}

const App = () => {
  const signedIn = isAuthenticated()
  return (
    <SafeAreaView style={styles.safeArea}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName='Landing' screenOptions={{ headerShown: false }} >
          {
            signedIn ? (
              <>
                <Stack.Screen name="Landing" component={TasksScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Landing" component={LandingScreen} />
              </>
            )
          }
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
