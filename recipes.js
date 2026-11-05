/* IDs 0–7 bleiben für den bisherigen Verlauf unverändert. */
const LEGACY_RECIPES=[
["Overnight Oats","Frühstück",660,37,77,21,[["Haferflocken",90,"g"],["Milch",250,"ml"],["Skyr",200,"g"],["Banane",1,"Stück"],["Erdnussmus",20,"g"]],"Alles mischen und über Nacht kühl stellen."],
["Quark-Bowl","Frühstück",610,44,73,15,[["Magerquark",300,"g"],["Haferflocken",80,"g"],["TK-Beeren",150,"g"],["Honig",15,"g"],["Walnüsse",20,"g"]],"Quark cremig rühren und übrige Zutaten darübergeben."],
["Hähnchen-Reis-Bowl","Mittag",820,55,97,20,[["Hähnchenbrust",200,"g"],["Reis trocken",130,"g"],["Brokkoli",200,"g"],["Olivenöl",15,"ml"],["Joghurt",80,"g"]],"Reis kochen, Hähnchen vollständig durchbraten und Brokkoli garen. Mit Joghurt servieren."],
["Chili con Carne","Mittag",830,51,91,25,[["Mageres Hack",180,"g"],["Kidneybohnen",150,"g"],["Mais",100,"g"],["Passierte Tomaten",200,"g"],["Reis trocken",90,"g"],["Zwiebel",1,"Stück"]],"Reis kochen, Hack und Zwiebel anbraten, übrige Zutaten zugeben und 15 Minuten köcheln."],
["Thunfisch-Pasta","Abend",780,52,95,18,[["Vollkornnudeln trocken",130,"g"],["Thunfisch",1,"Dose"],["Passierte Tomaten",200,"g"],["Olivenöl",15,"ml"],["Parmesan",20,"g"]],"Nudeln kochen, Thunfisch und Tomaten erhitzen, mit Öl und Parmesan servieren."],
["Kartoffeln mit Ei & Quark","Abend",750,45,80,24,[["Kartoffeln",400,"g"],["Eier",3,"Stück"],["Magerquark",250,"g"],["Gurke",150,"g"],["Olivenöl",10,"ml"]],"Kartoffeln kochen, Eier braten, Quark mit Kräutern anrühren und Gurke dazugeben."],
["Skyr mit Apfel & Mandeln","Snack",390,30,39,12,[["Skyr",250,"g"],["Apfel",1,"Stück"],["Mandeln",30,"g"]],"Apfel schneiden und mit Skyr und Mandeln mischen."],
["Hüttenkäse-Brot","Snack",410,30,43,12,[["Vollkornbrot",120,"g"],["Hüttenkäse",200,"g"],["Tomate",1,"Stück"]],"Brot mit Hüttenkäse bestreichen und Tomate darauflegen."]
];

