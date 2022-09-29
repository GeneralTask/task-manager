import { icons } from '../../../styles/images'
import NoStyleAnchor from '../NoStyleAnchor'
import GTIconButton from './GTIconButton'

interface ExternalLinkButtonProps {
    link: string
}
const ExternalLinkButton = ({ link }: ExternalLinkButtonProps) => {
    return (
        <NoStyleAnchor href={link} rel="noreferrer">
            <GTIconButton icon={icons.external_link} />
        </NoStyleAnchor>
    )
}

export default ExternalLinkButton
