import React from 'react'
import TermsOfServiceHTML from '../../assets/company-policies/terms-of-service'
import PrivacyPolicyHTML from '../../assets/company-policies/privacy-policy'
import TermsOfServiceSummaryHTML from '../../assets/company-policies/terms-of-service-summary'

export const TermsOfService = () => <div dangerouslySetInnerHTML={{ __html: TermsOfServiceHTML }} />
export const PrivacyPolicy = () => <div dangerouslySetInnerHTML={{ __html: PrivacyPolicyHTML }} />
export const TermsOfServiceSummary = () => <div dangerouslySetInnerHTML={{ __html: TermsOfServiceSummaryHTML }} />
