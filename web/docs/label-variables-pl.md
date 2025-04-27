# Przewodnik po Podstawianiu Zmiennych w Etykietach

Ten dokument opisuje, jak używać dynamicznego podstawiania zmiennych w właściwości `Label.text` dla elementów elektrycznych oraz (w przyszłości) samodzielnych etykiet.

## Składnia

- **Odwołanie do zmiennej (stary styl):**

  - `@element.property` — odnosi się do właściwości elementu
  - `@page.property` — odnosi się do właściwości strony powiązanej z danym elementem (lub bieżącej strony, jeśli dotyczy)
  - `@project.property` — odnosi się do właściwości bieżącego projektu
  - `@property` — skrót do `@element.property`
  - Notacja kropkowa jest obsługiwana dla zagnieżdżonych właściwości (np. `@element.properties.customField`)

- **Odwołanie do zmiennej (nowy styl z escape):**

  - `@{...}` — odnosi się do łańcucha właściwości, gdzie dowolny znak można poprzedzić `\` (np. `@{foo\.bar}` odwołuje się do właściwości `foo.bar`)
  - Obsługuje indeksy tablic: `@{element.list[0]}`
  - Escape pozwala użyć dosłownych kropek, nawiasów lub dowolnych znaków: `@{foo\}bar}` odwołuje się do `foo}bar`, `@{foo\\bar}` do `foo\bar`
  - Po zamknięciu `}` każdy znak jest traktowany dosłownie (np. `@{page.pageNumber}.1` wyświetli wartość `page.pageNumber` i `.1` jako tekst)

- **Ucieczka symbolu @:**

  - Użyj `@@`, aby wyświetlić dosłowny znak `@` w tekście etykiety.

- **Nierozpoznane zmienne:**
  - Jeśli zmienna nie może zostać rozpoznana, zostanie wyświetlona w oryginalnej postaci (np. `@notAProperty` pozostaje `@notAProperty`, `@{notAProperty}` pozostaje `@{notAProperty}`).

## Przykłady

| Przykład tekstu etykiety  | Przykład wyświetlonego wyniku\*         | Uwagi                                  |
| ------------------------- | --------------------------------------- | -------------------------------------- |
| `@element.type`           | `Rezystor`                              | Stary styl                             |
| `@page.pageNumber`        | `2`                                     | Stary styl                             |
| `@project.name`           | `MójProjekt`                            | Stary styl                             |
| `@{element.type}`         | `Rezystor`                              | Nowy styl                              |
| `@{page.pageNumber}`      | `2`                                     | Nowy styl                              |
| `@{project.name}`         | `MójProjekt`                            | Nowy styl                              |
| `@{element.type}\.1`      | `Rezystor.1`                            | Ucieczka kropki                        |
| `@{foo\.bar}`             | wartość właściwości `foo.bar`           | Ucieczka kropki w nazwie               |
| `@{foo\}bar}`             | wartość właściwości `foo}bar`           | Ucieczka nawiasu                       |
| `@{element.list[0]}`      | pierwszy element z element.list         | Indeks tablicy                         |
| `@{element.list[1].name}` | nazwa drugiego elementu z listy         | Indeks + właściwość                    |
| `R@page.pageNumber.1`     | wartość właściwości `page.pageNumber.1` | Stary styl, kropka kontynuuje łańcuch  |
| `R@{page.pageNumber}.1`   | wartość `page.pageNumber` + `.1`        | Nowy styl, kropka dosłowna             |
| `@notAProperty`           | `@notAProperty`                         | Nierozpoznana                          |
| `@{notAProperty}`         | `@{notAProperty}`                       | Nierozpoznana                          |
| `@@element.type`          | `@element.type`                         | Dosłowny @                             |
| `@@{element.type}`        | `@{element.type}`                       | Dosłowny @                             |
| `@{foo\\bar}`             | wartość właściwości `foo\bar`           | Ucieczka backslasha                    |
| `@{foo\@bar}`             | wartość właściwości `foo@bar`           | Ucieczka @                             |
| `@{element.type}`         | `@{element.type`                        | Brak zamknięcia nawiasu                |
| `@{element.type}}`        | wartość `element.type` + `}`            | Dodatkowy nawias dosłowny              |
| `@{element.type\}}`       | wartość `element.type}`                 | Ucieczka nawiasu                       |
| `@{foo\\\\bar}`           | wartość właściwości `foo\\bar`          | Podwójny backslash                     |
| `@element\.type`          | `@element\.type`                        | Ucieczka w starym stylu nieobsługiwana |

\*Rzeczywisty wynik zależy od danych projektu, strony i elementu.

## Uwagi

- Dla elementów elektrycznych zmienne `@page.*` są rozwiązywane na podstawie właściwości `page` danego elementu, jeśli jest ona ustawiona. Jeśli element nie jest powiązany ze stroną, zmienne `@page.*` nie zostaną rozwiązane i będą wyświetlane w oryginalnej postaci.
- Obsługiwany jest tylko dostęp do właściwości i tablic (bez wyrażeń czy wywołań funkcji).
- Funkcja działa dla wszystkich encji `Label` zdefiniowanych w kodzie.
- W przypadku przyszłych samodzielnych etykiet będą obowiązywać te same zasady i składnia.
- **Kompatybilność wsteczna:** Stary styl (`@property` i `@object.property`) jest nadal obsługiwany. Nowy styl zalecany jest do zaawansowanych przypadków (ucieczka znaków, indeksy tablic itp.).

## Rozwiązywanie problemów

- Jeśli widzisz `@zmienna` lub `@{zmienna}` w wyświetlonej etykiecie, sprawdź, czy właściwość istnieje na elemencie, stronie lub projekcie.
- Jeśli chcesz dosłowny znak `@`, użyj `@@`.
- Dla dosłownych kropek, nawiasów lub innych znaków specjalnych użyj nowej składni `@{...}` z escape `\`.

---

Więcej szczegółów znajdziesz w komentarzach do kodu w pliku `electrical-element.interface.ts` oraz w implementacji renderera.
