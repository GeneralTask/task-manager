import { Border, Colors, Spacing, Typography } from '../../styles'
import React, { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import Cookies from 'js-cookie'
import { Divider } from '../atoms/SectionDivider'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RedirectButton from '../atoms/buttons/RedirectButton'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'
import { TitleLarge } from '../atoms/title/Title'
import { icons } from '../../styles/images'
import { mutateUserInfo } from '../../services/api/user-info.hooks'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AUTHORIZATION_COOKE } from '../../constants'

const TermsOfServiceContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${Spacing.regular};
    height: 100%;
    box-sizing: border-box;
    min-height: 0;
`
const TermsOfServiceHeader = styled.div`
    margin-top: ${Spacing.medium};
    margin-bottom: ${Spacing.regular};
`
const TitleLargeContainer = styled.div`
    margin-bottom: ${Spacing.extraSmall};
`
const TermsScrollDiv = styled.div`
    flex: 1;
    overflow-y: scroll;
    margin-top: ${Spacing.extraSmall};
    padding: ${Spacing.extraSmall};
    border-top: ${Border.stroke.medium} solid ${Colors.border.gray};
    border-bottom: ${Border.stroke.medium} solid ${Colors.border.gray};
`
const LinkContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.regular};
    margin-top: ${Spacing.regular};
    margin-right: ${Spacing.regular};
`
const VerticalFlex = styled.div`
    display: flex;
    flex-direction: row;
`
const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.extraSmall};
`
const AgreementText = styled.div<{ required?: boolean }>`
    margin-left: ${Spacing.extraSmall};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    color: ${Colors.text.light};
    ${Typography.label};
`
const RedAsterisk = styled.span`
    color: ${Colors.status.red.default};
    ${Typography.label};
`
const SubmitButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.extraSmall};
    margin-top: ${Spacing.regular};
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
                queryClient.invalidateQueries('user_info')
                navigate('/')
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
            <Icon size="large" icon={icons.check_circle_wavy} color={Colors.icon.purple} />
            <TermsOfServiceHeader>
                <TitleLargeContainer>
                    <TitleLarge>Terms of Service</TitleLarge>
                </TitleLargeContainer>
                <SubtitleSmall>Please read and agree with the terms below.</SubtitleSmall>
            </TermsOfServiceHeader>
            <Divider />
            <TermsScrollDiv>
                <TermsOfServiceSummary />
            </TermsScrollDiv>
            <Divider />
            <LinkContainer>
                <RedirectButton to="/terms-of-service" target="_blank" text="Read full terms of service" />
                <RedirectButton to="/privacy-policy" target="_blank" text="Read privacy policy" />
            </LinkContainer>
            <VerticalFlex>
                <NoStyleButton data-testid="terms-check-button" onClick={() => setTermsCheck(!termsCheck)}>
                    <HorizontalFlex>
                        <Icon size="small" icon={termsCheck ? icons.checkbox_checked : icons.checkbox_unchecked} />
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
                        <Icon size="small" icon={promotionsCheck ? icons.checkbox_checked : icons.checkbox_unchecked} />
                        <AgreementText>I would like to opt in on General Task&#39;s promotional emails.</AgreementText>
                    </HorizontalFlex>
                </NoStyleButton>
            </VerticalFlex>
            <SubmitButtonContainer>
                <div data-testid="terms-submit-button">
                    <GTButton onClick={onSubmit} value="Continue" styleType="primary" disabled={!termsCheck} />
                </div>
                <GTButton onClick={onCancel} styleType="secondary" value="Cancel" />
            </SubmitButtonContainer>
        </TermsOfServiceContainer>
    )
}

export default TermsOfServiceSummaryView
