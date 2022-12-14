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

    const shareNote = () => {
        modifyNote({ id: note.id, shared_until: DateTime.local().plus({ months: 3 }).toISO() })
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

    const isShared = +DateTime.fromISO(note.shared_until) > +DateTime.local()
    const sharedUntilString = getFormattedDuration(
        DateTime.fromISO(note.shared_until).diffNow('milliseconds', { conversionAccuracy: 'longterm' }),
        2
    )
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
                  renderer: () => (
                      <LabelWrap>{`This note is currently being shared. The link will expire in ${sharedUntilString}.`}</LabelWrap>
                  ),
              },
          ]
        : [
              {
                  icon: icons.copy,
                  label: 'Create & copy link',
                  hideCheckmark: true,
                  onClick: () => {
                      shareNote()
                      copyNoteLink()
                  },
              },
              {
                  label: 'Unshared note info',
                  disabled: true,
                  keepOpenOnSelect: true,
                  renderer: () => (
                      <LabelWrap>
                          This note is currently not being shared. Sharing a note will share your full name to whoever
                          opens the link. Links to shared notes expire after 3 months upon creation.
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
