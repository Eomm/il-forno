# Project Guidelines for "Il Forno" Bakery Management Web Application

## Target Platforms

- Web (React)
- Devices: Tablets and Desktops

## Code Style

- The code must be in english
- The file names and folder names must be in english
- The comments must be in english
- The website display text must be in italian
- Prefer smaller files over larger ones
- Don't fix linting errors bayond what is necessary for code to run
- The CSS style is implemented with TailwindCSS utility classes
- The project uses this color palette:
  - bakery-cream: #FFF7E3 (light cream background)
  - bakery-wheat: #F5E6C8 (wheat tone)
  - bakery-dough: #E9D8B4 (dough color)
  - bakery-brown: #8B5E34 (medium brown)
  - bakery-choco: #5C3B21 (dark chocolate brown)
  - bakery-berry: #B23A48 (berry/red accent)
  - bakery-pistachio: #6BA368 (green pistachio)
  - bakery-accent: #D97706 (orange accent)

## Naming Conventions

- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with underscore (\_)
- Use ALL_CAPS for constants

## Code Quality

- Use meaningful variable and function names that clearly describe their purpose
- Include helpful comments for complex logic
- Add error handling for user inputs and API calls

## External Modules

- Use only the tools installed in the project dependencies
- Avoid adding new dependencies unless requested and approved

## The project structure

- `src/components/`: Reusable UI components
- `src/pages/`: Page components corresponding to routes
- `src/data/`: Files related to data fetching and state management
- `src/utils/`: Utility functions and helpers to avoid code duplication

## Pages

- Home Page: Displays an overview of bakery operations and quick links to other sections
- Gestione Pane: page to handle bread types and prices. It shows a list of bread types with:
  - Name
  - Price
  - Edit button: opens a modal to edit the bread type and price
  - Delete button: removes the bread type after confirmation
  - Add New Bread Type button: opens a modal to add a new bread type with name and price fields mandatory
- Gestione Clienti: page to display the list of customers stored in the database. The page shows all the customers (no pagination) with:
  - Name
  - Paese
  - Indirizzo (if available)
  - Edit button: opens a modal to edit customer details
  - Add New Customer button: navigates to the New Customer Page
- New Customer Page: Form to add a new customer to the database. The form shows:
  - Name (required)
  - Paese (required): dropdown with 4 options: Este, Villa, Deserto, Sant'Elena
  - Indirizzo (optional)
  - Ordine di consegna (required): number input defaulting to 1
  - Piano di consegna (required): the delivery plan is a complex input table where the user can add new record dinamically. The columns are:
    - Pane: autocomplete dropdown with all the bread types stored in the database mandatory
    - Quantita: number input mandatory
    - Lunedi: checkbox
    - Martedi: checkbox
    - Mercoledi: checkbox
    - Giovedi: checkbox
    - Venerdi: checkbox
    - Sabato: checkbox
    - Domenica: checkbox
    - Remove Row button: removes the corresponding row from the delivery plan table
- Settings Page: page to manage application settings, including:
  - Backup Data: button to export the current database to a JSON file
  - Restore Data: button to import a JSON file and restore the database (with confirmation prompt)
  - Clear Data: button to clear all data from the database (with confirmation prompt)
- Planner: this shows a planner view of the deliveries. The planner has a `DayPicker` component to select the date and the
  village select dropdown as filter (or "All Villages" option). When the user selects a date, the software calculates the corresponding day of the week selected (eg: monday),
  then it fetches all the `plan` records from all the customers (filtered by village if necessary) that have the corresponding day of the week checked in their delivery plan.
- Consegne fatte: this page shows the deliveries made. The user can select a date range with a `DayPicker` component.
  Once the range is selected, the software shows a list of deliveries made for that date, grouped by village. Each delivery entry shows:
  - Customer Name
  - Quantity
  - Total € (calculated as quantity * bread price)


## Project specific guidelines

- The project is called "Il Forno" and is a bakery management web application
- The database is stored in the Browser Local Storage and the `dexie` library is used to manage it
- The project must handle the `BASE_URL` environment variable for pages, links, and API calls. The final production URL will be `https://eomm.github.io/il-forno/`
