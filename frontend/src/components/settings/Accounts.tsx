import React, { useEffect, useState } from 'react'
import { LINKED_ACCOUNTS_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import Account from './Account'

interface LinkedAccount {
	id: string,
	display_id: string,
	name: string,
	logo: string,
}

interface State {
	loading: boolean,
	accounts: LinkedAccount[],
}

const Accounts: React.FC = () => {

	const [linkedAccounts, setLinkedAccounts] = useState<State>({loading: true, accounts: []})

	useEffect(()=>{
		fetchLinkedAccounts(setLinkedAccounts)
		setInterval(()=>{fetchLinkedAccounts(setLinkedAccounts)}, 1000 * 30)	
	}, [])
	
	if(!linkedAccounts.loading && linkedAccounts.accounts.length === 0){
		return <div className="loader"/>
	}
	else{
		return(
			<>
				{linkedAccounts.accounts.map(((account, index) => 
					<Account logo={account.logo} name={account.display_id} link={'' + console.log(account)} key={index} />
				))}
			</>
		)
	}
}

const fetchLinkedAccounts = async ( 
	setLinkedAccounts: React.Dispatch<React.SetStateAction<State>>) => {
	const response = await makeAuthorizedRequest({
		url: LINKED_ACCOUNTS_URL,
		method: 'GET',
	})
	if(response.ok){
		const accounts = await response.json()
		setLinkedAccounts({loading: false, accounts})
	}
}

export default Accounts