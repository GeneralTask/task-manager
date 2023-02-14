import { Suspense, forwardRef, lazy, useRef } from 'react'
import styled from 'styled-components'
import { usePreviewMode } from '../../../hooks'
import { Border, Colors, Shadows } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import Spinner from '../Spinner'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const AtlassianEditor = lazy(() => import('./AtlassianEditor'))
const MarkdownEditor = lazy(() => import('./MarkdownEditor'))

const PlainTextContainer = styled.div<{ hideUnfocusedOutline?: boolean; disabled?: boolean }>`
    border: ${Border.stroke.medium} solid
        ${({ hideUnfocusedOutline, disabled }) =>
            hideUnfocusedOutline || disabled ? 'transparent' : Colors.border.extra_light};
    border-radius: ${Border.radius.small};
    flex: 1;
    :focus-within {
        box-shadow: ${Shadows.light};
    }
    :hover {
        border-color: ${({ disabled }) => (disabled ? 'transparent' : Colors.border.light)};
    }
    :focus-within {
        border-color: ${Colors.gtColor.primary};
    }
`

const Container = styled.div<{
    isFullHeight?: boolean
    minHeight?: number
    hideUnfocusedOutline?: boolean
    noBorder?: boolean
}>`
    background-color: inherit;
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid
        ${({ hideUnfocusedOutline, noBorder }) =>
            hideUnfocusedOutline || noBorder ? 'transparent' : Colors.border.extra_light};
    border-radius: ${Border.radius.small};
    width: 100%;
    :hover,
    :focus-within {
        background-color: ${Colors.background.white};
    }
    :hover {
        border-color: ${({ noBorder }) => !noBorder && Colors.border.light};
    }
    :focus-within {
        border-color: ${Colors.gtColor.primary};
    }
    ${({ isFullHeight }) => (isFullHeight ? `height: 100%;` : '')}
    ${({ minHeight }) => (minHeight ? `min-height: ${minHeight}px;` : '')}
`

const GTTextField = forwardRef((props: GTTextFieldProps, ref) => {
    const { isPreviewMode } = usePreviewMode()
    const containerRef = useRef<HTMLDivElement>(null)

    const getEditor = () => {
        if (props.type === 'plaintext') {
            return <PlainTextEditor ref={ref} {...props} />
        } else if (props.type === 'markdown') {
            if (isPreviewMode) {
                return <AtlassianEditor {...props} />
            }
            return <MarkdownEditor {...props} />
        } else if (props.type === 'atlassian') {
            return <AtlassianEditor {...props} />
        } else return null
    }

    if (props.type === 'plaintext') {
        return (
            <PlainTextContainer
                onKeyDown={(e) => stopKeydownPropogation(e, props.keyDownExceptions)}
                hideUnfocusedOutline={props.hideUnfocusedOutline}
                disabled={props.disabled}
            >
                {getEditor()}
            </PlainTextContainer>
        )
    }

    return (
        <Container
            ref={containerRef}
            onKeyDown={(e) => stopKeydownPropogation(e, props.keyDownExceptions)}
            isFullHeight={props.isFullHeight}
            minHeight={props.minHeight}
            hideUnfocusedOutline={props.hideUnfocusedOutline}
            noBorder={props.readOnly}
        >
            <Suspense fallback={<Spinner />}>{getEditor()}</Suspense>
        </Container>
    )
})

export default GTTextField
