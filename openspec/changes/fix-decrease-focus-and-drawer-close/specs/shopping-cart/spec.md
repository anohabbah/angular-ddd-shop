# Spec Delta

## MODIFIED Requirements

### Requirement: Quantity

A Cart line's quantity SHALL be a whole number of at least 1. On the cart page, the shopper SHALL be able to increase or decrease each line's quantity by 1. Decreasing SHALL be unavailable when the quantity is 1: the decrease action is exposed as disabled, does nothing when activated, and stays focusable, so keyboard focus is kept on it when the quantity it decreased reaches 1.

#### Scenario: Increasing a quantity

- **WHEN** a Cart line has a quantity of 2 and the shopper increases it
- **THEN** that Cart line has a quantity of 3

#### Scenario: Decreasing a quantity

- **WHEN** a Cart line has a quantity of 2 and the shopper decreases it
- **THEN** that Cart line has a quantity of 1

#### Scenario: Quantity of 1

- **WHEN** a Cart line has a quantity of 1
- **THEN** its decrease action is disabled and the line stays in the Cart

#### Scenario: Decreasing to 1 with the keyboard

- **WHEN** a Cart line for "Essence Mascara Lash Princess" has a quantity of 2 and the shopper activates "Decrease quantity of Essence Mascara Lash Princess" with the keyboard
- **THEN** that Cart line has a quantity of 1, the decrease action is disabled, and focus is still on "Decrease quantity of Essence Mascara Lash Princess"

#### Scenario: Activating the disabled decrease action

- **WHEN** a Cart line has a quantity of 1 and the shopper activates its decrease action
- **THEN** that Cart line still has a quantity of 1 and the Cart is unchanged
