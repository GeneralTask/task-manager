import PrivacyPolicyHTML from '../../../public/company-policies/privacy-policy'
import React from 'react'
import TermsOfServiceHTML from '../../../public/company-policies/terms-of-service'
import TermsOfServiceSummaryHTML from '../../../public/company-policies/terms-of-service-summary'

export const TermsOfService = () => <div dangerouslySetInnerHTML={{ __html: TermsOfServiceHTML }} />
export const PrivacyPolicy = () => <div dangerouslySetInnerHTML={{ __html: PrivacyPolicyHTML }} />
export const TermsOfServiceSummary = () => <div dangerouslySetInnerHTML={{ __html: TermsOfServiceSummaryHTML }} />
