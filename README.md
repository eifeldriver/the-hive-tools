# the-hive-tools
Custom Javascript für das Forum vom The Hive Clan

# Features
**Startseite**
- "Benutzer online" wird in die Sidebar kopiert 
- Context-Menü für die User hinzugefügt
- Highlighting für selbst gewählte User
- Hervorhebung von Usern die gerade auch im Discord on sind
- Mouse-over zeigt beim Benutzer den Echtnamen an (falls dieser im Discord on ist)
- Mouse-over zeigt beim Benutzer das aktuelle Spiel an (falls dieses über Discord sichtbar ist)
- "Benutzer abwesend" wird in der Sidebar angezeigt *1
- Game-Service-Monitor für Division 2
- Game-Service-Monitor für Destiny 2 und Anthem vorbereitet
- Konfigurations-Dialog im Benutzer-Menü
- alle Modifikationen lassen sich an/abschalten

*1) Diese Ausgabe wird für 24 Std. gecached.

# Voraussetzungen
Um das Script nutzen zu können müsst ihr das Browser-Addon "TamperMonkey" (kurz "TM") installieren.

* [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* [Tampermonkey for Opera](https://addons.opera.com/de/extensions/details/tampermonkey-beta/)
* [Tampermonkey for Firefox](https://addons.mozilla.org/de/firefox/addon/tampermonkey/)

# Loslegen

1. **Installation des Addon**  
Geht auf die TM-Addon-Seite für euren Browser (siehe Links oben) und installiert das Addon. Nach der Installation erscheint im Browser (meißt rechts von der Adressleiste) das TM-Icon.

2. **Neues Benutzerscript erstellen**   
Per Linkssklick auf das TM-Icon erscheint das Auswahlmenü, indem der Punkt "Neues Script erstellen" geklickt wird.
![pic1](https://c1.staticflickr.com/8/7844/46390822204_603ee56e06.jpg)

3. **Importiere den Scriptcode**  
Die gesamte Logik steckt in einer einzigen Datei. Du findest diese Datei in diesem Repository:  
https://raw.githubusercontent.com/eifeldriver/the-hive-tools/master/the-hive-tools.min.js  
Erstelle per Linksklick auf das TM-Icon oben ein neues Benutzerscript und füge diesen Quelltext per Copy+Paste ein.
Speicher das geänderte Script ab.


4. **Testen**
Das Script wird nun bei jedem Seitenaufruf des Forum ausgeführt. Gehe ins Forum und schau, ob die oben genannten Features vorhanden sind.

[gehe zur The-Hive-Forum-Seite](https://www.enter-the-hive.de/forum/forum/)

# Konfiguration
Im Profil-Menü des Forum findet ihr die Optionen für "the-hive-tools". 
Alle Einstellungen werden instant gespeichert, aber erst beim nächsten Reload der Seite wirksam. 
 
Die folgenden Optionen gibt es:
* **erw. Benutzer online**  
Bei Aktivierung wird der Block "Benutzer online" rechts oben in die Sidebar kopiert.

* **Freunde hervorheben**  
Aktiviert die Möglichkeit Freunde auf die Watchlist zu setzen (Hervorhebung) und markiert User, die auch im Discord online sind.

* **Custom-Abwesenheit?**  
Bindet ein kompaktes Portlet für die Abwesenheit in die Sidebar ein.

* **Bubble-Farbe**  
Legt die Farbe für die Benachrichtungs-Bubbles fest.

* **Game-Service: Division**  
Aktiviert die Gameservice-Status-Anzeige für Division 2.

* **Game-Service: Destiny**  
Aktiviert die Gameservice-Status-Anzeige für Destiny 2. (nicht implementiert im Moment)

* **Game-Service: Anthem**  
Aktiviert die Gameservice-Status-Anzeige für Anthem. (nicht implementiert im Moment)

* **Version**  
Zeigt die installierte Versionnummer der "the-hive-tools" an.

* **Hilfe**  
Öffnet die Online-Hilfe.

