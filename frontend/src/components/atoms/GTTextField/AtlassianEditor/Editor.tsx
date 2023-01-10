import { Editor as AtlaskitEditor } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import styled from 'styled-components'
import { Spacing } from '../../../../styles'
import { RichTextEditorProps } from '../types'

const serializer = new JSONTransformer()

const EditorContainer = styled.div`
    flex: 1;
    padding: ${Spacing._8} ${Spacing._8} 0;
    box-sizing: border-box;
    /* height: 100%s needed to make editor match container height so entire area is clickable */
    > div > :nth-child(2) {
        height: 100%;
        > div {
            height: 100%;
        }
    }
    .ak-editor-content-area {
        height: 100%;
    }
    && .ProseMirror {
        height: 100%;
        * {
            margin: 0;
        }
        > blockquote,
        .code-block {
            margin: 12px 0;
        }
    }
    .assistive {
        display: none;
    }
`

const Editor = (props: RichTextEditorProps) => {
    return (
        <EditorContainer>
            <AtlaskitEditor
                defaultValue={props.value}
                placeholder={props.placeholder}
                disabled={props.disabled}
                shouldFocus={props.autoFocus}
                appearance="chromeless"
                onChange={(e) => props.onChange(JSON.stringify(serializer.encode(e.state.doc)))}
            />
        </EditorContainer>
    )
}

export default Editor
