import React from 'react'
import styled from 'styled-components/native'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TitleLarge } from '../atoms/title/Title'
import { Icon } from '../atoms/Icon'
import { PrivacyPolicy, TermsOfService } from '../atoms/CompanyPoliciesHTML'
import UnauthorizedHeader from '../molecules/UnauthorizedHeader'
import UnauthorizedFooter from '../molecules/UnauthorizedFooter'
import { CompanyPolicyPages } from '../../utils/enums'

const CompanyPolicyContainer = styled.View`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Body = styled.View`
    max-width: 800px;
    margin: ${Spacing.margin.xLarge}px 0px;
`
const PolicyHeader = styled.View`
    display: flex;
    gap: ${Spacing.margin.small}px;
    margin-bottom: ${Spacing.margin.large}px;
`

interface CompanyPolicyViewProps {
    page: CompanyPolicyPages
}
const CompanyPolicyView = ({ page }: CompanyPolicyViewProps) => {
    const [pageTitle, pageContent] =
        page === CompanyPolicyPages.TermsOfService
            ? ['General Task Terms of Service', <TermsOfService key="tos" />]
            : ['General Task Privacy Policy', <PrivacyPolicy key="pp" />]
    return (
        <CompanyPolicyContainer>
            <UnauthorizedHeader />
            <Body>
                <PolicyHeader>
                    <Icon size="large" source={icons.check_circle_wavy} />
                    <TitleLarge>{pageTitle}</TitleLarge>
                </PolicyHeader>
                {pageContent}
            </Body>
            <UnauthorizedFooter />
        </CompanyPolicyContainer>
    )
}

export default CompanyPolicyView
