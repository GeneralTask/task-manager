import { Suspense, forwardRef, lazy, useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import Spinner from '../Spinner'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const AtlassianEditor = lazy(() => import('./AtlassianEditor'))

const PlainTextContainer = styled.div<{ hideUnfocusedOutline?: boolean; disabled?: boolean }>`
    border: ${Border.stroke.medium} solid
        ${({ hideUnfocusedOutline, disabled }) =>
            hideUnfocusedOutline || disabled ? 'transparent' : Colors.background.border};
    border-radius: ${Border.radius.medium};
    flex: 1;
    :focus-within {
        box-shadow: ${Shadows.deprecated_light};
    }
    :hover {
        border-color: ${({ disabled }) => (disabled ? 'transparent' : Colors.background.border)};
    }
    :focus-within {
        border-color: ${Colors.legacyColors.purple};
    }
    transition: border 150ms ease-out;
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
            hideUnfocusedOutline || noBorder ? 'transparent' : Colors.background.border};
    border-radius: ${Border.radius.medium};
    width: 100%;
    :hover,
    :focus-within {
        background-color: ${Colors.background.white};
    }
    :hover {
        border-color: ${({ noBorder }) => !noBorder && Colors.background.border};
    }
    :focus-within {
        border-color: ${Colors.legacyColors.purple};
    }
    transition: border var(--animate-border-easing);
    ${({ isFullHeight }) => (isFullHeight ? `height: 100%;` : '')}
    ${({ minHeight }) => (minHeight ? `min-height: ${minHeight}px;` : '')}
`

const GTTextField = forwardRef((props: GTTextFieldProps, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const getEditor = () => {
        if (props.type === 'plaintext') {
            return <PlainTextEditor ref={ref} {...props} />
        } else if (props.type === 'markdown' || props.type === 'atlassian') {
            return <AtlassianEditor {...props} />
        }
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
            onKeyDown={(e) => stopKeydownPropogation(e, props.keyDownExceptions, true)}
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
