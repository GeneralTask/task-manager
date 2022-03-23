import React, { useEffect } from 'react'
import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState } from 'draft-js'

const rangeStyleToTag = {
    BOLD: 'strong',
    ITALIC: 'em',
    UNDERLINE: 'u',
    STRIKETHROUGH: 'del',
    CODE: 'code',
}
const htmlToContentState = (html: string) => {
    const htmlWithBreak = html.replace(/(?:\r\n|\r|\n)/g, '<br>')
    const blocksFromHTML = convertFromHTML(htmlWithBreak)
    return ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
}
const convertToAsanaMarkdown = (state: ContentState) => {
    const blocks = convertToRaw(state).blocks

    const blockAsMarkdown = blocks.map((block) => {
        const { inlineStyleRanges, text } = block
        const styleRanges = inlineStyleRanges.map((range) => {
            return {
                begin: range.offset + 1,
                end: range.offset + range.length + 1,
                style: rangeStyleToTag[range.style],
            }
        })

        const stack: string[] = []
        return ['', ...text, '\n'].reduce((prev, curr, index) => {
            const overlappingEnding = styleRanges.filter((range) => range.end === index)
            while (overlappingEnding.length > 0) {
                for (let i = 0; i < overlappingEnding.length; i++) {
                    if (overlappingEnding[i].style === stack[stack.length - 1]) {
                        stack.pop()
                        prev += `</${overlappingEnding[i].style}>`
                        overlappingEnding.splice(i, 1)
                        break
                    }
                }
            }

            styleRanges
                .filter((range) => range.begin === index)
                .forEach((range) => {
                    stack.push(range.style)
                    return (prev += `<${range.style}>`)
                })
            return prev + curr
        })
    })
    return `<body>${blockAsMarkdown.join('')}</body>`
}

interface TaskHTMLBodyProps {
    html: string
    handleAsana: (html: string) => void
}
const ContentEditable = ({ html, handleAsana }: TaskHTMLBodyProps) => {
    const [editorState, setEditorState] = React.useState(() => {
        return EditorState.createWithContent(htmlToContentState(html))
    })
    useEffect(() => {
        setEditorState(EditorState.createWithContent(htmlToContentState(html)))
    }, [html])

    const onChange = (state: EditorState) => setEditorState(state)
    const onBlur = () => handleAsana(convertToAsanaMarkdown(editorState.getCurrentContent()))

    return <Editor editorState={editorState} onBlur={onBlur} onChange={onChange} />
}

export default ContentEditable
