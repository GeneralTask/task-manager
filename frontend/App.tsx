import './src/index.css'

import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import { QueryClient, QueryClientProvider } from 'react-query'
import React, { Suspense, lazy } from 'react'

import LandingScreen from './src/components/screens/LandingScreen'
import Loading from './src/components/atoms/Loading'
import PrivateOutlet from './src/services/PrivateOutlet'
import { Provider } from 'react-redux'
import store from './src/redux/store'

const CompanyPolicyScreen = lazy(() => import('./src/components/screens/CompanyPolicyScreen'))
const MainScreen = lazy(() => import('./src/components/screens/MainScreen'))
const TermsOfServiceSummaryScreen = lazy(() => import('./src/components/screens/TermsOfServiceSummaryScreen'))

const App = () => {
    const queryClient = new QueryClient()

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
                                <Route path="overview" element={<PrivateOutlet />}>
                                    <Route index element={<MainScreen />} />
                                    <Route path=":overviewViewId" element={<MainScreen />}>
                                        <Route path=":overviewItemId" element={<MainScreen />} />
                                    </Route>
                                </Route>
                                <Route path="tasks" element={<PrivateOutlet />}>
                                    <Route index element={<MainScreen />} />
                                    <Route path=":section" element={<MainScreen />}>
                                        <Route path=":task" element={<MainScreen />} />
                                    </Route>
                                </Route>
                                <Route path="pull-requests" element={<PrivateOutlet />}>
                                    <Route index element={<MainScreen />} />
                                    <Route path=":pullRequest" element={<MainScreen />} />
                                </Route>
                                <Route path="settings" element={<PrivateOutlet />}>
                                    <Route index element={<MainScreen />} />
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
