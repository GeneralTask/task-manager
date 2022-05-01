import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import styled, { css } from 'styled-components'

import NoStyleButton from '../../atoms/buttons/NoStyleButton'

// EmailInputContainer and EmailInput are adapted from 'react-multi-email/style.css'
export const EmailInputContainer = css`
    margin: 0;
    background-color: ${Colors.white};
    width: calc(100% - ${Spacing.padding._8 * 2}px);
    flex: 1 0 auto;
    padding: ${Spacing.padding._8}px;
    border: 1px solid ${Colors.gray._200};
    color: ${Colors.black};
    border-radius: ${Border.radius.small};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    position: relative;
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
    margin: 0 ${Spacing.padding._4}px;
    padding: 0;
    flex: 1;
    font-size: ${Typography.xSmall.fontSize};
    font-family: Switzer-Variable;
`
export const EmailComposeContainer = styled.div`
    padding: ${Spacing.padding._16}px;
    margin: ${Spacing.margin._16}px 0;
    border-radius: ${Border.radius.large};
    .react-multi-email {
        ${EmailInputContainer}
    }
    .react-multi-email > input {
        ${EmailInput}
    }
    data-placeholder {
        color: red;
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
    margin: 0 ${Spacing.margin._4}px;
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
    margin-top: ${Spacing.margin._8}px;
    display: flex;
    align-items: center;
    gap: ${Spacing.margin._8}px;
`
export const RemoveEmailButton = styled.span`
    cursor: pointer;
    font-size: ${Typography.large.fontSize};
    margin-left: ${Spacing.margin._4}px;
`
export const BodyContainer = styled.div`
    height: 150px
`
