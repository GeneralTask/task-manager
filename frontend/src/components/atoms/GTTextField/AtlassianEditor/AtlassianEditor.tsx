import '@atlaskit/css-reset'
import { Editor } from '@atlaskit/editor-core'
import styled from 'styled-components'
import { Border, Spacing, Typography } from '../../../../styles'
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
        padding: 0 ${Spacing._8};
    }
    /* stop from intersecting with parent border */
    [data-testid='ak-editor-main-toolbar'] {
        border-radius: ${Border.radius.small};
        height: fit-content;
        padding: 0 ${Spacing._8};
    }
    /* needed to make editor match container height */
    > div > :nth-child(2) {
        height: 100%;
    }
`

const AtlassianEditor = (props: MarkdownEditorProps) => {
    console.log(props)
    return (
        <Container id="duck">
            <Editor appearance="comment" onChange={(e) => console.log(e)} placeholder="Add details" />
        </Container>
    )
}

export default AtlassianEditor
