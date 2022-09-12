import Loading from './src/components/atoms/Loading'
import LandingScreen from './src/components/screens/LandingScreen'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import AppContextProvider from './src/context/AppContextProvider'
import './src/index.css'
import PrivateOutlet from './src/services/PrivateOutlet'
import { enableMapSet } from 'immer'
import { Suspense, lazy } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

const CompanyPolicyScreen = lazy(() => import('./src/components/screens/CompanyPolicyScreen'))
const MainScreen = lazy(() => import('./src/components/screens/MainScreen'))
const TermsOfServiceSummaryScreen = lazy(() => import('./src/components/screens/TermsOfServiceSummaryScreen'))

enableMapSet() // this allows immer to produce immutable maps and sets

const App = () => {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <AppContextProvider>
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
            </AppContextProvider>
        </QueryClientProvider>
    )
}

export default App
