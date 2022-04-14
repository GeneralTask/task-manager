import React, { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import './src/index.css'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Loading from './src/components/atoms/Loading'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import store from './src/redux/store'
import LandingScreen from './src/screens/LandingScreen'
import PrivateOutlet from './src/services/PrivateOutlet'



const CompanyPolicyScreen = lazy(() => import('./src/screens/CompanyPolicyScreen'))
const MainScreen = lazy(() => import('./src/screens/MainScreen'))
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
                                    <Route index element={<MainScreen />} />
                                    <Route path=":section" element={<MainScreen />}>
                                        <Route path=":task" element={<MainScreen />} />
                                    </Route>
                                </Route>
                                <Route path="messages" element={<PrivateOutlet />}>
                                    <Route index element={<MainScreen />} />
                                    <Route path=":thread" element={<MainScreen />} />
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
