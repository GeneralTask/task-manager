import { EditorContext, WithEditorActions } from '@atlaskit/editor-core'
import styled from 'styled-components'
import { RichTextEditorProps } from '../types'
import Editor from './Editor'
import Toolbar from './Toolbar'

const EditorAndToolbarContainer = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    :not(:focus-within) {
        .toolbar {
            display: none;
        }
    }
`
const AtlassianEditor = (props: RichTextEditorProps) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - EditorContext uses old React type where children are not explicitly defined
        <EditorContext>
            <EditorAndToolbarContainer>
                <WithEditorActions
                    render={(editorActions) => (
                        <>
                            <Editor editorActions={editorActions} {...props} />
                            <Toolbar
                                editorActions={editorActions}
                                isMarkdown={props.type === 'markdown'}
                                rightContent={props.actions}
                            />
                        </>
                    )}
                />
            </EditorAndToolbarContainer>
        </EditorContext>
    )
}

export default AtlassianEditor
