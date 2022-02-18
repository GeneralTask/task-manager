import { device, shadow, TEXT_DARKGRAY } from '../../helpers/styles'

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
    background-color: rgba(24, 24, 27, 0.03);
    &:hover,
    :focus-within {
        box-shadow: ${shadow.PRIMARY};
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
