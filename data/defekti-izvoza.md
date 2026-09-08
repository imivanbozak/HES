# Poznati defekti izvoza kataloga

Ova četiri zapisa dolaze takva iz WooCommerce izvoza i **prenose se
doslovno** — `hes-content.md` §8.10 izričito traži da se ne ispravljaju
tiho, jer bi tiha izmjena značila da se podatak razlikuje od klijentovog
sustava a nitko ne zna zašto.

Molimo klijenta da potvrdi kako s njima postupiti.

| Artikl | Gdje se vidi | Što nije u redu | Postoji u izvozu |
| --- | --- | --- | --- |
| `Dali extension – 64 uređaja` | webshop / family-listing | Nema marku, dok je svaki drugi Loxone redak ima. | da |
| `Presence Sensor Air Senzor pristunosti` | webshop / family-listing | „pristunosti” je pogrešno napisano „prisutnosti”. | da |
| `BOSCH GWS 12V-76` | najam-alata / rental-listing | Nosi SKU „gws-18v”, koji ne odgovara nazivu proizvoda. | da |
| `Bosch Professional 12 V System` | najam-alata / rental-listing | Naziv serije, a ne proizvoda; označen oznakom „gbh”. | da |

Peti slučaj, `ggrađevinske` u proznom tekstu izvora, **jest** ispravljen
u `građevinske`: to nije podatak nego rečenica koja se ionako iznova piše.

Otvoreno i dalje: je li 16 + 59 artikala cijeli katalog ili izvadak
(`hes-structure.md` §4.3). O tome ovisi trebaju li liste stranicanje i
pretraživanje.
