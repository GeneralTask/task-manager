import React, { useEffect, useState } from 'react'
import { getLinkedAccountsURL, makeAuthorizedRequest } from '../../helpers/utils'

import Account from './Account'
import { LINKED_ACCOUNTS_URL } from '../../constants'
import { LinkedAccount } from '../../helpers/types'

interface State {
	loading: boolean,
	accounts: LinkedAccount[],
}

const Accounts: React.FC = () => {

	const [linkedAccounts, setLinkedAccounts] = useState<State>({ loading: true, accounts: [] })

	useEffect(() => {
		fetchLinkedAccounts(setLinkedAccounts)
		setInterval(() => { fetchLinkedAccounts(setLinkedAccounts) }, 1000 * 30)
	}, [])

	if (linkedAccounts.loading && linkedAccounts.accounts.length === 0) {
		return <div className="loader" />
	}
	else if (linkedAccounts.accounts.length === 0) {
		return <div>No linked accounts!</div>
	}
	else {
		const removeLink = (account: LinkedAccount) => {
			const confirmation = confirm(`Are you sure you want to unlink your ${account.name} account (${account.display_id})?`)
			if (confirmation) {
				const newState = {
					loading: linkedAccounts.loading,
					accounts: linkedAccounts.accounts.filter(linkedAccount => linkedAccount.id != account.id),
				}
				setLinkedAccounts(newState)
				makeAuthorizedRequest({
					url: getLinkedAccountsURL(account.id),
					method: 'DELETE',
				})
			}
		}
		return (
			<>
				{linkedAccounts.accounts.map(((account, index) =>
					<Account linkedAccount={account} key={index} removeLink={() => { removeLink(account) }} />
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
	let accounts = []
	if (response.ok) {
		accounts = await response.json()
	}
	setLinkedAccounts({ loading: false, accounts })
}

export default Accounts
