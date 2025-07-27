describe('Shopping List App', () => {
  const date = new Date()

  beforeEach(() => {
    cy.visit('http://localhost:5173') // Assuming your Vite dev server runs on port 5173
  })

  it('should display the shopping list title', () => {
    cy.contains('Shopping List').should('exist')
  })

  it('should add a new item to the shopping list', () => {
    const itemName = `Item ${date.getTime()}`
    cy.get('input[type="text"]').type(itemName)
    cy.get('button[type="submit"]').click()
    cy.contains(itemName).should('exist')
  })

  it('should delete an item from the list', () => {
    const itemName = `Item ${date.getTime()}`

    // Click the delete button
    cy.get(`[data-testid="delete-button-${itemName}"]`).click()
    cy.contains(itemName).should('not.exist')

  })
})
