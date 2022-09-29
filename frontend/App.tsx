import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Loading from './src/components/atoms/Loading'
import LandingScreen from './src/components/screens/LandingScreen'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from './src/constants'
import { GlobalStyle } from './src/styles'
import { CompanyPolicyPages } from './src/utils/enums'

const CompanyPolicyView = lazy(() => import('./src/components/views/CompanyPolicyView'))

const App = () => {
    return (
        <BrowserRouter>
            <GlobalStyle />
            <Suspense fallback={<Loading />}>
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
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}

export default App
