import ContentEditable from 'react-contenteditable'
import styled from 'styled-components'
import { BACKGROUND_HOVER, TEXT_BLACK, TEXT_GRAY } from '../../helpers/styles'

export const TaskBodyDiv = styled.div`
    margin: auto;
    width: 95%;
`
export const EmailViewDiv = styled.div`
    width: auto;
    overflow: auto;
    height: fit-content;
    max-height: 500px;
    border-radius: 6px;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 50px;
`
export const EmailSubjectHeader = styled.h4`
    margin-bottom: 20px;
    display: none;
`
export const EmailMessage = styled.div`
    margin: 10px;
`
export const Deeplink = styled.div`
    margin: auto;
    text-align: center;
    width: 100%;
    color: black;
    padding: 10px;
`
export const ReplyDiv = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
`
export const ExpandedBody = styled.div<{ isExpanded: boolean }>`
    display: ${(props) => (props.isExpanded ? 'block' : 'none')};
`
export const ReplyInputStyle = {
    width: '100%',
    border: `1px solid ${TEXT_BLACK}`,
    borderRadius: '6px',
    padding: '10px',
    cursor: 'text',
    height: '100px',
    overflow: 'scroll',
    outline: 'none',
    marginRight: '10px',
}

export const BodyContentEditable = styled(ContentEditable) <{ placeholder_text: string }>`
    margin-bottom: 12px;
    padding: 10px;
    word-wrap: break-word;
    overflow: none;
    white-space: pre-wrap;
    outline: none;
    border: none;
    border-radius: 12px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;

    &:hover,&:focus {
        background-color: ${BACKGROUND_HOVER};
    }
    &:empty::before {
        content: attr(placeholder_text);
        color: ${TEXT_GRAY};
    }
`
