# Label Variable Substitution Guide

This document describes how to use dynamic variable substitution in the `Label.text` property for electrical elements and (in the future) standalone labels.

## Syntax

- **Variable Reference (Old Style):**

  - `@element.property` — references a property of the element
  - `@page.property` — references a property of the current page (or the page the element belongs to)
  - `@project.property` — references a property of the current project
  - `@property` — shorthand for `@element.property`
  - Dot notation is supported for nested properties (e.g., `@element.properties.customField`)

- **Variable Reference (New Style with Escaping):**

  - `@{...}` — references a property chain, where any character can be escaped with `\` (e.g., `@{foo\.bar}` references property `foo.bar`)
  - Supports array indices: `@{element.list[0]}`
  - Escaping allows you to use literal dots, braces, or any character: `@{foo\}bar}` references `foo}bar`, `@{foo\\bar}` references `foo\bar`
  - After the closing `}`, any character is treated as a literal (e.g., `@{page.pageNumber}.1` renders the value of `page.pageNumber` followed by `.1`)

- **Escaping the @ Symbol:**

  - Use `@@` to render a literal `@` in the label text.

- **Unresolved Variables:**
  - If a variable cannot be resolved, it will be rendered as-is (e.g., `@notAProperty` remains `@notAProperty`, `@{notAProperty}` remains `@{notAProperty}`).

## Examples

| Label Text Example        | Rendered Output Example\*             | Notes                               |
| ------------------------- | ------------------------------------- | ----------------------------------- |
| `@element.type`           | `Resistor`                            | Old style                           |
| `@page.pageNumber`        | `2`                                   | Old style                           |
| `@project.name`           | `MyProject`                           | Old style                           |
| `@{element.type}`         | `Resistor`                            | New style                           |
| `@{page.pageNumber}`      | `2`                                   | New style                           |
| `@{project.name}`         | `MyProject`                           | New style                           |
| `@{element.type}\.1`      | `Resistor.1`                          | Escaped dot as literal              |
| `@{foo\.bar}`             | value of property `foo.bar`           | Escaped dot in property name        |
| `@{foo\}bar}`             | value of property `foo}bar`           | Escaped brace                       |
| `@{element.list[0]}`      | first item in element.list            | Array index                         |
| `@{element.list[1].name}` | name of second item in element.list   | Array index + property              |
| `R@page.pageNumber.1`     | value of `page.pageNumber.1` property | Old style, dot continues chain      |
| `R@{page.pageNumber}.1`   | value of `page.pageNumber` + `.1`     | New style, dot is literal           |
| `@notAProperty`           | `@notAProperty`                       | Unresolved                          |
| `@{notAProperty}`         | `@{notAProperty}`                     | Unresolved                          |
| `@@element.type`          | `@element.type`                       | Literal @                           |
| `@@{element.type}`        | `@{element.type}`                     | Literal @                           |
| `@{foo\\bar}`             | value of property `foo\bar`           | Escaped backslash                   |
| `@{foo\@bar}`             | value of property `foo@bar`           | Escaped @                           |
| `@{element.type`          | `@{element.type`                      | Unclosed brace                      |
| `@{element.type}}`        | value of `element.type` + `}`         | Extra brace as literal              |
| `@{element.type\}}`       | value of `element.type}`              | Escaped brace                       |
| `@{foo\\\\bar}`           | value of property `foo\\bar`          | Double backslash                    |
| `@element\.type`          | `@element\.type`                      | Escaping in old style not supported |

\*Actual output depends on your project, page, and element data.

## Notes

- For electrical elements, `@page.*` variables are resolved using the element's own `page` property if present. If the element is not associated with a page, `@page.*` variables will not be resolved and will be shown as-is.
- Only property and array access is supported (no expressions or function calls).
- This feature works for all `Label` entities as defined in the codebase.
- For future standalone labels, the same syntax and rules will apply.
- **Backward compatibility:** The old style (`@property` and `@object.property`) is still supported. The new style is recommended for advanced cases (escaping, array indices, etc.).

## Troubleshooting

- If you see `@variable` or `@{variable}` in your rendered label, check that the property exists on the element, page, or project.
- If you want a literal `@`, use `@@`.
- For literal dots, braces, or other special characters, use the new `@{...}` syntax with `\` escaping.

---

For further details, see the code comments in `electrical-element.interface.ts` and the renderer implementation.
