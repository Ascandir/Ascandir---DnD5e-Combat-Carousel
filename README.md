# Ascandir - DnD5e Combat Carousel

Kampfkarussell für **Foundry VTT v14 (ausgelegt auf 14.368)** und **D&D 5e 6.0 (ausgelegt auf 6.0.6)**.

Die Charaktere stehen nebeneinander auf einem goldenen Balken, darunter ihre Initiative. Wer gerade dran ist, steht größer und leuchtend vor den anderen. Beim Zugwechsel gleitet das Karussell weiter.

## Installation

In Foundry unter *Module installieren* diese Manifest-URL einfügen:

```
https://github.com/Ascandir/Ascandir---DnD5e-Combat-Carousel/releases/latest/download/module.json
```

## Was alle sehen

- **Karussell** (sobald ein Kampf gestartet ist): Charakterbild, Initiative, wer dran ist (groß, golden) und wer als Nächstes kommt (silbern pulsierende Plakette). Mit einem Stern auf dem Balken ist markiert, wo die nächste Runde beginnt.
- **Große Zug-Anzeige** bei jedem Zugwechsel: links groß „*Name*'s Turn“, rechts das Charakterbild – ohne Hintergrund. Klick blendet sie sofort aus.
- **„Du bist als Nächstes dran!“** – nur der Spieler, dessen Charakter als Nächstes kommt, bekommt diesen großen Hinweis (mit kurzem Ton).
- Verborgene Gegner tauchen bei Spielern nicht auf. Ist ein verborgener Gegner gerade dran, sehen Spieler eine verhüllte Gestalt mit „?“. Namen, die laut Token-Einstellung verborgen sind, erscheinen als „???“.
- Klick auf eine Figur schwenkt zum Token.

## Bilder

Das Karussell nimmt das **Charakterbild** des Akteurs (oder das Token-Bild, einstellbar).

- **Freigestellte Ganzkörperbilder** (PNG/WebP mit transparentem Hintergrund) werden automatisch erkannt und stehen frei auf dem Balken – so wie im Entwurf.
- **Eckige Bilder** mit Hintergrund werden zum Rand hin weich ausgeblendet.
- **Eigenes Karussell-Bild:** Rechtsklick auf eine Figur im Karussell → *Bild wählen*. Geht für den SL und für den Besitzer des Charakters. Bei NSCs speichert der SL das Bild beim Akteur im Verzeichnis, damit alle Goblins es bekommen.

## Steuerung

- **Verschieben:** Karussell anfassen und ziehen. Der SL legt die Anordnung für alle fest.
- **Doppelklick** auf den Balken setzt die Position zurück (oben mittig, unter dem dnd5e-Kalender).
- **Pfeile links/rechts:** SL – vorheriger/nächster Zug. Spieler – rechter Pfeil beendet den eigenen Zug.
- **Große Anzeigen einrichten:** *Moduleinstellungen → Große Anzeigen einrichten → Vorschau öffnen*. Die Vorschau bleibt stehen, bis du auf *Fertig* klickst.
  - Ziehen am Bild verschiebt die ganze Anzeige, Ziehen am **Text** (blau umrandet) nur den Text – so setzt du ihn frei ans Bild.
  - **Horizontal zentrieren** setzt Text und Bild zusammen waagerecht in die Bildschirmmitte.
  - **Textgröße und Bildgröße** (nur SL, gilt für alle): Regler oder Mausrad über Text bzw. Bild.
  - Position und Größen gelten für beide Anzeigen („…'s Turn“ und „Du bist als Nächstes dran“) und für jeden Charakter.
- **Kleine Sanduhr rechts unten** (nur SL): Zugtimer ein/aus.
- **Timer-Schild** unter dem aktiven Charakter (nur SL): Klick hält den Timer an bzw. lässt ihn weiterlaufen. Pausiert das Spiel, steht der Timer ebenfalls.

## Was Spieler dürfen

Alle Einstellungen macht der SL. Spieler können nur **verschieben**, und auch nur, wenn der SL *Spieler dürfen Karussell und große Anzeigen verschieben* einschaltet:

- das Karussell ziehen,
- die große Anzeige in der Vorschau anordnen (ganze Anzeige und Text zum Bild), Größen nicht.

Die Anordnung eines Spielers hängt an **seinem Foundry-Benutzerkonto** – sie gilt also auf jedem Gerät, mit dem er sich anmeldet, und für jeden Charakter. Solange ein Spieler nichts verschoben hat, sieht er die Anordnung des SL. Mit *Zurücksetzen* kehrt er dazu zurück.

Der SL kann in der Vorschau mit **Anordnung der Spieler zurücksetzen** alle eigenen Anordnungen löschen – dann gilt wieder bei allen seine. Ist das Verschieben für Spieler ausgeschaltet, gilt ohnehin bei allen die Anordnung des SL.

## Einstellungen (nur SL)

*Spieleinstellungen → Moduleinstellungen → Ascandir - DnD5e Combat Carousel*

- Zugtimer aktivieren · Sekunden pro Zug · gilt für Spielercharaktere oder alle · bei Ablauf nur anzeigen oder Zug automatisch beenden
- Große Zug-Anzeige ein/aus · Text der Zug-Anzeige (`{name}` = Name, Standard `{name}'s Turn`)
- Spieler dürfen Karussell und große Anzeigen verschieben
- Sichtbare Charaktere · wie viele links (bereits gehandelt) stehen bleiben
- Bildquelle: Charakterbild oder Token-Bild
- Karussell anzeigen · Größe des Karussells · Text- und Bildgröße der großen Anzeigen · Hinweis „Du bist als Nächstes dran“ · Hinweiston

## Verträglichkeit

Das Karussell hängt sich nicht in die Foundry-Oberfläche oder in den Kalender von dnd5e ein, sondern liegt als eigene Ebene darüber. Standardmäßig sitzt es direkt unter dem Kalender.

## Makro

```js
const api = game.modules.get("ascandir-dnd5e-combat-carousel").api;
api.resetPosition();   // Position zurücksetzen
api.showTurn();        // große Zug-Anzeige testen
api.editAnnouncement(); // Vorschau zum Verschieben/Skalieren öffnen
```

## Lizenzen

Die Schrift *Alegreya* steht unter der SIL Open Font License (siehe `fonts/OFL-LICENSE.txt`).
