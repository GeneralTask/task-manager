import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE } from '../../constants'
import { mutateUserInfo } from '../../services/api/user-info.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RedirectButton from '../atoms/buttons/RedirectButton'

const TermsOfServiceContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${Spacing._16};
    gap: ${Spacing._12};
    height: 100%;
    box-sizing: border-box;
    min-height: 0;
`
const Title = styled.div`
    color: ${Colors.text.black};
    ${Typography.deprecated_subtitle};
`
const Subtitle = styled.div`
    color: ${Colors.text.black};
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
`
const TermsScrollDiv = styled.div`
    flex: 1;
    overflow-y: scroll;
    padding: ${Spacing._16} 0;
    border-top: ${Border.stroke.medium} solid ${Colors.background.border};
    border-bottom: ${Border.stroke.medium} solid ${Colors.background.border};
`
const LinkContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._16};
    margin-top: ${Spacing._16};
    margin-right: ${Spacing._16};
`
const VerticalFlex = styled.div`
    display: flex;
    flex-direction: row;
`
const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing._8};
`
const AgreementText = styled.div<{ required?: boolean }>`
    margin-left: ${Spacing._8};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    color: ${Colors.text.light};
    ${Typography.deprecated_label};
`
const RedAsterisk = styled.span`
    color: ${Colors.status.red.default};
    ${Typography.deprecated_label};
`
const SubmitButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    margin-top: ${Spacing._16};
`

const TermsOfServiceSummaryView = () => {
    const [termsCheck, setTermsCheck] = useState(false)
    const [promotionsCheck, setPromotionsCheck] = useState(false)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { mutate } = useMutation(
        () =>
            mutateUserInfo({
                agreed_to_terms: termsCheck,
                opted_into_marketing: promotionsCheck,
            }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['user_info'])
            },
        }
    )
    const onSubmit = useCallback(() => {
        if (!termsCheck) return false
        mutate()
    }, [termsCheck, promotionsCheck])

    const onCancel = useCallback(() => {
        Cookies.remove(AUTHORIZATION_COOKE)
        navigate('/')
    }, [])

    return (
        <TermsOfServiceContainer>
            <Title>Terms of Service</Title>
            <Subtitle>Please read and agree with the terms below.</Subtitle>
            <TermsScrollDiv>
                <TermsOfServiceSummary />
            </TermsScrollDiv>
            <LinkContainer>
                <RedirectButton to="/terms-of-service" target="_blank" text="Read full terms of service" />
                <RedirectButton to="/privacy-policy" target="_blank" text="Read privacy policy" />
            </LinkContainer>
            <VerticalFlex>
                <NoStyleButton onClick={() => setTermsCheck(!termsCheck)}>
                    <HorizontalFlex>
                        <Icon
                            icon={termsCheck ? icons.checkbox_checked_solid : icons.checkbox_unchecked}
                            color="purple"
                        />
                        <AgreementText required>
                            I acknowledge General Task&#39;s privacy policy and agree to General Task&#39;s terms of
                            service.
                            <RedAsterisk>*</RedAsterisk>
                        </AgreementText>
                    </HorizontalFlex>
                </NoStyleButton>
            </VerticalFlex>
            <VerticalFlex>
                <NoStyleButton onClick={() => setPromotionsCheck(!promotionsCheck)}>
                    <HorizontalFlex>
                        <Icon
                            icon={promotionsCheck ? icons.checkbox_checked_solid : icons.checkbox_unchecked}
                            color="purple"
                        />
                        <AgreementText>I would like to opt in on General Task&#39;s promotional emails.</AgreementText>
                    </HorizontalFlex>
                </NoStyleButton>
            </VerticalFlex>
            <SubmitButtonContainer>
                <div>
                    <GTButton onClick={onSubmit} value="Continue" styleType="primary" disabled={!termsCheck} />
                </div>
                <GTButton onClick={onCancel} styleType="secondary" value="Cancel" />
            </SubmitButtonContainer>
        </TermsOfServiceContainer>
    )
}

export default TermsOfServiceSummaryView
