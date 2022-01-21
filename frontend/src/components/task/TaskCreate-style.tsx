import { BORDER_ERROR, BORDER_PRIMARY, TEXT_LIGHTGRAY, BACKGROUND_WHITE, device, SHADOW_PRIMARY } from '../../helpers/styles'

import styled from 'styled-components'

export const OuterContainer = styled.div`
    margin: 20px 0;
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
    box-shadow: ${SHADOW_PRIMARY};
    background-color: ${BACKGROUND_WHITE};
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
    width: 100%;
    height: 32px;
    padding: 8px 16px;
    &::placeholder {
        color: ${TEXT_LIGHTGRAY};
    }
`
export const InputTitle = styled(Input)`
    width: 100%;
    border-bottom: none;
    border-radius: 12px;
    @media ${device.mobile} {
        width: 100%;
        border-bottom: none;
    }
`
export const InputTimeEstimate = styled(Input)`
    width: 100%;
    border-bottom: 1px solid ${BORDER_PRIMARY};
    @media ${device.mobile} {
        width: 25%;
        border-bottom: none;
        border-right: 1px solid ${BORDER_PRIMARY};
    }
`
export const InputDueDate = styled(Input)`
    width: 60%;
    @media ${device.mobile} {
        width: 15%;
    }
`
export const SaveBtnDiv = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    width: 20%;
    margin-right: 6px;
    @media ${device.mobile} {
        width: 10%;
    }
`
export const PlusIcon = styled.img`
    width: 24px;
    height: 24px;
    margin-left: 8px;
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
