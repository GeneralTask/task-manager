import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Cookies from 'js-cookie'
import Spinner from './src/components/atoms/Spinner'
import LandingScreen from './src/components/screens/LandingScreen'
import NoteView from './src/components/views/NoteView'
import { AUTHORIZATION_COOKE, NOTE_ROUTE, PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import { GlobalStyle } from './src/styles'
import { CompanyPolicyPages } from './src/utils/enums'

const AuthenticatedRoutes = lazy(() => import('./src/AuthenticatedRoutes'))
const CompanyPolicyView = lazy(() => import('./src/components/views/CompanyPolicyView'))

const isLoggedIn = Cookies.get(AUTHORIZATION_COOKE)

const App = () => {
    return (
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
                    <Route path={NOTE_ROUTE} element={<Outlet />}>
                        <Route path=":note" element={<NoteView />} />
                    </Route>
                    {isLoggedIn && <Route path="*" element={<AuthenticatedRoutes />} />}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}

export default App
