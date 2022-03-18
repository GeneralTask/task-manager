import { useFonts } from '@use-expo/font'
import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { Platform } from 'react-native'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import CompanyPolicyScreen from './src/screens/CompanyPolicyScreen'
import LandingScreen from './src/screens/LandingScreen'
import TasksScreen from './src/screens/TasksScreen'
import PrivateOutlet from './src/services/PrivateOutlet'
import { Navigate, Outlet, Route, Router, Routes } from './src/services/routing'
import { QueryClientProvider, QueryClient } from 'react-query'
import TermsOfServiceSummaryScreen from './src/screens/TermsOfServiceSummaryScreen'
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
