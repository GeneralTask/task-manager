import { DateTime } from 'luxon'
import { SHARED_ITEM_INDEFINITE_DATE } from '../../constants'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TTaskSharedAccess, TTaskV4 } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface TaskharingDropdownProps {
    task: TTaskV4
}

const TaskSharingDropdown = ({ task }: TaskharingDropdownProps) => {
    const { mutate: modifyTask } = useModifyTask()

    const shareTask = (access: TTaskSharedAccess) => {
        modifyTask({
            id: task.id,
            shared_until: SHARED_ITEM_INDEFINITE_DATE,
            shared_access: access,
        })
    }
    const unshareTask = () => {
        modifyTask({
            id: task.id,
            shared_until: DateTime.fromMillis(1).toISO(),
        })
    }

    const isShared = +DateTime.fromISO(task.shared_until ?? '0') > +DateTime.local()

    const sharedDropdownItems: GTMenuItem[] = [
        {
            icon: icons.link_slashed,
            label: 'Disble shared link',
            hideCheckmark: true,
            onClick: unshareTask,
        },
    ]
    const notSharedDropdownItems: GTMenuItem[] = [
        {
            icon: icons.users,
            label: 'Share with company',
            hideCheckmark: true,
            onClick: () => shareTask('domain'),
        },
        {
            icon: icons.globe,
            label: 'Share with everyone',
            hideCheckmark: true,
            onClick: () => shareTask('public'),
        },
    ]

    return (
        <GTDropdownMenu
            items={isShared ? sharedDropdownItems : notSharedDropdownItems}
            unstyledTrigger
            trigger={<GTButton size="small" styleType="secondary" icon={icons.share} value="Share" asDiv />}
            description={!isShared ? 'This task is not being shared.' : undefined}
        />
    )
}

export default TaskSharingDropdown
