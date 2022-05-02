
describe('Starters tasks load upon first login', () => {
    before('login the user', () => {
        cy.login()
        cy.visit('/')
        cy.acceptTermsOfService()
    })
    beforeEach(() => {
        Cypress.Cookies.preserveOnce('authToken')
    })
    it('loads three starter tasks in Today section', () => {
        cy.visit('/tasks/000000000000000000000001')
        cy.findByTestId('task-list-container').should('be.visible')
        cy.findAllByTestId('list-item').should('have.length', 3)
    })
    it('loads no tasks in Blocked section', () => {
        cy.visit('/tasks/000000000000000000000002')
        cy.findByTestId('task-list-container').should('be.empty')
    })
    it('loads no tasks in Backlog section', () => {
        cy.visit('/tasks/000000000000000000000003')
        cy.findByTestId('task-list-container').should('be.empty')
    })
    it('loads no tasks in Done section', () => {
        cy.visit('/tasks/000000000000000000000004')
        cy.findByTestId('task-list-container').should('be.empty')
    })
})
