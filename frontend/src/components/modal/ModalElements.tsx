import styled from 'styled-components'
import { ACCENT_MAIN, BLACK, GRAY_100, GRAY_200, GRAY_500, GRAY_700, SHADOW_MISC_2, WHITE } from '../../helpers/styles'

const HeaderPrimary = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 20px;
    line-height: 24px;
    color: ${GRAY_700};
    margin-bottom: 2px;
`
const HeaderSecondary = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.015em;
    color: ${GRAY_500};
`
const ResponseContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
    margin-bottom: 24px;
`
const SectionHeader = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 16px;
    line-height: 20px;
    color: ${GRAY_500};
    margin-bottom: 6px;
`
const ModalTextArea = styled.textarea`
    box-sizing: border-box;
    flex-grow: 1;
    width: 100%;
    resize: none;
    overflow: auto;
    border: 1px solid ${GRAY_200};
    border-radius: 8px;
    box-shadow: none;
    outline: none;
    padding: 8px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
`
const ButtonContainer = styled.div`
    display: flex;
    gap: 8px;
`
const ModalButton = styled.button<{ white?: boolean }>`
    color: ${(props) => props.white ? BLACK : WHITE};
    background-color: ${(props) => props.white ? WHITE : ACCENT_MAIN};
    border: ${(props) => props.white ? ` 1px solid ${GRAY_100};` : 'none'};
    font: inherit;
    cursor: pointer;
    box-shadow: ${SHADOW_MISC_2};
    border-radius: 12px;
    padding: 8px 14px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 15px;
    line-height: 20px;
`
export { HeaderPrimary, HeaderSecondary, ResponseContainer, SectionHeader, ModalTextArea, ButtonContainer, ModalButton }
