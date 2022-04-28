import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import styled, { css } from 'styled-components'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'

// EmailInputContainer and EmailInput are adapted from 'react-multi-email/style.css'

export const EmailInputContainer = css`
    margin: 0;
    max-width: 100%;
    -webkit-box-flex: 1;
    -ms-flex: 1 0 auto;
    flex: 1 0 auto;
    outline: 0;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    text-align: left;
    line-height: 1.21428571em;
    padding: ${Spacing.padding._8}px;
    background: #fff;
    border: 1px solid ${Colors.gray._200};
    color: ${Colors.black};
    border-radius: ${Border.radius.small};
    -webkit-transition: box-shadow 0.1s ease, border-color 0.1s ease;
    transition: box-shadow 0.1s ease, border-color 0.1s ease;
    font-size: ${Typography.xSmall.fontSize};
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-content: flex-start;
`

export const EmailInput = css`
    width: auto !important;
    outline: none !important;
    border: 0 none !important;
    display: inline-block !important;
    line-height: 1;
    vertical-align: baseline !important;
    padding: 0.4em 0.1em !important;
    flex-grow: 1;
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
    display: flex;
`
export const FlexGrow = styled.div`
    flex: 1;
`

export const EmailReplyMinHeightContainer = styled.div`
    min-height: 800px;
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

export const ButtonSpacer = styled.div`
    margin-right: ${Spacing.margin._8}px;
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
`
