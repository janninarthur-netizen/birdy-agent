"""Données SEO : formulation française de chaque destination, profils, pages pays.

Uniquement des informations déjà publiées sur le site ou tirées des pages publiques
de Parcours & Voyages. Aucune donnée inventée (prix, nombres de parcours, etc.).
"""

# « Séjour golf {PREP} »
PREP = {
    "Algarve": "en Algarve", "Lisbonne et Cascais": "à Lisbonne et Cascais", "Açores": "aux Açores",
    "Catalogne": "en Catalogne", "Marbella": "à Marbella", "Majorque": "à Majorque", "Canaries": "aux Canaries",
    "Saint-Andrews": "à Saint-Andrews", "East Lothian": "dans l’East Lothian", "Turnberry": "à Turnberry",
    "Irlande": "en Irlande", "Irlande du Nord": "en Irlande du Nord", "Italie du Nord": "en Italie du Nord",
    "Sardaigne": "en Sardaigne", "Sicile": "en Sicile", "Grèce": "en Grèce", "Chypre": "à Chypre", "Belek": "à Belek",
    "Hongrie": "en Hongrie", "Autriche": "en Autriche", "Côte d’Azur": "sur la Côte d’Azur", "Corse": "en Corse",
    "Bretagne": "en Bretagne", "Pays basque": "au Pays basque", "Marrakech": "à Marrakech", "Agadir": "à Agadir",
    "El Jadida": "à El Jadida", "Tanger": "à Tanger", "Fès": "à Fès", "Mer Rouge": "sur la mer Rouge",
    "Djerba": "à Djerba", "Le Cap et Garden Route": "au Cap et sur la Garden Route",
    "Sun City et Kruger": "à Sun City et au Kruger", "Île Maurice": "à l’île Maurice", "La Réunion": "à La Réunion",
    "Seychelles": "aux Seychelles", "Dubaï": "à Dubaï", "Thaïlande": "en Thaïlande", "Vietnam": "au Vietnam",
    "Cambodge": "au Cambodge", "Floride": "en Floride", "Californie": "en Californie",
    "Caroline du Sud": "en Caroline du Sud", "Virginie": "en Virginie", "Texas": "au Texas", "Cancún": "à Cancún",
    "Punta Mita": "à Punta Mita", "Québec": "au Québec", "Ontario": "en Ontario", "Bahamas": "aux Bahamas",
    "Jamaïque": "en Jamaïque", "République dominicaine": "en République dominicaine", "Barbade": "à la Barbade",
    "Nouvelle-Zélande": "en Nouvelle-Zélande", "Australie": "en Australie",
}

# Classement Birdy (utilisé aussi par l'agent sur l'accueil)
TAGS = {
    "soleil": ["Algarve", "Lisbonne et Cascais", "Canaries", "Marbella", "Majorque", "Catalogne", "Sardaigne", "Sicile", "Grèce", "Chypre",
               "Belek", "Côte d’Azur", "Corse", "Marrakech", "Agadir", "El Jadida", "Tanger", "Mer Rouge", "Djerba", "Dubaï", "Île Maurice",
               "La Réunion", "Seychelles", "Thaïlande", "Floride", "Cancún", "Punta Mita", "Bahamas", "Jamaïque", "République dominicaine",
               "Barbade", "Le Cap et Garden Route", "Californie"],
    "hiver": ["Algarve", "Canaries", "Marbella", "Marrakech", "Agadir", "Mer Rouge", "Dubaï", "Île Maurice", "La Réunion", "Seychelles",
              "Thaïlande", "Floride", "Cancún", "Punta Mita", "Bahamas", "Jamaïque", "République dominicaine", "Barbade",
              "Le Cap et Garden Route", "Sun City et Kruger", "Australie", "Nouvelle-Zélande", "Vietnam", "Cambodge", "Djerba"],
    "fete": ["Algarve", "Marbella", "Catalogne", "Majorque", "Marrakech", "Lisbonne et Cascais", "Dubaï", "Mer Rouge"],
    "pro": ["Belek", "Marrakech", "Algarve", "Mer Rouge", "Dubaï", "El Jadida", "Marbella", "Agadir", "Majorque"],
    "links": ["Saint-Andrews", "East Lothian", "Turnberry", "Irlande", "Irlande du Nord", "Bretagne"],
    "exotique": ["Île Maurice", "Seychelles", "La Réunion", "Bahamas", "Barbade", "Jamaïque", "République dominicaine", "Thaïlande",
                 "Punta Mita", "Cancún", "Dubaï", "Vietnam"],
    "nature": ["Açores", "Nouvelle-Zélande", "Sun City et Kruger", "Le Cap et Garden Route", "Québec", "Autriche", "La Réunion"],
}
COURT_REGIONS = ("france", "europe")
COURT_EXTRA = ["Marrakech", "Agadir", "El Jadida", "Tanger", "Fès", "Djerba"]

