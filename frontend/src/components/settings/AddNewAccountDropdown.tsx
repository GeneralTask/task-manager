import { ASANA_URL, CHEVRON_DOWN, JIRA_URL, LOGIN_URL, SUPPORTED_TYPES_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'

import { BACKGROUND_HOVER } from '../../helpers/styles'
import { makeAuthorizedRequest } from '../../helpers/utils'
import styled from 'styled-components'

const WINDOW_POLL_RATE = 10 // rate at which we check if a window has been closed (in milliseconds)

const Logo = styled.img`
    width: 20px;
    margin-right: 20px;
    margin-left: 5px;
`
const DropdownContainer = styled.div`
    min-width: 180px;
    position: relative;
`
const DropdownToggle = styled.div`
    border: 2.5px solid black;
    border-radius: 4px;
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
`
const DropdownText = styled.div`
    margin-right: 5px;
`
const Chevron = styled.img`
    width: 15px;
`
const Selector = styled.div`
    position: absolute;
    width: 100%;
    border: 1px ${BACKGROUND_HOVER} solid;
`
const OptionContainer = styled.div`
    padding: 5px;
    position: relative;
    display: flex;
    align-items: center;
    border-top: 0;
    background-color: white;
    cursor: pointer;
    &:hover {
        background-color: ${BACKGROUND_HOVER};
    }
    border: 1px ${BACKGROUND_HOVER} solid;
`

interface SupportedType {
    name: string
    logo: string
    authorization_url: string
}

interface OptionProps {
    st: SupportedType
    refetchLinkedAccounts: () => void
}

interface DropdownProps {
    supportedTypes: SupportedType[]
    refetchLinkedAccounts: () => void
}

interface Props {
    refetchLinkedAccounts: () => void
}

const AddNewAccountDropdown: React.FC<Props> = (props: Props) => {
    const [supportedTypes, setSupportedTypes] = useState<SupportedType[]>([])
    useEffect(() => {
        fetchSupportedTypes(setSupportedTypes)
    }, [])
    return <Dropdown supportedTypes={supportedTypes} refetchLinkedAccounts={props.refetchLinkedAccounts} />
}

const fetchSupportedTypes = async (setSupportedTypes: React.Dispatch<React.SetStateAction<SupportedType[]>>) => {
    try {
        const response = await makeAuthorizedRequest({
            url: SUPPORTED_TYPES_URL,
            method: 'GET',
        })
        if (response.ok) {
            setSupportedTypes(await response.json())
        } else {
            throw 'error fetching supported types'
        }
    } catch {
        // dummy data in
        setSupportedTypes([
            {
                authorization_url: LOGIN_URL,
                name: 'Google',
                logo: '/images/google.svg',
            },
            {
                authorization_url: JIRA_URL,
                name: 'Jira',
                logo: '/images/jira.svg',
            },
            {
                authorization_url: ASANA_URL,
                name: 'Asana',
                logo: '/images/asana.svg',
            },
        ])
    }
}

const Option = ({ st, refetchLinkedAccounts }: OptionProps) => {
    return (
        <OptionContainer
            onClick={() => {
                const win = window.open(
                    st.authorization_url,
                    st.name,
                    'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'
                )
                if (win != null) {
                    // check every WINDOW_POLL_RATE if the window has been closed
                    const timer = setInterval(() => {
                        if (win.closed) {
                            clearInterval(timer)
                            refetchLinkedAccounts()
                        }
                    }, WINDOW_POLL_RATE)
                }
            }}
        >
            <Logo src={st.logo} />
            <div>{st.name}</div>
        </OptionContainer>
    )
}

const Dropdown = ({ supportedTypes, refetchLinkedAccounts }: DropdownProps) => {
    const [isExpanded, setExpanded] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // so that the dropdown closes when clicked off from
    const handleClick = (e: MouseEvent) => {
        if (ref.current && e.target instanceof Element) {
            if (!ref.current.contains(e.target)) {
                setExpanded(false)
            }
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClick)
        return () => {
            document.removeEventListener('mousedown', handleClick)
        }
    }, [])

    return (
        <DropdownContainer ref={ref}>
            <DropdownToggle
                onClick={() => {
                    setExpanded(!isExpanded)
                }}
            >
                <DropdownText>Add new account</DropdownText>
                <Chevron src={CHEVRON_DOWN} />
            </DropdownToggle>
            {isExpanded && (
                <Selector
                    onBlur={() => {
                        setExpanded(false)
                    }}
                >
                    {supportedTypes.map((st, i) => (
                        <Option st={st} refetchLinkedAccounts={refetchLinkedAccounts} key={i} />
                    ))}
                </Selector>
            )}
        </DropdownContainer>
    )
}

export default AddNewAccountDropdown
