import { Editor, EditorContext } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import styled from 'styled-components'
import { Spacing } from '../../../../styles'
import { RichTextEditorProps } from '../types'
import Toolbar from './Toolbar'

const serializer = new JSONTransformer()

const EditorAndToolbarContainer = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    :not(:focus-within) {
        .toolbar {
            display: none;
        }
    }
`
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
        > * {
            margin-bottom 14px;
        }
    }
    .assistive {
        display: none;
    }
`

const AtlassianEditor = (props: RichTextEditorProps) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - EditorContext uses old React type where children are not explicitly defined
        <EditorContext>
            <EditorAndToolbarContainer>
                <EditorContainer>
                    <Editor
                        defaultValue={props.value}
                        placeholder={props.placeholder}
                        disabled={props.disabled}
                        shouldFocus={props.autoFocus}
                        appearance="chromeless"
                        onChange={(e) => props.onChange(JSON.stringify(serializer.encode(e.state.doc)))}
                    />
                </EditorContainer>
                <Toolbar rightContent={props.actions} />
            </EditorAndToolbarContainer>
        </EditorContext>
    )
}

export default AtlassianEditor
