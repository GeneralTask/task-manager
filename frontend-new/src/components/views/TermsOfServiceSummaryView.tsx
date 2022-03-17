import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import styled from 'styled-components/native'
import { Link, useNavigate } from '../../services/routing'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleLarge } from '../atoms/title/Title'
import { TermsOfServiceSummary } from '../atoms/CompanyPoliciesHTML'

const TermsOfServiceContainer = styled.View`
    display: flex;
    flex-direction: column;
    padding: ${Spacing.padding.medium}px;
    height: 100%;
`
const GapContainer = styled.View`
    gap: ${Spacing.margin.medium}px;
`
const FlexGrow = styled.View`
    flex: 1;
    overflow-y: scroll;
`
const TermsOfServiceHeader = styled.View`
    margin-top: ${Spacing.margin.small}px;
    margin-bottom: ${Spacing.margin.medium}px;
`
const TitleLargeContainer = styled.View`
    margin-bottom: ${Spacing.margin.small}px;
`
const TermsScrollView = styled.ScrollView`
    margin-top: ${Spacing.margin.small}px;
    margin-bottom: ${Spacing.margin.small}px;
    padding: ${Spacing.padding.small}px;
`
const LinkContainer = styled.View`
    margin-top: ${Spacing.margin.small}px;
    margin-right: ${Spacing.margin.medium}px;
`
const PurpleText = styled.Text`
    color: ${Colors.purple._1};
    font-weight: ${Typography.weight._500.fontWeight};
    margin-right: ${Spacing.margin.xSmall}px;
`
const VerticalFlex = styled.View`
    display: flex;
    flex-direction: row;
`
const AgreementText = styled.Text<{ required?: boolean }>`
    margin-left: ${Spacing.margin.small}px;
`
const StyledAsterisk = styled.Text`
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

    const onSubmit = useCallback(() => {
        if (!termsCheck) return false
        navigate('/')
    }, [termsCheck, promotionsCheck])

    return (
        <TermsOfServiceContainer>
            <GapContainer>
                <Icon size="large" source={icons.circle_wavy_check} />
                <TermsOfServiceHeader>
                    <TitleLargeContainer>
                        <TitleLarge>Terms of Service</TitleLarge>
                    </TitleLargeContainer>
                    <SubtitleSmall>Please read and agree with the terms below.</SubtitleSmall>
                </TermsOfServiceHeader>
            </GapContainer>
            <Divider />
            <FlexGrow>
                <TermsScrollView>
                    <TermsOfServiceSummary />
                </TermsScrollView>
            </FlexGrow>
            <Divider />
            <GapContainer>
                <VerticalFlex>
                    <LinkContainer>
                        <Link to="/terms-of-service" target="_blank">
                            <PurpleText>Read full terms of service</PurpleText>
                            <Icon size="xxSmall" source={icons.caret_right_purple}></Icon>
                        </Link>
                    </LinkContainer>
                    <LinkContainer>
                        <Link to="/privacy-policy" target="_blank">
                            <PurpleText>Read privacy policy</PurpleText>
                            <Icon size="xxSmall" source={icons.caret_right_purple}></Icon>
                        </Link>
                    </LinkContainer>
                </VerticalFlex>
                <VerticalFlex>
                    <Pressable onPress={() => setTermsCheck(!termsCheck)}>
                        <Icon size="small" source={termsCheck ? icons.check_gray : icons.unchecked_check} />
                    </Pressable>
                    <AgreementText required>
                        I acknowledge General Task&#39;s privacy policy and agree to General Task&#39;s terms of
                        service.
                        <StyledAsterisk>*</StyledAsterisk>
                    </AgreementText>
                </VerticalFlex>
                <VerticalFlex>
                    <Pressable onPress={() => setPromotionsCheck(!promotionsCheck)}>
                        <Icon size="small" source={promotionsCheck ? icons.check_gray : icons.unchecked_check} />
                    </Pressable>
                    <AgreementText>I would like to opt in on General Task&#39;s promotional emails.</AgreementText>
                </VerticalFlex>
            </GapContainer>
            <GapContainer>
                <SubmitButtonContainer>
                    <RoundedGeneralButton
                        onPress={onSubmit}
                        value="Continue"
                        color={Colors.purple._1}
                        disabled={!termsCheck}
                    />
                    <RoundedGeneralButton onPress={() => navigate('/')} textStyle="dark" value="Cancel" hasBorder />
                </SubmitButtonContainer>
            </GapContainer>
        </TermsOfServiceContainer>
    )
}

export default TermsOfServiceSummaryView
