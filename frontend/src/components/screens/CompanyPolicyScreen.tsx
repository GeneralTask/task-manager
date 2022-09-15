import { useLocation } from 'react-router-dom'
import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from '../../constants'
import { CompanyPolicyPages } from '../../utils/enums'
import CompanyPolicyView from '../views/CompanyPolicyView'

const CompanyPolicyScreen = () => {
    const location = useLocation()

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case TERMS_OF_SERVICE_ROUTE:
                return CompanyPolicyPages.TermsOfService
            case PRIVACY_POLICY_ROUTE:
                return CompanyPolicyPages.PrivacyPolicy
            default:
                return CompanyPolicyPages.TermsOfService
        }
    })()

    return <CompanyPolicyView page={currentPage} />
}
export default CompanyPolicyScreen
