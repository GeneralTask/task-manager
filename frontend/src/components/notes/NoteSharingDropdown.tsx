import { DateTime } from 'luxon'
import { SHARED_ITEM_INDEFINITE_DATE } from '../../constants'
import { usePreviewMode, useToast } from '../../hooks'
import { useModifyNote } from '../../services/api/notes.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { icons } from '../../styles/images'
import { TNote, TNoteSharedAccess } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import { toast } from '../molecules/toast/utils'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'
import { getNoteURL } from './utils'

interface NoteSharingDropdownProps {
    note: TNote
}
const NoteSharingDropdown = ({ note }: NoteSharingDropdownProps) => {
    const { mutate: modifyNote } = useModifyNote()
    const { data: userInfo } = useGetUserInfo()
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()

    const shareNote = (sharedUntil?: string, sharedAccess?: TNoteSharedAccess) => {
        modifyNote({ id: note.id, shared_until: sharedUntil, shared_access: sharedAccess })
    }
    const unshareNote = () => {
        modifyNote({ id: note.id, shared_until: DateTime.fromMillis(1).toISO() })
    }
    const copyNoteLink = () => {
        navigator.clipboard.writeText(getNoteURL(note.id))
        if (isPreviewMode) {
            toast('Note URL copied to clipboard')
        } else {
            oldToast.show(
                {
                    message: `Note URL copied to clipboard`,
                },
                {
                    autoClose: 2000,
                    pauseOnFocusLoss: false,
                    theme: 'dark',
                }
            )
        }
    }
    const goToSharedLink = () => {
        window.open(getNoteURL(note.id), '_blank')
    }

    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()

    const previewSharingMenuItems: GTMenuItem[] = [
        {
            icon: icons.user,
            label: 'Share with attendees',
            hideCheckmark: !isShared,
            selected: note.shared_access === 'meeting_attendees',
            onClick: () => {
                shareNote(SHARED_ITEM_INDEFINITE_DATE, 'meeting_attendees')
                copyNoteLink()
            },
        },
        ...(userInfo?.is_company_email
            ? [
                  {
                      icon: icons.users,
                      label: 'Share with company',
                      hideCheckmark: !isShared,
                      selected: note.shared_access === 'domain',
                      onClick: () => {
                          shareNote(SHARED_ITEM_INDEFINITE_DATE, 'domain')
                          copyNoteLink()
                      },
                  },
              ]
            : []),
        {
            icon: icons.globe,
            label: 'Share with everyone',
            hideCheckmark: !isShared,
            selected: note.shared_access === 'public',
            onClick: () => {
                shareNote(SHARED_ITEM_INDEFINITE_DATE, 'public')
                copyNoteLink()
            },
        },
    ]

    const previewDropdownItems: GTMenuItem[] = isShared
        ? [
              {
                  icon: icons.share,
                  label: 'Share note',
                  hideCheckmark: true,
                  subItems: previewSharingMenuItems,
              },
              {
                  icon: icons.external_link,
                  label: 'Go to shared note page',
                  hideCheckmark: true,
                  onClick: goToSharedLink,
              },
              {
                  icon: icons.copy,
                  label: 'Copy link',
                  hideCheckmark: true,
                  onClick: copyNoteLink,
              },
              {
                  icon: icons.link_slashed,
                  iconColor: 'red',
                  label: 'Disable shared link',
                  textColor: 'red',
                  hideCheckmark: true,
                  onClick: unshareNote,
              },
          ]
        : previewSharingMenuItems

    return (
        <GTDropdownMenu
            items={previewDropdownItems}
            trigger={<GTButton styleType="secondary" icon={icons.share} value="Share" />}
        />
    )
}

export default NoteSharingDropdown
