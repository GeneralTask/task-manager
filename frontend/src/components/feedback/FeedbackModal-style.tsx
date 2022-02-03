import styled from 'styled-components'

const ModalContainer = styled.div`
display: flex;
flex-direction: column;
position: relative;
margin: auto;
width: 365px;
height: 418px;
background-color: white;
padding: 24px;
transform: translate(0, -50%);
top: 35%;
box-shadow: 0px 4px 20px rgba(43, 43, 43, 0.08);
border-radius: 12px;
`
const FeedbackHeader = styled.div`
margin-bottom: 24px;
`
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
const FeedbackSection = styled.div`
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
const SectionResponse = styled.textarea`
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
const FeedbackModalButton = styled.button<{ white?: boolean }>`
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

export { ModalContainer, FeedbackHeader, HeaderPrimary, HeaderSecondary, FeedbackSection, SectionHeader, SectionResponse, ButtonContainer, FeedbackModalButton }
