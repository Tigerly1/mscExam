# Postęp (2026-09-29)

✅ Wszystkie 14 grup przejrzane (575 pytań), wyniki w review/out, scalone skryptem review/merge.py do:
- data/questions.json — 5495 odpowiedzi w puli (~9.5/pytanie, dodatkowe mają `extra: true`, pozycyjne "żadne z..." `fixed: true` i są pomijane w losowaniu), 141 poprawionych flag
- data/glossary.json — 332 hasła (co to jest / jak działa / pułapki), powiązane z pytaniami przez `terms`
- data/explanations.json — wyjaśnienie offline do każdego pytania

Aplikacja:
- zawsze checkboxy, brak podpowiedzi ile poprawnych
- losowanie podzbioru odpowiedzi (domyślnie 6, zmiana w Ustawieniach), losowa liczba poprawnych, losowa kolejność
- klawisz S / przycisk Słownik: hasła do bieżącego pytania + wyszukiwarka; przeglądarka słownika na ekranie głównym
- E: wyjaśnienie offline (AI przez OpenRouter tylko jako fallback)
- escapowanie HTML w treści (<label>, <M> itp. już nie znikają)

Do ewentualnego sprawdzenia (niepewne): q18c, q218, q63, q1288e, q231, q1270 b/d, q1247/1248 c, q179e, q104c, q1331f, q1050 (ucięta treść), q1031 (brak grafu).
Lista wszystkich zmian flag: pole `changes` w review/out/*.json.
