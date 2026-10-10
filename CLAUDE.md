# Zeittracker – Bauplan
Quelle: T:\Projekte\Apps\Zeittracker.md

## Ziel
Einfache Handy-Web-App (PWA) zum Erfassen von Zeiten per Start/Stopp für berufliche und private Aktivitäten.

## Funktionen (Muss)
- Aktivitäten frei anlegen, umbenennen, löschen
- Start/Stopp-Knopf pro Aktivität, laufende Uhr sichtbar; nur eine Aktivität läuft gleichzeitig
- Summe pro Aktivität für heute und für die aktuelle Woche (Woche beginnt Montag)
- Laufende Messung übersteht Schließen und Neuladen der App

## Technik
- Reines HTML, CSS, JavaScript, keine Frameworks, keine Build-Tools
- Daten im localStorage des Browsers, keine Cloud
- PWA: manifest.json und Service Worker, damit sie auf den Handy-Startbildschirm gelegt werden kann
- Für Handy optimiert: große Buttons, Hochformat
- Oberfläche auf Deutsch
- Später Bereitstellung über GitHub Pages

## Regeln für Claude Code
- Einfach halten, keine unnötigen Bibliotheken
- Git-Repository anlegen und nach jedem fertigen Schritt committen
- Entscheidungen hier unter "Entscheidungen" festhalten

## Entscheidungen
- 2026-10-10: Erste Version nach obigem Bauplan
- 2026-10-10: Datenmodell im localStorage (Schlüssel `zeittracker.v1`): `aktivitaeten`, `eintraege` (Start/Ende als Zeitstempel), `laufend`. Summen werden daraus berechnet; Messungen über Mitternacht bzw. über den Wochenwechsel zählen anteilig.
- 2026-10-10: Löschen einer Aktivität entfernt auch ihre erfassten Zeiten (mit Rückfrage).
- 2026-10-10: Umbenennen und Löschen über die einfachen Browser-Dialoge (`prompt`/`confirm`), keine eigenen Dialoge.
- 2026-10-10: Service Worker arbeitet "Netzwerk zuerst, sonst Cache", damit Updates sofort ankommen und die App trotzdem offline läuft. Alle Pfade relativ, damit GitHub Pages im Unterordner funktioniert.
- 2026-10-10: Auf dem PC ist weder Python noch Node installiert, daher `server.ps1` als lokaler Testserver (PowerShell, Port 8080).
