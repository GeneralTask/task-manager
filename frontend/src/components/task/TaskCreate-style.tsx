import { BACKGROUND_WHITE, device, SHADOW_PRIMARY, TEXT_DARKGRAY } from '../../helpers/styles'

import styled from 'styled-components'

export const OuterContainer = styled.div`
    margin-top: 20px;
`
export const Side = styled.div`
    width: 15%;
`
export const InnerContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`
export const Form = styled.form`
    display: flex;
    min-width: 500px;
    align-items: center;
    /* box-shadow: ${SHADOW_PRIMARY}; */
    background-color: rgba(24, 24, 27, 0.03);
    &:hover,:focus-within {
        box-shadow: ${SHADOW_PRIMARY};
        background-color: rgba(43, 43, 43, 0.08);
    }
    border-radius: 12px;
    flex-wrap: wrap;
    width: 70%;
    @media ${device.mobile} {
        flex-wrap: nowrap;
        width: 60%;
    }
`
export const Input = styled.input`
    font-size: 16px;
    outline: none;
    border: none;
    background: none;
    height: 32px;
    padding: 8px 16px;
    &::placeholder {
        color: ${TEXT_DARKGRAY};
    }
`
export const InputTitle = styled(Input)`
    flex-grow: 1;
    border-bottom: none;
    border-radius: 12px;
`
export const PlusIcon = styled.img`
    width: 20px;
    height: 20px;
    margin-left: 12px;
`
export const ErrorContainer = styled.div`
    color: red;
    font-size: 14px;
    width: 100%;
    padding-left: 4px;
    margin: auto;
    width: 70%;
    margin-top: 8px;
    @media ${device.mobile} {
        width: 60%;
    }
`
export const ErrorIcon = styled.img`
    margin: 4px;
    width: 20px;
`
export const CloseButton = styled.img`
    cursor: pointer;
    height: 20px;
    display: flex;
    align-items: center;
    padding-left: 8px;
`
export const KeyboardShortcutContainer = styled.div`
    height: 24px;
    width: 24px;
    display: flex;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06);
    margin-right: 12px;
    border-radius: 5px;

    font-family: Space Grotesk;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: #A1A1AA;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
`
