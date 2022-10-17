import styled from 'styled-components'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { CompanyPolicyPages } from '../../utils/enums'
import { PrivacyPolicy, TermsOfService } from '../atoms/CompanyPoliciesHTML'
import { Icon } from '../atoms/Icon'
import { Title } from '../atoms/typography/Typography'
import UnauthorizedFooter from '../molecules/UnauthorizedFooter'
import UnauthorizedHeader from '../molecules/UnauthorizedHeader'

const CompanyPolicyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Body = styled.div`
    max-width: 800px;
    margin: ${Spacing._32} 0px;
`
const PolicyHeader = styled.div`
    display: flex;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._24};
    align-items: center;
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
                    <Icon size="large" icon={icons.check_circle_wavy} />
                    <Title>{pageTitle}</Title>
                </PolicyHeader>
                {pageContent}
            </Body>
            <UnauthorizedFooter />
        </CompanyPolicyContainer>
    )
}

export default CompanyPolicyView
