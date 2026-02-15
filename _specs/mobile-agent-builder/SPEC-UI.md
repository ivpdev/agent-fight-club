I want to build mobile-first agent builder.

- screens
    - main
        - topbar
            - caption "Agent"
            - button "Helpers" (leads to helpers screen)
        - model selector: dropdown; values: Claude 4.5, DeepSeek
        - intructions: text area taking the most of the screen
        - buttombar
            - button "Play"
    - helpers
        - caption "Helpers"
        - list with helpers
            - elements
                - puzzle solver
                - code explorer
            - elements are clickable (leads to helper screen)
        - buttombar
            - button add
            - button "Back"
    - helper
        - topbar
            - toggle on/off
            - caption "Helper"
            - delete icon
        - name: editable text field
        - model selector: dropdown; values: Claude 4.5, DeepSeek
        - intructions: text area taking the most of the screen
        - buttombar
            - button "Back"
            


- TODO add a non-invasive way to configure context summarization and .. 
- TODO in team setup: share helpers
