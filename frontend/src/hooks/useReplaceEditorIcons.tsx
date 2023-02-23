import { useEffect } from 'react'
import ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import Flex from '../components/atoms/Flex'
import { Icon } from '../components/atoms/Icon'
import { icons } from '../styles/images'

const EDITOR_ROOT_CLASS_NAME = 'ak-editor-content-area'
const selectorToIcon = [
    ['button[aria-label="Remove"]', icons.trash],
    ['button[aria-label="Unlink"]', icons.link_slashed],
    ['span[aria-label="open"]', icons.caret_down],
    ['span[aria-label="Open link in a new tab"]', icons.external_link],
    ['span[aria-label="Link address"]', icons.link],
    ['div[role="presentation"] > button', icons.x],
    ['span[aria-label="Text to display"]', icons.sort],
] as const

const IconContainer = styled(Flex)`
    height: 100%;
`

const useReplaceEditorButtonIcons = () => {
    useEffect(() => {
        const editorContentAreaElements = document.getElementsByClassName(EDITOR_ROOT_CLASS_NAME)
        const targetNode = editorContentAreaElements[0]

        const callback: MutationCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    for (const [selector, icon] of selectorToIcon) {
                        const buttons = (mutation.target as Element).querySelectorAll(selector)
                        for (const button of buttons) {
                            button.innerHTML = ReactDOMServer.renderToStaticMarkup(
                                <IconContainer column alignItems="center" justifyContent="center">
                                    <Icon icon={icon} color="gray" />
                                </IconContainer>
                            )
                        }
                    }
                }
            }
        }

        const observer = new MutationObserver(callback)
        observer.observe(targetNode, { subtree: true, childList: true })

        return () => observer.disconnect()
    }, [])
}

export default useReplaceEditorButtonIcons
