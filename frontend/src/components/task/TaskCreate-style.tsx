import { BORDER_ERROR, BORDER_PRIMARY, TEXT_LIGHTGRAY, device, BACKGROUND_WHITE } from '../../helpers/styles'

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
    align-items: center;
    border: 1px solid ${BORDER_PRIMARY};
    background-color: ${BACKGROUND_WHITE};
    border-radius: 8px;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 70%;
    @media ${device.mobile}{
        flex-wrap: nowrap;
        width: 60%;
    }
`
export const Input = styled.input<{ error: boolean }>`
    font-size: 16px;
    border: ${props => props.error ? `1px solid ${BORDER_ERROR} !important` : 'none'};
    border-radius: 8px;
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
    /* border-bottom: 1px solid ${BORDER_PRIMARY}; */
    @media ${device.mobile}{
        width: 100%;
        border-bottom: none;
        /* border-right: 1px solid ${BORDER_PRIMARY}; */
    }
`
export const PlusIcon = styled.img`
    width: 24px;
    height: 24px;
    margin-left: 8px;
`
// export const InputTimeEstimate = styled(Input)`
//     width: 100%;
//     border-bottom: 1px solid ${BORDER_PRIMARY};
//     @media ${device.mobile}{
//         width: 25%;
//         border-bottom: none;
//         border-right: 1px solid ${BORDER_PRIMARY};
//     }
// `
// export const InputDueDate = styled(Input)`
//     width: 60%;
//     @media ${device.mobile}{
//         width: 15%;
//     }
// `
// export const SaveBtnDiv = styled.div`
//     display: flex;
//     justify-content: flex-end;
//     align-items: center;
//     height: 100%;
//     width: 20%;
//     margin-right: 6px;
//     @media ${device.mobile}{
//         width: 10%;
//     }
// `
export const ErrorContainer = styled.div`
    color: red;
    font-size: 14px;
    width: 100%;
    padding-left: 4px;
    margin: auto;
    width: 70%;
    margin-top: 8px;    
    @media ${device.mobile}{
        width: 60%;
    }
`
export const ErrorIcon = styled.img`
    margin: 4px;
    width: 20px;
`
export const CloseButton = styled.img`
    cursor: pointer;
    height: 24px;
    display: flex;
    align-items: center;
    padding-left: 8px;
`
