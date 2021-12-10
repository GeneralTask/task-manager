import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { Waitlist } from '../LandingPage'
import userEvent from '@testing-library/user-event'
import { WAITLIST_URL } from '../../constants'

import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(rest.post(WAITLIST_URL, (_, res) => res()))
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('error message shows after ERROR response', async () => {
    server.use(
        rest.post(WAITLIST_URL, (_, res, ctx) => {
            return res(ctx.status(400))
        }),
    )
    render(<Waitlist />)
    userEvent.click(screen.getByTestId('join-waitlist-button'))
    await waitFor(() => {
        expect(screen.getByTestId('waitlist-message').innerHTML)
            .toBe('There was an error adding you to the waitlist')
    })
})

test('success message shows after OK response', async () => {
    server.use(
        rest.post(WAITLIST_URL, (_, res, ctx) => {
            return res(ctx.status(200))
        }),
    )
    render(<Waitlist />)
    userEvent.click(screen.getByTestId('join-waitlist-button'))
    await waitFor(() => {
        expect(screen.getByTestId('waitlist-message').innerHTML)
            .toBe('You\'ve been added to the waitlist!')
    })
})

test('exists messages shows after 302 response', async () => {
    server.use(
        rest.post(WAITLIST_URL, (_, res, ctx) => {
            return res(ctx.status(302))
        }),
    )
    render(<Waitlist />)
    userEvent.click(screen.getByTestId('join-waitlist-button'))
    await waitFor(() => {
        expect(screen.getByTestId('waitlist-message').innerHTML)
            .toBe('This email already exists in the waitlist')
    })
})
