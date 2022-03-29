import { Navigate, Outlet, Route, Router, Routes } from './src/services/routing'
import { QueryClient, QueryClientProvider } from 'react-query'

import CompanyPolicyScreen from './src/screens/CompanyPolicyScreen'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import LandingScreen from './src/screens/LandingScreen'
import { Platform } from 'react-native'
import PrivateOutlet from './src/services/PrivateOutlet'
import { Provider } from 'react-redux'
import React from 'react'
import TasksScreen from './src/screens/TasksScreen'
import TermsOfServiceSummaryScreen from './src/screens/TermsOfServiceSummaryScreen'
import { TouchBackend } from 'react-dnd-touch-backend'
import { createGlobalStyle } from 'styled-components'
import store from './src/redux/store'
import { useFonts } from '@use-expo/font'

// import {  } from "styled-components/native";

const GlobalFontStyles = Platform.OS === 'web' ? createGlobalStyle`
    @font-face {
        font-family: 'Switzer-Variable';
        src: require('./src/assets/fonts/fonts/Switzer-Variable.ttf')
    }
` : null

const App = () => {
    const backend = Platform.OS === 'web' ? HTML5Backend : TouchBackend
    useFonts({
        'Switzer-Variable': require('./src/assets/fonts/fonts/Switzer-Variable.ttf'),
    })
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
            },
        },
    })

    return (
        <QueryClientProvider client={queryClient}>
            {GlobalFontStyles && <GlobalFontStyles />}
            <Provider store={store}>
                <DndProvider backend={backend}>
                    <Router>
                        <Routes>
                            <Route path="*" element={<Navigate to="/" />} />
                            <Route path="/" element={<Outlet />}>
                                <Route index element={<LandingScreen />} />
                                <Route path="terms-of-service" element={<CompanyPolicyScreen />} />
                                <Route path="privacy-policy" element={<CompanyPolicyScreen />} />
                                <Route path="tos-summary" element={<PrivateOutlet />}>
                                    <Route index element={<TermsOfServiceSummaryScreen />} />
                                </Route>
                                <Route path="tasks" element={<PrivateOutlet />}>
                                    <Route index element={<TasksScreen />} />
                                    <Route path=":section" element={<TasksScreen />}>
                                        <Route path=":task" element={<TasksScreen />} />
                                    </Route>
                                </Route>
                                <Route path="messages" element={<PrivateOutlet />}>
                                    <Route index element={<TasksScreen />} />
                                    <Route path=":message" element={<TasksScreen />} />
                                </Route>
                                <Route path="settings" element={<PrivateOutlet />}>
                                    <Route index element={<TasksScreen />} />
                                </Route>
                            </Route>
                        </Routes>
                    </Router>
                </DndProvider>
            </Provider>
        </QueryClientProvider>
    )
}

export default App
