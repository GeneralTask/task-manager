import React from 'react'
import { icons } from '../../styles/images'
import { TLinkedAccount, TTaskSection } from '../../utils/types'
import NavigationLink from './NavigationLink'
import NavigationLinkDropdown from './NavigationLinkDropdown'

interface SectionLinksProps {
    taskSections: TTaskSection[]
    linkedAccounts: TLinkedAccount[]
    sectionId: string
    pathName: string
}

const NavigationSectionLinks = ({ taskSections, linkedAccounts, sectionId, pathName }: SectionLinksProps) => {
    return (
        <>
            <NavigationLinkDropdown title={'Tasks'} icon={icons.inbox} link={''} isCurrentPage={false}>
                {taskSections.map(section => (
                    <NavigationLink
                        key={section.id}
                        link={`/tasks/${section.id}`}
                        title={section.name}
                        icon={icons.label}
                        isCurrentPage={sectionId === section.id}
                        taskSection={section}
                        droppable={!section.is_done}
                    />
                ))}
            </NavigationLinkDropdown>
            <NavigationLinkDropdown title={'Messages'} icon={icons.inbox} link={'/messages/'} isCurrentPage={false}>
                <NavigationLink
                    link="/messages"
                    title="Messages"
                    icon={icons.inbox}
                    isCurrentPage={pathName.startsWith('/messages')}
                />
            </NavigationLinkDropdown>
            <NavigationLink
                link="/settings"
                title="Settings"
                icon={icons.gear}
                isCurrentPage={pathName.startsWith('/settings')}
            />
        </>
    )
}

export default NavigationSectionLinks
