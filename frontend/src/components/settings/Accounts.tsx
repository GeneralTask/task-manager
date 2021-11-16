import React, { useEffect, useState } from 'react'
import { emptyFunction, getLinkedAccountsURL, makeAuthorizedRequest } from '../../helpers/utils'
import store, { RootState } from '../../redux/store'

import Account from './Account'
import AddNewAccountDropdown from './AddNewAccountDropdown'
import DotSpinner from '../common/DotSpinner'
import { LINKED_ACCOUNTS_URL } from '../../constants'
import { TLinkedAccount } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { setLinkedAccounts } from '../../redux/actions'
import { useSelector } from 'react-redux'

const FETCH_LINKED_ACCOUNTS_INTERVAL = 1000 * 30 // every thirty seconds

const Accounts: React.FC = () => {

	// const [linkedAccounts, setLinkedAccounts] = useState<State>({ loading: true, accounts: [] })
	const [isLoading, setIsLoading] = useState(true)
	const linkedAccounts = useSelector((state: RootState) => state.settings_page.linked_accounts)

	useEffect(() => {
		fetchLinkedAccounts(setIsLoading)
		const interval = setInterval(() => { fetchLinkedAccounts(setIsLoading) }, FETCH_LINKED_ACCOUNTS_INTERVAL)
		return () => {
			clearInterval(interval)
		}
	}, [])

	async function removeLink(
		account: TLinkedAccount,
		setIsLoading: (x: boolean) => void = emptyFunction
	) {
		const confirmation = confirm(`Are you sure you want to unlink your ${account.name} account (${account.display_id})?`)
		if (confirmation) {
			const newAccounts = linkedAccounts.filter((linkedAccount: TLinkedAccount) => linkedAccount.id != account.id)

			store.dispatch(setLinkedAccounts(newAccounts))

			await makeAuthorizedRequest({
				url: getLinkedAccountsURL(account.id),
				method: 'DELETE',

			})
			await fetchLinkedAccounts(setIsLoading)
		}
	}

	if (isLoading && linkedAccounts.length === 0) {
		return <DotSpinner />
	}
	else if (linkedAccounts.length === 0) {
		return (
			<>
				<flex.centerXY>
					<h2>No linked accounts!</h2>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts(setIsLoading) }} />
				</flex.centerXY>
			</>
		)
	}
	else {
		return (
			<>
				<flex.centerXY>
					<h2>Accounts</h2>
					<AddNewAccountDropdown refetchLinkedAccounts={() => { fetchLinkedAccounts(setIsLoading) }} />
				</flex.centerXY>
				{linkedAccounts.map(((account, index) =>
					<Account linkedAccount={account} key={index} removeLink={() => { removeLink(account, setIsLoading) }} />
				))}
			</>
		)
	}
}

export const fetchLinkedAccounts = async (
	setIsLoading: (x: boolean) => void = emptyFunction
): Promise<void> => {
	setIsLoading(true)
	const response = await makeAuthorizedRequest({
		url: LINKED_ACCOUNTS_URL,
		method: 'GET',
	})
	if (response.ok) {
		try {
			const accounts: TLinkedAccount[] = await response.json()
			store.dispatch(setLinkedAccounts(accounts))
		}
		catch (e) {
			console.log({ e })
		}
	}
	setIsLoading(false)
}

export default Accounts
