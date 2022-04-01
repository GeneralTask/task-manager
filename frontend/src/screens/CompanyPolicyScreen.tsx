import React from 'react'
import { View } from 'react-native'
import { useLocation } from 'react-router-dom'
import CompanyPolicyView from '../components/views/CompanyPolicyView'
import { CompanyPolicyPages } from '../utils/enums'

const CompanyPolicyScreen = () => {
    const location = useLocation()

    const currentPage = (() => {
        switch (location.pathname.split('/')[1]) {
            case 'terms-of-service':
                return CompanyPolicyPages.TermsOfService
            case 'privacy-policy':
                return CompanyPolicyPages.PrivacyPolicy
            default:
                return CompanyPolicyPages.TermsOfService
        }
    })()

    return (
        <View>
            <CompanyPolicyView page={currentPage} />
        </View>
    )
}
export default CompanyPolicyScreen