PROFILS = {  # libellé, guide associé
    "court": ("Week-end entre amis", "week-end-golf-entre-amis-portugal"),
    "fete": ("Enterrement de vie de garçon", "enterrement-de-vie-de-garcon-golf"),
    "pro": ("Séminaire d’entreprise", "seminaire-golf-entreprise"),
    "links": ("Voyage de club, links mythiques", "voyage-golf-club-association"),
    "hiver": ("Golf au soleil en hiver", "golf-au-soleil-en-hiver"),
    "exotique": ("Destination lointaine", None),
    "nature": ("Golf et grands espaces", None),
}

# Pages pays : slug, titre, « en/au », destinations, introduction (faits publiés par Parcours & Voyages)
PAYS = [
    ("portugal", "Portugal", "au Portugal", ["Algarve", "Lisbonne et Cascais", "Açores"],
     "Plus d’une centaine de parcours, surtout en Algarve et autour de Lisbonne et Cascais, à environ 2 h 30 de vol de Paris. "
     "Monte Rei, signé Jack Nicklaus, Quinta do Lago et Vale do Lobo font la réputation de l’Algarve."),
    ("maroc", "Maroc", "au Maroc", ["Marrakech", "Agadir", "El Jadida", "Tanger", "Fès"],
     "Plus de quarante parcours, de Marrakech à Agadir en passant par El Jadida, Tanger et Fès. "
     "Les meilleures périodes pour jouer vont de mars à mai et de septembre à novembre."),
    ("espagne", "Espagne", "en Espagne", ["Marbella", "Catalogne", "Majorque", "Canaries"],
     "La Costa del Sol autour de Marbella, la Catalogne et Barcelone à 1 h 45 de vol de Paris, Majorque et ses golfs, "
     "et les Canaries pour jouer au soleil toute l’année."),
    ("ecosse", "Écosse", "en Écosse", ["Saint-Andrews", "East Lothian", "Turnberry"],
     "Le berceau du golf : l’Old Course de Saint-Andrews, les 21 parcours de l’East Lothian à 30 minutes d’Édimbourg "
     "et les links de Turnberry face à la mer."),
    ("irlande", "Irlande", "en Irlande", ["Irlande", "Irlande du Nord"],
     "Druids Glen et The K Club, hôte de la Ryder Cup 2006, puis les grands links de l’Irlande du Nord, à découvrir en autotour."),
    ("italie", "Italie", "en Italie", ["Italie du Nord", "Sardaigne", "Sicile"],
     "Plus de 250 parcours, de la Lombardie, de la Ligurie et de l’Émilie-Romagne jusqu’à la Sardaigne et la Sicile."),
    ("france", "France", "en France", ["Côte d’Azur", "Corse", "Bretagne", "Pays basque"],
     "De la Côte d’Azur à la Corse (Sperone, Murtoli), de Dinard, l’un des plus anciens golfs de France, "
     "aux parcours du Pays basque et des Landes."),
    ("etats-unis", "États-Unis", "aux États-Unis", ["Floride", "Californie", "Caroline du Sud", "Virginie", "Texas"],
     "La Floride, destination golf phare, la Californie et Pebble Beach, la Caroline du Sud, la Virginie et le Texas."),
]


def profils(d):
    n = d["nom"]
    out = [k for k in ("hiver", "fete", "pro", "links", "exotique", "nature") if n in TAGS[k]]
    if d["region"] in COURT_REGIONS or n in COURT_EXTRA:
        out.insert(0, "court")
    return out


def pays_de(n):
    for slug, titre, prep, dests, _ in PAYS:
        if n in dests:
            return slug, titre, prep
    return None
