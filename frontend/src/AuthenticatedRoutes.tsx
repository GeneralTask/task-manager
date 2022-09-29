import { lazy } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Navigate, Outlet, Route } from 'react-router-dom'
import { enableMapSet } from 'immer'
import StyledToastContainer from './components/atoms/toast/StyledToastContainer'
import FocusModeScreen from './components/screens/FocusModeScreen'
import { FOCUS_MODE_ROUTE } from './constants'
import AppContextProvider from './context/AppContextProvider'
import { isDevelopmentMode } from './environment'
import PrivateOutlet from './services/PrivateOutlet'

const MainScreen = lazy(() => import('./components/screens/MainScreen'))
const TermsOfServiceSummaryScreen = lazy(() => import('./components/screens/TermsOfServiceSummaryScreen'))
enableMapSet() // this allows immer to produce immutable maps and sets

const AuthenticatedRoutes = () => {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            {isDevelopmentMode && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
            <AppContextProvider>
                <Route path="*" element={<Navigate to="/" />} />
                <Route path="/" element={<Outlet />}>
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
                    <Route path="linear" element={<PrivateOutlet />}>
                        <Route index element={<MainScreen />} />
                        <Route path=":linearIssueId" element={<MainScreen />} />
                    </Route>
                    <Route path="slack" element={<PrivateOutlet />}>
                        <Route index element={<MainScreen />} />
                        <Route path=":slackTaskId" element={<MainScreen />} />
                    </Route>
                    <Route path={FOCUS_MODE_ROUTE} element={<PrivateOutlet />}>
                        <Route index element={<FocusModeScreen />} />
                    </Route>
                    <Route path="settings" element={<PrivateOutlet />}>
                        <Route index element={<MainScreen />} />
                    </Route>
                </Route>
            </AppContextProvider>
            <StyledToastContainer />
        </QueryClientProvider>
    )
}

export default AuthenticatedRoutes
