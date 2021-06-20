import React, { useEffect, useState } from 'react'
import { CHEVRON_DOWN, JIRA_URL, LOGIN_URL, SUPPORTED_TYPES_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'

import styled from 'styled-components'

const Logo = styled.img`
    width: 20px;
    margin-right: 20px;
    margin-left: 5px;
`
const DropdownContainer = styled.div`
    width: 150px;
`
const DropdownToggle = styled.div`
    border: 2.5px solid black;
    border-radius: 4px;
    padding: 4px 8px 4px 8px;
    font-weight: 600;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
`
const Chevron = styled.img`
    width: 15px;
`
const Selector = styled.div`
    position: absolute;
    width: 150px;
`
const OptionContainer = styled.div`
    position: relative;
    display: flex; 
    align-items: center;
    border: 2px solid #CCCCCC;
    border-top: 0;
    padding: 8.5px;
    background-color: white;
    width: 100%;
    cursor: pointer;
    &:hover{
        background-color: #e3e3e3;
    }
`

interface SupportedType {
    name: string,
    logo: string,
    authorization_url: string,
}

interface OptionProps {
    st: SupportedType,
}

interface DropdownProps {
    supportedTypes: SupportedType[],
}

const AddNewAccountDropdown: React.FC = () => {
    const [supportedTypes, setSupportedTypes] = useState<SupportedType[]>([])
    useEffect(()=>{
        fetchSupportedTypes(setSupportedTypes)
    }, [])
    return (
        <Dropdown supportedTypes={supportedTypes}/>
    )
}

const fetchSupportedTypes = async (
    setSupportedTypes: React.Dispatch<React.SetStateAction<SupportedType[]>>
) => {
    try{
        const response = await makeAuthorizedRequest({
            url: SUPPORTED_TYPES_URL,
            method: 'GET',
        })
        if(response.ok){
            setSupportedTypes(await response.json())
        }
        else{
            throw 'error fetching supported types'
        }
    }
    // dummy data in 
    catch{
        setSupportedTypes([
            {
                authorization_url: LOGIN_URL,
                name: 'Google',
                logo: '/images/google.svg'
              },
              {
                authorization_url: JIRA_URL,
                name: 'Jira',
                logo: '/images/jira.svg'
              }
        ])
    }
}

const Option = ({st}: OptionProps) => {
    return (
        <OptionContainer onClick={() => {
            window.open(
              st.authorization_url,
              st.name,
              'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no'
            )
          }}>
            <Logo src={st.logo}/>
            <div>{st.name}</div>
        </OptionContainer>)
}

const Dropdown = ({supportedTypes}: DropdownProps) => {
    const [isExpanded, setExpanded] = useState(false)
    
    return (
        <DropdownContainer>
            <DropdownToggle onClick={()=>{setExpanded(!isExpanded)}}>
                Add new account
                <Chevron src={CHEVRON_DOWN}/>
            </DropdownToggle>
            {isExpanded && <Selector>
                {supportedTypes.map(st => <Option st={st}/>)}
            </Selector>}
        </DropdownContainer>
    )
}


export default AddNewAccountDropdown