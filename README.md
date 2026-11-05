# MuscleFuel

Kostenlose, statische Ernährungs-PWA für GitHub Pages. Die vier Bereiche sind Heute, Woche, Statistik und Ziele.

## Version 4

- Proteinreiche Gerichte ohne Quark/Skyr als Hauptbestandteil; Joghurt nur als kleiner Dip.
- Jede Mahlzeit enthält Zutaten für eine Portion, Mengen und Zubereitung.
- Einkaufsliste, Gewichtstracker und manuelle Portionspreise entfallen.
- Belegfotos werden mit Tesseract.js 6.0.1 auf dem Endgerät gelesen; dafür lädt der Browser beim ersten Mal Programm und deutsche Sprachdaten. Kein Backend, kein API-Schlüssel. JPG/PNG und Screenshots, keine PDFs.
- Erkannte Artikel, Datum und Summe werden vor dem Speichern geprüft. Abweichende Beträge werden explizit als nicht zugeordnet ausgewiesen. Einkaufsausgaben werden nicht als konsumierte Portionskosten ausgegeben.
- Belege mit identischen Angaben werden nicht doppelt gespeichert. Bei gleichem Datum/Geschäft/Betrag wird vor einer weiteren Buchung nachgefragt.
- Es werden nur Artikeltexte und Beträge gespeichert, keine Bonfotos und keine Zahlungsdaten aus dem erkannten Rohtext.

## Daten und Update

Alle Daten bleiben in `localStorage` unter dem bestehenden Schlüssel `musclefuel-free`. Vor der Migration wird der bisherige Stand unter `musclefuel-free-before-update` gesichert. Historische Rezepte behalten ihre IDs; Verlaufsdaten erhalten Nährwert-Snapshots. Bereits gegessene Mahlzeiten, Ziele und entfernte Mahlzeiten bleiben erhalten. Nicht gegessene aktuelle und kommende Mahlzeiten werden auf die neuen Gerichte umgestellt.

Sicherungen können unter Ziele exportiert und nach Validierung importiert werden. Ungültige Altdaten werden nicht überschrieben. Der 7-Tage-Plan wird nach Ablauf neu erstellt; der Verlauf bleibt bestehen. Neue manuelle Pläne behalten den heutigen Tag bei.

## Entwicklung

Ohne Build-Schritt: über einen lokalen HTTP-Server öffnen. Für GitHub Pages die Dateien im Repository-Stamm bereitstellen. Der Service Worker aktualisiert lokale App-Dateien und bietet einen Offline-Fallback. Für den erstmaligen Bon-Import ist Internet nötig.

Prüfung: `node --test tests/core.test.cjs`
