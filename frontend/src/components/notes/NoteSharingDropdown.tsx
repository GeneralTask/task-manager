import { useState } from 'react'
import { DateTime } from 'luxon'
import { SHARED_ITEM_INDEFINITE_DATE } from '../../constants'
import { usePreviewMode, useToast } from '../../hooks'
import { useModifyNote } from '../../services/api/notes.hooks'
import { icons } from '../../styles/images'
import { TNote, TNoteSharedAccess } from '../../utils/types'
import { getFormattedDuration } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'
import { LabelWrap } from '../radix/DropdownLabel'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'
import { getNoteURL } from './utils'

interface NoteSharingDropdownProps {
    note: TNote
}
const NoteSharingDropdown = ({ note }: NoteSharingDropdownProps) => {
    const { mutate: modifyNote } = useModifyNote()
    const { isPreviewMode } = usePreviewMode()
    const toast = useToast()

    const shareNote = (sharedUntil?: string, sharedAccess?: TNoteSharedAccess) => {
        modifyNote({ id: note.id, shared_until: sharedUntil, shared_access: sharedAccess })
    }
    const unshareNote = () => {
        modifyNote({ id: note.id, shared_until: DateTime.fromMillis(1).toISO() })
    }
    const copyNoteLink = () => {
        navigator.clipboard.writeText(getNoteURL(note.id))
        toast.show(
            {
                message: `Note URL copied to clipboard`,
            },
            {
                autoClose: 2000,
                pauseOnFocusLoss: false,
                theme: 'light',
            }
        )
    }
    const goToSharedLink = () => {
        window.open(getNoteURL(note.id), '_blank')
    }

    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()
    const sharedUntilString = note.shared_until
        ? note.shared_until === SHARED_ITEM_INDEFINITE_DATE
            ? 'The link will never expire'
            : `The link will expire in ${getFormattedDuration(
                  DateTime.fromISO(note.shared_until).diffNow('milliseconds', { conversionAccuracy: 'longterm' }),
                  2
              )}`
        : 'not shared'
    const dropdownItems: GTMenuItem[] = isShared
        ? [
              {
                  icon: icons.copy,
                  label: 'Copy link',
                  hideCheckmark: true,
                  onClick: copyNoteLink,
              },
              {
                  icon: icons.external_link,
                  label: 'Go to shared note page',
                  hideCheckmark: true,
                  onClick: goToSharedLink,
              },
              {
                  icon: icons.link_slashed,
                  label: 'Disable shared link',
                  hideCheckmark: true,
                  onClick: unshareNote,
                  iconColor: 'red',
                  textColor: 'red',
              },
              {
                  label: 'Shared note info',
                  disabled: true,
                  keepOpenOnSelect: true,
                  renderer: () => <LabelWrap>{`This note is currently being shared. ${sharedUntilString}.`}</LabelWrap>,
              },
          ]
        : [
              {
                  icon: icons.copy,
                  label: 'Create & copy link',
                  hideCheckmark: true,
                  subItems: [
                      {
                          icon: icons.infinity,
                          label: 'Share indefinitely',
                          hideCheckmark: true,
                          onClick: () => {
                              shareNote(SHARED_ITEM_INDEFINITE_DATE)
                              copyNoteLink()
                          },
                      },
                      {
                          icon: icons.timer,
                          label: 'Share for 3 months',
                          hideCheckmark: true,
                          onClick: () => {
                              shareNote(DateTime.local().plus({ months: 3 }).toISO())
                              copyNoteLink()
                          },
                      },
                  ],
              },
              {
                  label: 'Unshared note info',
                  disabled: true,
                  keepOpenOnSelect: true,
                  renderer: () => (
                      <LabelWrap>
                          This note is currently private. Sharing a note will reveal your full name to anyone with the
                          link.
                      </LabelWrap>
                  ),
              },
          ]

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
            items={isPreviewMode ? previewDropdownItems : dropdownItems}
            trigger={<GTButton styleType="secondary" icon={icons.share} value="Share" />}
        />
    )
}

export default NoteSharingDropdown
