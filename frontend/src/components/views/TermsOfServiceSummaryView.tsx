import Cookies from 'js-cookie'
import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { mutateUserInfo } from '../../services/api-query-hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { ModalEnum } from '../../utils/enums'
import RedirectButton from '../atoms/buttons/RedirectButton'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleLarge } from '../atoms/title/Title'

const TermsOfServiceContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: ${Spacing.padding.medium}px;
    height: 100%;
    box-sizing: border-box;
`
const TermsOfServiceHeader = styled.div`
    margin-top: ${Spacing.margin.large}px;
    margin-bottom: ${Spacing.margin.medium}px;
`
const TitleLargeContainer = styled.div`
    margin-bottom: ${Spacing.margin.small}px;
`
const TermsScrollDiv = styled.div`
    flex: 1;
    overflow-y: scroll;
    margin-top: ${Spacing.margin.small}px;
    padding: ${Spacing.padding.small}px;
`
const LinkContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin.medium}px;
    margin-top: ${Spacing.margin.medium}px;
    margin-right: ${Spacing.margin.medium}px;
`
const VerticalFlex = styled.div`
    display: flex;
    flex-direction: row;
`
const HorizontalFlex = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.margin.small}px;
`
const AgreementText = styled.div<{ required?: boolean }>`
    margin-left: ${Spacing.margin.small}px;
    font-family: 'Switzer-Variable';
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._500.fontWeight};
    color: ${Colors.gray._600};
`
const RedAsterisk = styled.span`
    color: ${Colors.red._1};
    font-weight: ${Typography.weight._500.fontWeight};
`
const SubmitButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin.small}px;
    margin-top: ${Spacing.margin.medium}px;
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
                <Pressable onPress={() => setTermsCheck(!termsCheck)}>
                    <HorizontalFlex>
                        <Icon size="small" source={termsCheck ? icons.check_gray : icons.check_unchecked} />
                        <AgreementText required>
                            I acknowledge General Task&#39;s privacy policy and agree to General Task&#39;s terms of
                            service.
                            <RedAsterisk>*</RedAsterisk>
                        </AgreementText>
                    </HorizontalFlex>
                </Pressable>
            </VerticalFlex>
            <VerticalFlex>
                <Pressable onPress={() => setPromotionsCheck(!promotionsCheck)}>
                    <HorizontalFlex>
                        <Icon size="small" source={promotionsCheck ? icons.check_gray : icons.check_unchecked} />
                        <AgreementText>
                            I would like to opt in on General Task&#39;s promotional emails.
                        </AgreementText>
                    </HorizontalFlex>
                </Pressable>
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
