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

- **Verschieben:** Karussell anfassen und ziehen. Der SL legt die Position für alle fest. Darf ein Spieler verschieben (Einstellung), gilt seine Position nur für ihn.
- **Doppelklick** auf den Balken setzt die Position zurück (oben mittig, unter dem dnd5e-Kalender).
- **Pfeile links/rechts:** SL – vorheriger/nächster Zug. Spieler – rechter Pfeil beendet den eigenen Zug.
- **Große Anzeigen verschieben und skalieren:** *Moduleinstellungen → Große Anzeigen einrichten → Vorschau öffnen*. Die Vorschau bleibt stehen, bis du auf *Fertig* klickst.
  - Ziehen am Bild verschiebt die ganze Anzeige (SL für alle; Spieler nur, wenn erlaubt – dann nur für sich).
  - Ziehen am **Text** (blau umrandet) verschiebt nur den Text – so kannst du ihn frei ans Bild setzen. Der Versatz wächst mit, wenn du das Bild größer oder kleiner machst.
  - **Horizontal zentrieren** setzt Text und Bild zusammen waagerecht in die Bildschirmmitte (die Höhe bleibt).
  - **Textgröße und Bildgröße getrennt** über die zwei Regler oder per Mausrad: über dem Text ändert es die Textgröße, über dem Bild die Bildgröße.
  - Das geht auch direkt während einer echten Anzeige im Kampf: Solange die Maus darauf liegt, bleibt sie stehen.
  - Position und Größen gelten für beide Anzeigen („…'s Turn“ und „Du bist als Nächstes dran“).
- **Kleine Sanduhr rechts unten** (nur SL): Zugtimer ein/aus.
- **Timer-Schild** unter dem aktiven Charakter (nur SL): Klick hält den Timer an bzw. lässt ihn weiterlaufen. Pausiert das Spiel, steht der Timer ebenfalls.

## Einstellungen

*Spieleinstellungen → Moduleinstellungen → Ascandir - DnD5e Combat Carousel*

Nur SL:
- Zugtimer aktivieren · Sekunden pro Zug · gilt für Spielercharaktere oder alle · bei Ablauf nur anzeigen oder Zug automatisch beenden
- Große Zug-Anzeige ein/aus · Text der Zug-Anzeige (`{name}` = Name, Standard `{name}'s Turn`)
- Spieler dürfen Karussell und große Anzeigen verschieben
- Sichtbare Charaktere · wie viele links (bereits gehandelt) stehen bleiben
- Bildquelle: Charakterbild oder Token-Bild

Für jeden selbst:
- Karussell anzeigen · Größe des Karussells in %
- Große Zug-Anzeige anzeigen · Textgröße und Bildgröße der großen Anzeigen in % · Hinweis „Du bist als Nächstes dran“ · Hinweiston

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
