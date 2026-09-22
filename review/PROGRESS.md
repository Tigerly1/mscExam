# Postęp przeglądu pytań (stan: 2026-09-22)

Cel: poprawić flagi odpowiedzi, dodać ukryte odpowiedzi (pula ≥7, `extra: true`), słownik pojęć, wyjaśnienia offline; potem zmiany w aplikacji.

## Grupy (review/slices -> review/out), walidacja: `python3 review/validate_slice.py SXX`

| Grupa | Tematy | Pytań | Status | Poprawki flag | Hasła słownika |
|---|---|---|---|---|---|
| S01 | algorithms, programming_basics | 41 | ✅ gotowe (0 błędów) | 5 | 34 |
| S02 | digital_systems, transmission, number_representation | 46 | ✅ gotowe | 3 | 27 |
| S03 | databases, computer_graphics, image_processing | 44 | ✅ gotowe | 5 | 35 |
| S04 | software_engineering | 49 | ✅ gotowe | 8 | 31 |
| S05 | java, oop, concurrent, functional | 38 | ⏳ do zrobienia (przerwane limitem) | | |
| S06 | c_cpp | 35 | ⏳ | | |
| S07 | numerical_methods | 44 | ⏳ | | |
| S08 | networks | 47 | ⏳ | | |
| S09 | operating_systems, unix_admin | 44 | ⏳ | | |
| S10 | formal_languages | 41 | ⏳ | | |
| S11 | logic, math | 48 | ⏳ | | |
| S12 | web_programming, compilation | 35 | ⏳ | | |
| S13 | machine_learning (1/2) | 32 | ⏳ | | |
| S14 | machine_learning (2/2) | 31 | ⏳ | | |

Razem: 180/575 pytań przejrzanych, 21 poprawek flag, 127 haseł.

## Do sprawdzenia drugim przeglądem (niepewne)
- q18 c (true→false, rejestr rozkazów), q218 (12 bitów — zależy od konwencji znaku)
- q63 (Decision Tree jako „nieużywane w analizie”), q1288 e (zmienne swobodne), q231 (log^n)

## Pozostałe kroki
1. S05–S14 (instrukcja: review/AGENT_INSTRUCTIONS.md).
2. Drugi przegląd zmian flag + dodatkowych odpowiedzi.
3. Scalenie do data/questions.json, data/glossary.json, data/explanations.json.
4. Aplikacja: checkboxy dla wszystkich pytań (bez zdradzania liczby poprawnych), losowanie podzbioru/kolejności odpowiedzi z puli, panel Słownik (klawisz S) + przeglądarka słownika, wyjaśnienia offline pod E, escapowanie HTML (np. `<label>`, `<M>` znikały).
