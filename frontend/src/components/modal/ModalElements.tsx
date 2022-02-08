import styled from 'styled-components'

const HeaderPrimary = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 20px;
    line-height: 24px;
    color: #3F3F46;
    margin-bottom: 2px;
`
const HeaderSecondary = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.015em;
    color: #71717A;
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
    color: #71717A;
    margin-bottom: 6px;
`
const ModalTextArea = styled.textarea`
    box-sizing: border-box;
    flex-grow: 1;
    width: 100%;
    resize: none;
    overflow: auto;
    border: 1px solid #E4E3E7;
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
    color: ${(props) => props.white ? 'black' : 'white'};
    background-color: ${(props) => props.white ? 'white' : '#5C31D7'};
    border: ${(props) => props.white ? ' 1px solid #F4F4F5;' : 'none'};
    font: inherit;
    cursor: pointer;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.07);
    border-radius: 12px;
    padding: 8px 14px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 15px;
    line-height: 20px;
`
export { HeaderPrimary, HeaderSecondary, ResponseContainer, SectionHeader, ModalTextArea, ButtonContainer, ModalButton }
