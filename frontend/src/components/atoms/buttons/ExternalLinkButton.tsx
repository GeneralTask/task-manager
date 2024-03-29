import { useCallback } from 'react'
import { useKeyboardShortcut } from '../../../hooks'
import { icons } from '../../../styles/images'
import NoStyleAnchor from '../NoStyleAnchor'
import GTButton from './GTButton'

interface ExternalLinkButtonProps {
    link: string
}
const ExternalLinkButton = ({ link }: ExternalLinkButtonProps) => {
    useKeyboardShortcut(
        'visitExternalLink',
        useCallback(() => window.open(link, '_blank'), [link])
    )
    return (
        <NoStyleAnchor href={link} rel="noreferrer">
            <GTButton shortcutName="visitExternalLink" icon={icons.external_link} styleType="icon" />
        </NoStyleAnchor>
    )
}

export default ExternalLinkButton
