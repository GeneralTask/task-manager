import '@atlaskit/css-reset'
import { Editor } from '@atlaskit/editor-core'
import styled from 'styled-components'
import { Typography } from '../../../../styles'
import { MarkdownEditorProps } from '../types'

const Container = styled.div`
    height: 100%;
    .ProseMirror {
        ${Typography.bodySmall};
    }
    /* align text to top of editor */
    [aria-label='Editable content'] {
        padding: 0 !important;
    }
    /* stop from intersecting with parent border */
    [data-testid='ak-editor-main-toolbar'] {
        border-radius: 8px !important;
    }
    #editor-scroll-gutter {
        display: none;
    }
`

const AtlassianEditor = (props: MarkdownEditorProps) => {
    console.log(props)
    return (
        <Container id="duck">
            <Editor appearance="full-width" onChange={(e) => console.log(e)} />
        </Container>
    )
}

export default AtlassianEditor
