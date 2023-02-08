import { useEffect } from 'react'
import ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import Flex from '../components/atoms/Flex'
import { Icon, TIconType } from '../components/atoms/Icon'

const EDITOR_ROOT_CLASS_NAME = 'ak-editor-content-area'

const IconContainer = styled(Flex)`
    height: 100%;
`

const useReplaceEditorButtonIcon = (icon: TIconType, buttonClassName: string) => {
    useEffect(() => {
        const RENDERED_ICON = ReactDOMServer.renderToStaticMarkup(
            <IconContainer column alignItems="center" justifyContent="center">
                <Icon icon={icon} color="gray" />
            </IconContainer>
        )
        const editorContentAreaElements = document.getElementsByClassName(EDITOR_ROOT_CLASS_NAME)
        const targetNode = editorContentAreaElements[0]

        const callback: MutationCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    const buttons = (mutation.target as Element).getElementsByClassName(buttonClassName)
                    for (const button of buttons) {
                        button.innerHTML = RENDERED_ICON
                    }
                }
            }
        }

        const observer = new MutationObserver(callback)
        observer.observe(targetNode, { subtree: true, childList: true })

        return () => observer.disconnect()
    }, [])
}

export default useReplaceEditorButtonIcon
