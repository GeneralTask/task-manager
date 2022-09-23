import { icons } from '../../../styles/images'
import NoStyleAnchor from '../NoStyleAnchor'
import GTIconButton from './GTIconButton'

interface ExternalLinkButtonProps {
    link: string
}
const ExternalLinkButton = ({ link }: ExternalLinkButtonProps) => {
    return (
        <NoStyleAnchor href={link} target="_blank" rel="noreferrer">
            <GTIconButton icon={icons.external_link} size="small" />
        </NoStyleAnchor>
    )
}

export default ExternalLinkButton
