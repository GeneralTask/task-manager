const apiURL = Cypress.env('api_url')
const defaultTimeout: number = Cypress.env('default_timeout')

describe('joint waitlist from landing page', () => {
    it('visit unauthorized landing page', () => {
        cy.visit('/')
    })
    it('setup mock success waitlist handler', () => {
        cy.window().then(window => {
            const { worker, rest } = window.msw
            worker.use(
                rest.post(`${apiURL}/waitlist`, (_, res, ctx) => {
                    return res(ctx.status(201))
                })
            )
        })
    })
    it('submit valid non-duplicate email in join waitlist form', () => {
        cy.get('input').type('joint_waitlist_test@generaltask.com')
        cy.get('button').contains('Join the Waitlist').click()
        cy.findByTestId('response-container').should('be.visible')
        cy.wait(defaultTimeout)
        cy.findByTestId('response-container').invoke('text').then((text) => {
            expect(text).to.equal('Success!')
        })
    })
})

export { }