// Nährwerte pro 100 g/ml; Eier pro Stück. Grobe Standardwerte, produktabhängig.
const FOOD={
 'Haferflocken':[372,13.5,58.7,7],'Milch (1,5 %)':[47,3.4,4.9,1.5],
 'Banane':[89,1.1,20.2,.3],'Erdnussmus':[620,26,12,50],'Eier':[78,6.5,.5,5.3],
 'Vollkornbrot':[220,8.5,39,3.5],'Tomaten':[18,.9,2.6,.2],'Gouda':[356,25,0,28],
 'Hähnchenbrust (roh)':[110,23,0,1.5],'Reis (trocken)':[350,7,78,.7],
 'Brokkoli':[34,3,3,0.4],'Olivenöl':[884,0,0,100],'Naturjoghurt (als Dip)':[62,3.5,4.7,3.5],
 'Rinderhack (mager, roh)':[137,21,0,5],'Kidneybohnen (abgetropft)':[100,7,14,.5],
 'Mais (abgetropft)':[80,2.9,12,1.9],'Passierte Tomaten':[29,1.4,4.5,.2],'Zwiebel':[40,1.1,9,.1],
 'Vollkornnudeln (trocken)':[350,13,64,2.5],'Thunfisch im eigenen Saft (abgetropft)':[110,25,0,1],
 'Parmesan':[400,33,0,29],'Kartoffeln (roh)':[77,2,17,.1],'Gurke':[12,.6,1.8,.2],
 'Putenbrust-Aufschnitt':[105,21,1,2],'Apfel':[52,.3,11.4,.2],'Mandeln':[610,21,6,54],
 'Edamame (geschält)':[122,11,5,5],'Rote Linsen (trocken)':[350,25,52,1.5],
 'Tofu (natur)':[145,15,1,8],'Couscous (trocken)':[350,12,70,2],'Paprika':[31,1,5,.3],
 'Wraps':[310,8,52,8],'Hummus':[240,7,14,17]
};
const NEW_RECIPES=[
 ['Porridge & Eier','Frühstück',10,[['Haferflocken',70,'g'],['Milch (1,5 %)',250,'ml'],['Banane',120,'g'],['Erdnussmus',15,'g'],['Eier',2,'Stück']],['Eier separat etwa 8–10 Minuten kochen.','Haferflocken mit Milch 3–5 Minuten sanft köcheln. Banane schneiden und mit Erdnussmus dazugeben.','Die Eier dazu essen. Kein Quark, Skyr oder Joghurt nötig.']],
 ['Rührei-Käse-Brot','Frühstück',10,[['Vollkornbrot',140,'g'],['Eier',3,'Stück'],['Gouda',30,'g'],['Tomaten',150,'g']],['Eier verquirlen und in einer beschichteten Pfanne stocken lassen.','Käse auf das Brot legen, Rührei und geschnittene Tomaten dazugeben.']],
 ['Hähnchen-Reis-Bowl','Mittag',25,[['Hähnchenbrust (roh)',180,'g'],['Reis (trocken)',120,'g'],['Brokkoli',200,'g'],['Olivenöl',10,'g'],['Naturjoghurt (als Dip)',50,'g']],['Reis nach Packungsangabe garen. Brokkoli bissfest garen.','Hähnchen würfeln, würzen und mit Öl vollständig durchbraten.','Alles anrichten. Joghurt mit Kräutern als kleinen Dip dazugeben.']],
 ['Chili con Carne','Mittag',30,[['Rinderhack (mager, roh)',150,'g'],['Kidneybohnen (abgetropft)',120,'g'],['Mais (abgetropft)',80,'g'],['Passierte Tomaten',200,'g'],['Reis (trocken)',90,'g'],['Zwiebel',70,'g']],['Reis nach Packungsangabe kochen.','Hack und gewürfelte Zwiebel in einer beschichteten Pfanne vollständig durchbraten.','Bohnen und Mais abspülen, mit Tomaten hinzufügen. Würzen, 15 Minuten köcheln und mit Reis servieren.']],
 ['Tomaten-Linsen-Pasta','Mittag',25,[['Vollkornnudeln (trocken)',110,'g'],['Rote Linsen (trocken)',60,'g'],['Passierte Tomaten',200,'g'],['Olivenöl',10,'g'],['Parmesan',20,'g']],['Nudeln nach Packungsangabe kochen.','Linsen mit Tomaten und etwas Wasser etwa 15 Minuten köcheln lassen, bis sie weich sind. Bei Bedarf Wasser nachgießen.','Nudeln und Öl unterheben. Mit Parmesan servieren.']],
 ['Kartoffeln mit Ei & Kräuterdip','Abend',25,[['Kartoffeln (roh)',400,'g'],['Eier',3,'Stück'],['Naturjoghurt (als Dip)',50,'g'],['Gurke',150,'g'],['Olivenöl',10,'g']],['Kartoffeln schälen und in Salzwasser etwa 20 Minuten gar kochen.','Eier mit Öl in der Pfanne braten oder separat kochen.','Joghurt mit Kräutern, Salz und Pfeffer verrühren. Gurke schneiden. Der Dip ist nur eine kleine Beilage.']],
 ['Tofu-Couscous-Pfanne','Abend',20,[['Tofu (natur)',200,'g'],['Couscous (trocken)',100,'g'],['Paprika',200,'g'],['Olivenöl',10,'g']],['Couscous nach Packungsangabe mit heißem Wasser quellen lassen.','Tofu und Paprika würfeln und im Öl kräftig anbraten.','Couscous unterheben, würzen und servieren.']],
 ['Putenbrot & Apfel','Snack',5,[['Vollkornbrot',100,'g'],['Putenbrust-Aufschnitt',80,'g'],['Apfel',150,'g'],['Mandeln',15,'g']],['Brot mit Putenbrust belegen.','Apfel waschen und schneiden. Mandeln dazu essen.']],
 ['Edamame & Hummusbrot','Snack',10,[['Edamame (geschält)',150,'g'],['Vollkornbrot',80,'g'],['Hummus',40,'g'],['Tomaten',100,'g']],['Edamame nach Packungsangabe vollständig garen.','Brot mit Hummus bestreichen und mit Tomaten belegen. Edamame dazu essen.']],
 ['Hähnchen-Wraps','Abend',20,[['Wraps',120,'g'],['Hähnchenbrust (roh)',160,'g'],['Hummus',40,'g'],['Paprika',150,'g'],['Olivenöl',5,'g']],['Hähnchen in Streifen schneiden und mit Öl vollständig durchbraten.','Paprika schneiden, Wraps erwärmen und mit Hummus bestreichen.','Mit Hähnchen und Paprika füllen und aufrollen.']]
].map(([name,kind,mins,ingredients,steps])=>{
 const mac=[0,0,0,0];ingredients.forEach(([name,amount,unit])=>FOOD[name].forEach((v,i)=>mac[i]+=v*amount/(unit==='Stück'?1:100)));
 return [name,kind,...mac.map(Math.round),ingredients,steps,mins];
});
const R=[...LEGACY_RECIPES,...NEW_RECIPES];
const POOLS=[[8,9],[10,11,12],[13,14,17],[15,16]];
const REPLACEMENTS=[8,9,10,11,12,13,15,16];
const mealSnapshot=id=>({name:R[id][0],mac:R[id].slice(2,6)});
