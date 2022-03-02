import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { getPathFromState, getStateFromPath, NavigationContainer, NavigationState, ParamListBase, PartialState, PathConfigMap } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from './src/screens/LandingScreen'
import AppDrawer from './src/screens/AppDrawer'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import { useAppSelector } from './src/redux/hooks'
import Cookies from 'js-cookie'
import { Colors } from './src/styles'

declare type Options<ParamList extends ParamListBase> = {
  initialRouteName?: string;
  screens: PathConfigMap<ParamList>;
};
declare type ResultState = PartialState<NavigationState> & {
  state?: ResultState;
};
declare type State = NavigationState | Omit<PartialState<NavigationState>, 'stale'>;
const linking = {
  prefixes: ['https://generaltask.com', 'generaltask://'],
  config: {
    screens: {
      Landing: '/',
    }
  },
  getStateFromPath: <ParamList extends ParamListBase>(path: string, options?: Options<ParamList>): ResultState | undefined => {
    return getStateFromPath(path.replaceAll('_', '%20'), options)
  },
  getPathFromState: <ParamList extends ParamListBase>(state: State, options?: Options<ParamList>): string => {
    return getPathFromState(state, options).replaceAll('%20', '_')
  },
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
            <Stack.Screen name="Landing" component={AppDrawer} />
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
    </Provider >
  )
}

const Stack = createNativeStackNavigator()
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray._50
  }
})

export default App
