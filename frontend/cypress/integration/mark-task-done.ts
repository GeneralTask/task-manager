describe('user can mark as task as done', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('user can mark task as done', () => {
        // Intercept mark task as done requests
        cy.intercept('PATCH', '/tasks/modify/*').as('markTaskDoneMutation')

        cy.findAllByTestId('list-item').first().within(() => {
            cy.get('button').click()
        })
        cy.wait('@markTaskDoneMutation')
    })
    it('task appears in done section', () => {
        cy.visit('/tasks/000000000000000000000004/')
        cy.findAllByTestId('list-item').should('have.length', 1)
    })
})
