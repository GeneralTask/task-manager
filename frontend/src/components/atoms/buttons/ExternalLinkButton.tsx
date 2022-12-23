import { useCallback } from 'react'
import { useKeyboardShortcut } from '../../../hooks'
import { icons } from '../../../styles/images'
import NoStyleAnchor from '../NoStyleAnchor'
import GTIconButton from './GTIconButton'

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
            <GTIconButton icon={icons.external_link} />
        </NoStyleAnchor>
    )
}

export default ExternalLinkButton
