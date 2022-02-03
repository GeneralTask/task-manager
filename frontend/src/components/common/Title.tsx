import React, { useRef } from 'react'
import ContentEditable from 'react-contenteditable'
import { TASKS_MODIFY_URL } from '../../constants'
import { TMessage, TTask } from '../../helpers/types'
import { makeAuthorizedRequest } from '../../helpers/utils'

const TitleStyle = {
    border: 'none',
    backgroundColor: 'transparent',
    resize: 'none',
    fontSize: '15px',
    font: 'inherit',
    color: '${TEXT_BLACK}',
    textOverflow: 'ellipsis',
    userSelect: 'text',
    width: '100%',
    cursor: 'text',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    margin: '0 15px',
    height: '1.2em',
}

const TitleStyleExpanded = {
    border: 'none',
    backgroundColor: 'transparent',
    resize: 'none',
    fontSize: '15px',
    font: 'inherit',
    color: '${TEXT_BLACK}',
    textOverflow: 'ellipsis',
    userSelect: 'text',
    width: '100%',
    cursor: 'text',
    wordWrap: 'break-word',
    minWidth: '0px',
    margin: '10px 15px',
    height: 'auto',
}


interface EditableTaskTitleProps {
    task: TTask
    isExpanded: boolean
    isEditable: boolean
}
export const EditableTaskTitle = (props: EditableTaskTitleProps): JSX.Element => {
    const title = useRef(props.task.title)

    const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
        }
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        e.target.scrollLeft = 0
        makeAuthorizedRequest({
            url: TASKS_MODIFY_URL + props.task.id + '/',
            method: 'PATCH',
            body: JSON.stringify({ title: title.current }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('PATCH /tasks/modify failed: ' + response.text())
                }
            })
            .catch(e => {
                console.log({ e })
            })
    }

    return (
        <ContentEditable
            tagName='div'
            disabled={!props.isEditable}
            style={props.isExpanded ? TitleStyleExpanded : TitleStyle}
            html={title.current}
            onKeyPress={handleKeyPress}
            onChange={(e) => title.current = e.target.value}
            onBlur={handleBlur}
            // to prevent inputs from triggering keyboard shortcuts
            onKeyDown={(e) => e.stopPropagation()}
        />
    )
}

interface MessageTitleProps {
    message: TMessage
    isExpanded: boolean
}

export const MessageTitle = (props: MessageTitleProps): JSX.Element => {
    const title = useRef(props.message.title)

    return (
        <ContentEditable
            tagName='div'
            disabled={true}
            style={props.isExpanded ? TitleStyleExpanded : TitleStyle}
            html={title.current}
            onChange={(e) => title.current = e.target.value}
        />
    )
}
