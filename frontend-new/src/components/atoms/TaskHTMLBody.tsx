import React from 'react'

interface TaskHTMLBodyProps {
    html: string
}
const TaskHTMLBody = ({ html }: TaskHTMLBodyProps) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default TaskHTMLBody
