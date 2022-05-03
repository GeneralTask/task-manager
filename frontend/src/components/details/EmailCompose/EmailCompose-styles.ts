import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import styled, { css } from 'styled-components'

import NoStyleButton from '../../atoms/buttons/NoStyleButton'

// EmailInputContainer and EmailInput are adapted from 'react-multi-email/style.css'
export const EmailInputContainer = css`
    margin: 0;
    min-height: 38px;
    flex: 1 0 auto;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    color: ${Colors.black};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`
export const EmailInput = css`
    width: auto;
    background-color: inherit;
    outline: none;
    border: none;
    line-height: 1;
    vertical-align: baseline !important;
    padding: 0;
    flex: 1;
    font-size: ${Typography.xSmall.fontSize};
    font-family: Switzer-Variable;
`
export const EmailComposeContainer = styled.div`
    padding-top: 0;
    margin: ${Spacing.margin._16}px;
    border: 2px solid ${Colors.gray._300};
    border-radius: ${Border.radius.large};
    .react-multi-email {
        ${EmailInputContainer}
    }
    .react-multi-email > input {
        ${EmailInput}
        margin: 0 ${Spacing.padding._4}px;
    }
`
export const FullWidth = styled.div`
    width: 100%;
`
export const EmailRecipientsContainer = styled.div`
    display: flex;
    max-width: 100%;
    align-content: flex-start;
    flex: 1 0 auto;
    flex-wrap: wrap;
`
export const EmailTag = styled.div`
    max-width: 100%;
    margin: ${Spacing.margin._4}px;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.large};
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._4}px;
    background-color: ${Colors.gray._100};
`
export const EmailActionButtonContainer = styled.div`
    width: calc(100% / 3);
    padding: ${Spacing.padding._8}px;
`
export const EmailActionButton = styled(NoStyleButton)`
    background-color: ${Colors.gray._100};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${Shadows.small};
    width: 100%;
    padding: ${Spacing.padding._8}px 0;
`
export const ButtonsContainer = styled(FullWidth)`
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._8}px;
    padding: ${Spacing.padding._8}px;
`
export const BodyContainer = styled.div`
    height: 150px;
`
export const AddEmailRecipientsContainer = styled.div`
    display: flex;
    align-items: end;
    margin-left: auto;
    padding: ${Spacing.padding._8}px;
    gap: ${Spacing.margin._4}px;
`
export const AddEmailRecipientsButton = styled(NoStyleButton)`
    border: 2px solid ${Colors.gray._100};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    font-size: ${Typography.xSmall.fontSize};
`
export const FlexExpand = styled.div`
    flex: 1;
`
