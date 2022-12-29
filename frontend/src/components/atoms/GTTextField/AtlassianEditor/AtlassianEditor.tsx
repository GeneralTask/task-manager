import '@atlaskit/css-reset'
import { Editor, EditorContext } from '@atlaskit/editor-core'
import styled from 'styled-components'
import { Border, Typography } from '../../../../styles'
import { MarkdownEditorProps } from '../types'

const Container = styled.div`
    height: 100%;
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

const AtlassianEditor = (props: MarkdownEditorProps) => {
    // const updateEditor = useCallback(
    //     (actions: EditorActions) => {
    //         actions.replaceDocument(props.value)
    //         return null
    //     },
    //     [props.itemId]
    // )

    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - EditorContext uses old React type where children are not explicitly defined
        <EditorContext>
            <Container>
                {/* <WithEditorActions render={updateEditor} /> */}
                <Editor defaultValue={props.value} placeholder="Add details" disabled appearance="comment" />
            </Container>
        </EditorContext>
    )
}

export default AtlassianEditor
