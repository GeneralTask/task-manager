import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from './src/screens/LandingScreen'
import TasksScreen from './src/screens/TasksScreen'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import { useAppSelector } from './src/redux/hooks'
import Cookies from 'js-cookie'

const linking = {
  prefixes: ['https://generaltask.com', 'generaltask://'],
  config: {
    screens: {
      Landing: '/',
    }
  }
}

const Navigation = () => {
  const { authToken } = useAppSelector(state => ({
    authToken: state.user_data.auth_token
  }))
  const isSignedIn = !!authToken || !!Cookies.get('authToken')

  return (<NavigationContainer linking={linking}>
    <Stack.Navigator initialRouteName='Landing' screenOptions={{ headerShown: false }} >
      {
        isSignedIn ? (
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
  </NavigationContainer >)
}

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.safeArea}>
        <Navigation />
      </SafeAreaView >
    </Provider>

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
