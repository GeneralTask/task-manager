import '@atlaskit/css-reset'
import { Editor, EditorContext } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import styled from 'styled-components'
import { Border, Typography } from '../../../../styles'
import { RichTextEditorProps } from '../types'
import Toolbar from './Toolbar'

const serializer = new JSONTransformer()

const Container = styled.div`
    .akEditor {
        border: none;
        border-radius: ${Border.radius.small};
        height: 100%;
    }
    /* && allows us to override existing styles - basically same as !important for entire selectors */
    && .ProseMirror {
        ${Typography.bodySmall};
    }
    /* align text to top of editor */
    .ak-editor-content-area {
        padding: 0;
    }
    /* stop from intersecting with parent border */
    [data-testid='ak-editor-main-toolbar'] {
        border-radius: ${Border.radius.small};
        height: fit-content;
        padding: 0;
    }
    /* needed to make editor match container height */
    > div > :nth-child(2) {
        height: 100%;
    }
`

const AtlassianEditor = (props: RichTextEditorProps) => {
    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - EditorContext uses old React type where children are not explicitly defined
        <EditorContext>
            <Container>
                <Editor
                    defaultValue={props.value}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                    shouldFocus={props.autoFocus}
                    appearance="chromeless"
                    onChange={(e) => props.onChange(JSON.stringify(serializer.encode(e.state.doc)))}
                />
                <Toolbar rightContent={props.actions} />
            </Container>
        </EditorContext>
    )
}

export default AtlassianEditor
