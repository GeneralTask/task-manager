import { Border, Colors, Spacing } from '../../../styles'
import styled, { css } from 'styled-components'

const ReactMultiEmailInput = css`
    width: auto !important;
    outline: none !important;
    border: 0 none !important;
    display: inline-block !important;
    line-height: 1;
    vertical-align: baseline !important;
    padding: 0.4em 0.1em !important;
    flex-grow: 1;
`

const ReactMultiEmailContainer = css`
    margin: 0;
    max-width: 100%;
    -webkit-box-flex: 1;
    -ms-flex: 1 0 auto;
    flex: 1 0 auto;
    outline: 0;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    text-align: left;
    line-height: 1.21428571em;
    padding: 0.4em 0.5em;
    background: #fff;
    border: 1px solid rgba(34, 36, 38, 0.15);
    color: rgba(0, 0, 0, 0.87);
    border-radius: 0.28571429rem;
    -webkit-transition: box-shadow 0.1s ease, border-color 0.1s ease;
    transition: box-shadow 0.1s ease, border-color 0.1s ease;
    font-size: 13px;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-content: flex-start;
`

export const EmailReplyContainer = styled.div`
    /* width: calc(100% - (${Spacing.padding._16}px * 2)); */
    padding: ${Spacing.padding._16}px;
    border: 2px solid ${Colors.purple._3};
    border-radius: ${Border.radius.large};
    .react-multi-email {
        ${ReactMultiEmailContainer}
    }
    .react-multi-email > input {
        ${ReactMultiEmailInput}
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
