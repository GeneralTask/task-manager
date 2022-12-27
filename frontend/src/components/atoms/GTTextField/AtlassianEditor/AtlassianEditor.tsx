import { Editor } from '@atlaskit/editor-core'
import { MarkdownEditorProps } from '../types'

const AtlassianEditor = (props: MarkdownEditorProps) => {
    console.log(props)
    return <Editor appearance="comment" onChange={(e) => console.log(e)} />
}

export default AtlassianEditor
