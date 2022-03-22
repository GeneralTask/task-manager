import React, { forwardRef } from 'react'
import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState } from 'draft-js'

const rangeStyleToTag = {
    BOLD: 'strong',
    ITALIC: 'em',
    UNDERLINE: 'u',
    STRIKETHROUGH: 'del',
    CODE: 'code',
}
const converFromAsanaMarkdown = (markdown: string) => {
    console.log('neato')
}
const convertToAsanaMarkdown = (html: string) => {
    const blocksFromHTML = convertFromHTML(html)
    const state = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
    const { inlineStyleRanges, text } = convertToRaw(state).blocks[0]

    const styleRanges = inlineStyleRanges.map((range) => {
        return {
            begin: range.offset + 1,
            end: range.offset + range.length + 1,
            style: rangeStyleToTag[range.style],
        }
    })
    const res = ['', ...text].reduce((a, v, i) => {
        console.log(i)
        styleRanges.filter((range) => range.begin === i).forEach((range) => (a += `<${range.style}>`))
        styleRanges.filter((range) => range.end === i).forEach((range) => (a += `</${range.style}>`))

        return a + v
    })

    return `<body>${res}</body>`
}

interface TaskHTMLBodyProps {
    html: string
    onBlur: () => void
}

const ContentEditable = forwardRef<HTMLDivElement, TaskHTMLBodyProps>(({ html, onBlur }: TaskHTMLBodyProps, ref) => {
    const [editorState, setEditorState] = React.useState(() => {
        const html2 = html.replace(/(?:\r\n|\r|\n)/g, '<br>')
        const blocksFromHTML = convertFromHTML(html2)
        const state = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)

        // const firstBlock = convertToRaw(state).blocks[0]
        // const styleRanges = firstBlock.inlineStyleRanges.map((range) => {
        //     return {
        //         begin: range.offset + 1,
        //         end: range.offset + range.length + 1,
        //         style: rangeStyleToTag[range.style],
        //     }
        // })
        // const { text } = firstBlock

        // const res = ['', ...text].reduce((a, v, i) => {
        //     console.log(i)
        //     styleRanges.filter(range => range.begin === i).forEach((range) => a += `<${range.style}>`)
        //     styleRanges.filter(range => range.end === i).forEach((range) => a += `</${range.style}>`)

        //     return a + v
        // })

        // console.log(`<body>${res}</body>`)

        return EditorState.createWithContent(state)
    })

    const onChange = (state: EditorState) => {
        setEditorState(state)
    }

    return <Editor editorState={editorState} onChange={onChange} />
})

export default ContentEditable
