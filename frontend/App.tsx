import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import React, { Suspense, lazy } from 'react'
import './src/index.css'

import LandingScreen from './src/screens/LandingScreen'
import Loading from './src/components/atoms/Loading'
import PrivateOutlet from './src/services/PrivateOutlet'
import { Provider } from 'react-redux'
import store from './src/redux/store'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'

const CompanyPolicyScreen = lazy(() => import('./src/screens/CompanyPolicyScreen'))
const TasksScreen = lazy(() => import('./src/screens/TasksScreen'))
const TermsOfServiceSummaryScreen = lazy(() => import('./src/screens/TermsOfServiceSummaryScreen'))

const App = () => {
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
                <BrowserRouter>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            <Route path="*" element={<Navigate to="/" />} />
                            <Route path="/" element={<Outlet />}>
                                <Route index element={<LandingScreen />} />
                                <Route path={TERMS_OF_SERVICE_ROUTE} element={<CompanyPolicyScreen />} />
                                <Route path={PRIVACY_POLICY_ROUTE} element={<CompanyPolicyScreen />} />
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
                    </Suspense>
                </BrowserRouter>
            </Provider>
        </QueryClientProvider>
    )
}

export default App
