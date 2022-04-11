
describe('joint waitlist from landing page', () => {
    beforeEach(() => {
        cy.visit('localhost:3000/')
    })
    it('landing page header is present', () => {
        const tmp = cy.get('div')
        cy.log(tmp)
        cy.log('this is a test')
    })
})
