import { BORDER_ERROR, BORDER_PRIMARY, TEXT_LIGHTGRAY, device } from '../../helpers/styles'

import styled from 'styled-components'

export const OuterContainer = styled.div`
    width: 70%;
    @media ${device.mobile}{
        width: 60%;
    }
    margin: 20px auto;
`
export const Form = styled.form`
    display: flex;
    align-items: center;
    border: 1px solid ${BORDER_PRIMARY};
    border-radius: 2px;
    flex-wrap: wrap;
    justify-content: space-between;
    @media ${device.mobile}{
        flex-wrap: nowrap;
    }
`
export const Input = styled.input<{ error: boolean }>`
    font-size: 16px;
    border: ${props => props.error ? `1px solid ${BORDER_ERROR} !important` : 'none'};
    outline: none;
    width: 100%;
    height: 32px;
    padding: 8px 16px;
    &::placeholder {
        color: ${TEXT_LIGHTGRAY}
    }
`
export const InputTitle = styled(Input)`
    width: 100%;
    border-bottom: 1px solid ${BORDER_PRIMARY};
    @media ${device.mobile}{
        width: 50%;
        border-right: 1px solid ${BORDER_PRIMARY};
    }
`
export const InputTimeEstimate = styled(Input)`
    width: 100%;
    border-bottom: 1px solid ${BORDER_PRIMARY};
    @media ${device.mobile}{
        width: 25%;
        border-right: 1px solid ${BORDER_PRIMARY};
    }
`
export const InputDueDate = styled(Input)`
    width: 60%;
    @media ${device.mobile}{
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
    @media ${device.mobile}{
        width: 10%;
    }
`
export const ErrorContainer = styled.div`
    color: red;
    font-size: 14px;
    width: 100%;
    padding-left: 4px;
`
export const ErrorIcon = styled.img`
    margin: 4px;
    width: 20px;
`

