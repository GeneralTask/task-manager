import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { REACT_APP_FRONTEND_BASE_URL } from '../../constants'
import { useToast } from '../../hooks'
import { useModifyNote } from '../../services/api/notes.hooks'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import { getFormattedDuration } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'
import { Label } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem, MENU_WIDTH } from '../radix/RadixUIConstants'
import { SHARED_NOTE_INDEFINITE_DATE } from './NoteDetails'

const LabelWrap = styled(Label)`
    width: ${MENU_WIDTH};
`

interface NoteSharingDropdownProps {
    note: TNote
}
const NoteSharingDropdown = ({ note }: NoteSharingDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyNote } = useModifyNote()
    const toast = useToast()

    const shareNote = (expiryDate: string) => {
        modifyNote({ id: note.id, shared_until: expiryDate })
    }
    const unshareNote = () => {
        modifyNote({ id: note.id, shared_until: DateTime.fromMillis(1).toISO() })
    }
    const copyNoteLink = () => {
        navigator.clipboard.writeText(`${REACT_APP_FRONTEND_BASE_URL}/note/${note.id}`)
        toast.show(
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
    const goToSharedLink = () => {
        window.open(`${REACT_APP_FRONTEND_BASE_URL}/note/${note.id}`, '_blank')
    }

    const isShared = +DateTime.fromISO(note.shared_until ?? '0') > +DateTime.local()
    const sharedUntilString = note.shared_until
        ? note.shared_until === SHARED_NOTE_INDEFINITE_DATE
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
                              shareNote(SHARED_NOTE_INDEFINITE_DATE)
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

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            items={dropdownItems}
            unstyledTrigger
            trigger={
                <GTButton
                    size="small"
                    styleType="secondary"
                    icon={icons.share}
                    value="Share"
                    onClick={() => setIsOpen(!isOpen)}
                    asDiv
                />
            }
        />
    )
}

export default NoteSharingDropdown
