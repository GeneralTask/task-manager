import { Suspense, lazy } from 'react'
import ReactGA from 'react-ga4'
import { Helmet } from 'react-helmet'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Spinner from './src/components/atoms/Spinner'
import SharedNoteView from './src/components/notes/SharedNoteView'
import GoogleAuth from './src/components/screens/GoogleAuthScreen'
import LandingScreen from './src/components/screens/LandingScreen'
import { GOOGLE_AUTH_ROUTE, NOTE_ROUTE, PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
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
            <Helmet>
                <meta charSet="utf-8" />
                <title>General Task (beta)</title>
                <link rel="icon" href="/images/favicon.png" />
                <script src="https://kit.fontawesome.com/ad8a57c09f.js" crossOrigin="anonymous"></script>
                <base target="_blank" />
                <meta
                    content="Find focus like never before with the best free productivity tool on the market!"
                    name="description"
                />
                <meta
                    content="General Task (beta) — Free productivity tools for builders like you"
                    property="og:title"
                />
                <meta
                    content="Find focus like never before with the best free productivity tool on the market!"
                    property="og:description"
                />
                <meta
                    content="General Task (beta) — Free productivity tools for builders like you"
                    property="twitter:title"
                />
                <meta
                    content="Find focus like never before with the best free productivity tool on the market!"
                    property="twitter:description"
                />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="/images/futureman.png" />
                <meta content="summary_large_image" name="twitter:card" />
            </Helmet>
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
                        <Route path={GOOGLE_AUTH_ROUTE} element={<GoogleAuth />} />
                        <Route path="*" element={<AuthenticatedRoutes />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
