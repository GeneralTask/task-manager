import { Editor } from '@atlaskit/editor-core'
import { MarkdownEditorProps } from '../types'

const AtlassianEditor = (props: MarkdownEditorProps) => {
    console.log(props)
    return <Editor appearance="comment" />
}

export default AtlassianEditor
