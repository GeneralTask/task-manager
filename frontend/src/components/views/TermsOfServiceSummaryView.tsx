import { Colors, Spacing, Typography } from '../../styles'
import React, { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import Cookies from 'js-cookie'
import { Divider } from '../atoms/SectionDivider'
import { Icon } from '../atoms/Icon'
import { ModalEnum } from '../../utils/enums'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import RedirectButton from '../atoms/buttons/RedirectButton'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'
import { TitleLarge } from '../atoms/title/Title'
import { icons } from '../../styles/images'
import { mutateUserInfo } from '../../services/api-query-hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { useNavigate } from 'react-router-dom'

const TermsOfServiceContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${Spacing.padding._16}px;
    height: 100%;
    box-sizing: border-box;
`
const TermsOfServiceHeader = styled.div`
    margin-top: ${Spacing.margin._24}px;
    margin-bottom: ${Spacing.margin._16}px;
`
const TitleLargeContainer = styled.div`
    margin-bottom: ${Spacing.margin._8}px;
`
const TermsScrollDiv = styled.div`
    flex: 1;
    overflow-y: scroll;
    margin-top: ${Spacing.margin._8}px;
    padding: ${Spacing.padding._8}px;
`
const LinkContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._16}px;
    margin-top: ${Spacing.margin._16}px;
    margin-right: ${Spacing.margin._16}px;
`
const VerticalFlex = styled.div`
    display: flex;
    flex-direction: row;
`
const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.margin._8}px;
`
const AgreementText = styled.div<{ required?: boolean }>`
    margin-left: ${Spacing.margin._8}px;
    font-family: 'Switzer-Variable';
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
`
const RedAsterisk = styled.span`
    color: ${Colors.red._1};
    font-weight: ${Typography.weight._500};
`
const SubmitButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._8}px;
    margin-top: ${Spacing.margin._16}px;
`

const TermsOfServiceSummaryView = () => {
    const [termsCheck, setTermsCheck] = useState(false)
    const [promotionsCheck, setPromotionsCheck] = useState(false)
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
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
                dispatch(setShowModal(ModalEnum.NONE))
                navigate('/')
            },
        }
    )
    const onSubmit = useCallback(() => {
        if (!termsCheck) return false
        mutate()
    }, [termsCheck, promotionsCheck])

    const onCancel = useCallback(() => {
        dispatch(setShowModal(ModalEnum.NONE))
        Cookies.remove('authToken')
    }, [])

    return (
        <TermsOfServiceContainer>
            <Icon size="large" source={icons.check_circle_wavy} />
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
                <NoStyleButton onClick={() => setTermsCheck(!termsCheck)}>
                    <HorizontalFlex>
                        <Icon size="small" source={termsCheck ? icons.check_gray : icons.check_unchecked} />
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
                        <Icon size="small" source={promotionsCheck ? icons.check_gray : icons.check_unchecked} />
                        <AgreementText>
                            I would like to opt in on General Task&#39;s promotional emails.
                        </AgreementText>
                    </HorizontalFlex>
                </NoStyleButton>
            </VerticalFlex>
            <SubmitButtonContainer>
                <RoundedGeneralButton
                    onPress={onSubmit}
                    value="Continue"
                    color={Colors.purple._1}
                    disabled={!termsCheck}
                />
                <RoundedGeneralButton onPress={onCancel} textStyle="dark" value="Cancel" hasBorder />
            </SubmitButtonContainer>
        </TermsOfServiceContainer>
    )
}

export default TermsOfServiceSummaryView
