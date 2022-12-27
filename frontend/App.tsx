import { Suspense, lazy } from 'react'
import ReactGA from 'react-ga4'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Spinner from './src/components/atoms/Spinner'
import SharedNoteView from './src/components/notes/SharedNoteView'
import LandingScreen from './src/components/screens/LandingScreen'
import { NOTE_ROUTE, PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import { GlobalStyle } from './src/styles'
import { CompanyPolicyPages } from './src/utils/enums'

const GA_TRACKING_ID = 'G-GLHZBNMPN9'
ReactGA.initialize(GA_TRACKING_ID, {
    gaOptions: {
        siteSpeedSampleRate: 100,
    },
})

const AuthenticatedRoutes = lazy(() => import('./src/AuthenticatedRoutes'))
const CompanyPolicyView = lazy(() => import('./src/components/views/CompanyPolicyView'))

const App = () => {
    const queryClient = new QueryClient()
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <GlobalStyle />
                <Suspense fallback={<Spinner />}>
                    <Routes>
                        <Route index element={<LandingScreen />} />
                        <Route
                            path={TERMS_OF_SERVICE_ROUTE}
                            element={<CompanyPolicyView page={CompanyPolicyPages.TermsOfService} />}
                        />
                        <Route
                            path={PRIVACY_POLICY_ROUTE}
                            element={<CompanyPolicyView page={CompanyPolicyPages.PrivacyPolicy} />}
                        />
                        <Route path={NOTE_ROUTE} element={<SharedNoteView />}>
                            <Route path=":noteId" element={<SharedNoteView />} />
                        </Route>
                        <Route path="*" element={<AuthenticatedRoutes />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
