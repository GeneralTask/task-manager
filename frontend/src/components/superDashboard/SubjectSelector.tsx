import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'
import { useSuperDashboardContext } from './SuperDashboardContext'

const SubjectSelector = () => {
    const { dashboard, selectedSubject, setSelectedSubject } = useSuperDashboardContext()

    const items: GTMenuItem[] = dashboard.subjects.map((subject) => ({
        label: subject.name,
        icon: icons[subject.icon],
        onClick: () => setSelectedSubject(subject),
    }))

    return (
        <GTDropdownMenu
            items={items}
            hideCheckmark
            align="end"
            trigger={<GTButton value={selectedSubject.name} icon={icons[selectedSubject.icon]} styleType="secondary" />}
        />
    )
}

export default SubjectSelector
