import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import styled from 'styled-components/native'
import { useNavigate } from '../../services/routing'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleLarge } from '../atoms/title/Title'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'
import RedirectButton from '../atoms/buttons/RedirectButton'
import { useMutation, useQueryClient } from 'react-query'
import { mutateUserInfo } from '../../services/queryUtils'
import { setShowModal } from '../../redux/tasksPageSlice'
import { ModalEnum } from '../../utils/enums'
import { useAppDispatch } from '../../redux/hooks'
import Cookies from 'js-cookie'

const TermsOfServiceContainer = styled.View`
    display: flex;
    flex-direction: column;
    padding: ${Spacing.padding.medium}px;
    height: 100%;
`
const GapContainer = styled.View`
    gap: ${Spacing.margin.medium}px;
`
const TermsOfServiceHeader = styled.View`
    margin-top: ${Spacing.margin.large}px;
    margin-bottom: ${Spacing.margin.medium}px;
`
const TitleLargeContainer = styled.View`
    margin-bottom: ${Spacing.margin.small}px;
`
const TermsScrollView = styled.View`
    flex: 1;
    overflow-y: scroll;
    margin-top: ${Spacing.margin.small}px;
    margin-bottom: ${Spacing.margin.small}px;
    padding: ${Spacing.padding.small}px;
`
const LinkContainer = styled.View`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin.medium}px;
    margin-top: ${Spacing.margin.small}px;
    margin-right: ${Spacing.margin.medium}px;
`
const VerticalFlex = styled.View`
    display: flex;
    flex-direction: row;
`
const AgreementText = styled.Text<{ required?: boolean }>`
    margin-left: ${Spacing.margin.small}px;
`
const RedAsterisk = styled.Text`
    color: ${Colors.red._1};
    font-weight: ${Typography.weight._500.fontWeight};
`
const SubmitButtonContainer = styled.View`
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
        () => {
            return mutateUserInfo({
                agreed_to_terms: termsCheck,
                opted_into_marketing: promotionsCheck,
            })
        },
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
            <TermsScrollView>
                <TermsOfServiceSummary />
            </TermsScrollView>
            <Divider />
            <GapContainer>
                <LinkContainer>
                    <RedirectButton to="/terms-of-service" target="_blank" text="Read full terms of service" />
                    <RedirectButton to="/privacy-policy" target="_blank" text="Read privacy policy" />
                </LinkContainer>
                <VerticalFlex>
                    <Pressable onPress={() => setTermsCheck(!termsCheck)}>
                        <Icon size="small" source={termsCheck ? icons.check_gray : icons.check_unchecked} />
                    </Pressable>
                    <AgreementText required>
                        I acknowledge General Task&#39;s privacy policy and agree to General Task&#39;s terms of
                        service.
                        <RedAsterisk>*</RedAsterisk>
                    </AgreementText>
                </VerticalFlex>
                <VerticalFlex>
                    <Pressable onPress={() => setPromotionsCheck(!promotionsCheck)}>
                        <Icon size="small" source={promotionsCheck ? icons.check_gray : icons.check_unchecked} />
                    </Pressable>
                    <AgreementText>I would like to opt in on General Task&#39;s promotional emails.</AgreementText>
                </VerticalFlex>
            </GapContainer>
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
