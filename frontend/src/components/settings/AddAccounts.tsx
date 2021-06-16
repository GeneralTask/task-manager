import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SUPPORTED_TYPES_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'

const Select = styled.select`
    height: 30px;
    display: flex;
    align-items: center;
    padding: 0 4px 0 4px;
    border: 2px solid black;
    border-radius: 4px;
`

interface SupportedType {
    name: string,
    logo: string,
    authorization_url: string,
}

const AddAccounts: React.FC = () => {
    const [supportedTypes, setSupportedTypes] = useState<SupportedType[]>([])
    useEffect(()=>{
        fetchSupportedTypes(setSupportedTypes)
    }, [])
    return (
        <Select>
            {supportedTypes.map(supportedType => <option>{supportedType.name}</option>)}
        </Select>
    )
}

const fetchSupportedTypes = async (
    setSupportedTypes: React.Dispatch<React.SetStateAction<SupportedType[]>>
) => {
    const response = await makeAuthorizedRequest({
        url: SUPPORTED_TYPES_URL,
        method: 'GET',
    })
    if(response.ok){
        setSupportedTypes(await response.json())
    }

}

export default AddAccounts