
// ===== DATA & STORAGE (Firebase) =====
// currentUser se mantiene en memoria + sessionStorage para la UI
let currentUserCache = null;
// Evita que onAuthStateChanged borre la sesión mientras registramos el perfil en Firestore
let authBusy = false;

function requireFirebase() {
  if (typeof firebaseReady === 'undefined' || !firebaseReady) {
    showToast('Firebase no está configurado. Completá firebase-config.js', 'error');
    throw new Error('Firebase no configurado');
  }
}

async function loadUserProfileWithRetry(uid, attempts = 8, delayMs = 300) {
  for (let i = 0; i < attempts; i++) {
    const profile = await loadUserProfile(uid);
    if (profile) return profile;
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

// ===== PROVINCIAS Y LOCALIDADES (principales) =====
const PROVINCIAS_LOCALIDADES = {
  "Buenos Aires": [
    "La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Lanús", "General San Martín",
    "Lomas de Zamora", "La Matanza", "Almirante Brown", "Avellaneda", "San Isidro", "Tigre",
    "Vicente López", "Morón", "San Miguel", "José C. Paz", "Malvinas Argentinas", "Pilar",
    "Escobar", "Campana", "Zárate", "Luján", "Mercedes", "Chivilcoy", "Junín", "Pergamino",
    "San Nicolás", "Olavarría", "Tandil", "Necochea", "Azul", "Tres Arroyos", "Balcarce",
    "General Pueyrredón", "Berazategui", "Florencio Varela", "Esteban Echeverría", "Ezeiza",
    "Hurlingham", "Ituzaingó", "Moreno", "Merlo", "La Costa", "Pinamar", "Villa Gesell",
    "San Fernando", "Berisso", "Ensenada", "Brandsen", "Cañuelas", "Lobos", "Chascomús",
    "Dolores", "General Belgrano", "Las Flores", "Rauch", "Ayacucho", "Benito Juárez",
    "Coronel Suárez", "Coronel Pringles", "Coronel Dorrego", "Punta Alta", "Pedro Luro",
    "Carmen de Patagones", "Viedma (límite)", "9 de Julio", "Carlos Casares", "Pehuajó",
    "Lincoln", "General Villegas", "Trenque Lauquen", "América", "Bragado", "Chacabuco",
    "Salto", "Rojas", "Colón", "San Antonio de Areco", "Baradero", "Ramallo", "San Pedro",
    "Arrecifes", "Capitán Sarmiento", "Carmen de Areco", "Suipacha", "Navarro", "General Las Heras",
    "Marcos Paz", "General Rodríguez", "Luján", "Exaltación de la Cruz", "San Andrés de Giles"
  ],
  "Ciudad Autónoma de Buenos Aires": [
    "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito",
    "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca",
    "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya",
    "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios",
    "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás",
    "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", "Villa del Parque",
    "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar",
    "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati",
    "Villa Urquiza"
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca", "Valle Viejo", "Fray Mamerto Esquiú", "Capayán",
    "Santa María", "Belén", "Andalgalá", "Tinogasta", "Fiambalá", "Recreo", "Santa Rosa",
    "Ancasti", "El Alto", "La Paz", "Paclín", "Pomán", "Mutquín", "Londres", "Hualfín"
  ],
  "Chaco": [
    "Resistencia", "Barranqueras", "Fontana", "Puerto Vilelas", "Presidencia Roque Sáenz Peña",
    "Villa Ángela", "Charata", "General San Martín", "Juan José Castelli", "Machagai",
    "Quitilipi", "Las Breñas", "General Pinedo", "Corzuela", "Campo Largo", "Tres Isletas",
    "Makallé", "La Leonesa", "Puerto Tirol", "Colonia Elisa", "Villa Berthet", "Santa Sylvina"
  ],
  "Chubut": [
    "Rawson", "Trelew", "Puerto Madryn", "Comodoro Rivadavia", "Esquel", "Sarmiento",
    "Gaiman", "Dolavon", "28 de Julio", "Rada Tilly", "Playa Unión", "Camarones",
    "Trevelin", "El Hoyo", "Epuyén", "Lago Puelo", "El Maitén", "Cushamen", "Gastre",
    "Paso de Indios", "José de San Martín", "Río Mayo", "Alto Río Senguer"
  ],
  "Córdoba": [
    "Córdoba", "Villa María", "Río Cuarto", "San Francisco", "Villa Carlos Paz", "Alta Gracia",
    "Río Tercero", "Bell Ville", "Jesús María", "La Calera", "Villa Allende", "Unquillo",
    "Mendiolaza", "Río Segundo", "Pilar", "Oncativo", "Oliva", "Las Varillas", "Arroyito",
    "Marcos Juárez", "Leones", "Cruz del Eje", "Deán Funes", "Villa Dolores", "Mina Clavero",
    "Cosquín", "La Falda", "Capilla del Monte", "Villa General Belgrano", "Embalse",
    "Santa Rosa de Calamuchita", "Laboulaye", "General Cabrera", "Adelia María", "Coronel Moldes",
    "Huinca Renancó", "Villa Huidobro", "Morrison", "Inriville", "Monte Cristo", "Malvinas Argentinas"
  ],
  "Corrientes": [
    "Corrientes", "Goya", "Mercedes", "Paso de los Libres", "Curuzú Cuatiá", "Esquina",
    "Bella Vista", "Santo Tomé", "Monte Caseros", "Ituzaingó", "Saladas", "San Luis del Palmar",
    "Empedrado", "Lavalle", "Mburucuyá", "San Roque", "Concepción", "Sauce", "Alvear",
    "La Cruz", "Gobernador Virasoro", "San Martín", "Felipe Yofre"
  ],
  "Entre Ríos": [
    "Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Gualeguay", "Villaguay",
    "Colón", "Federación", "Chajarí", "La Paz", "Victoria", "Nogoyá", "Rosario del Tala",
    "San José", "Villa Elisa", "Crespo", "Diamante", "Federal", "Basavilbaso", "Urdinarrain",
    "Santa Elena", "Hasenkamp", "Viale", "Oro Verde", "Villa Urquiza"
  ],
  "Formosa": [
    "Formosa", "Clorinda", "Pirané", "El Colorado", "Las Lomitas", "Ingeniero Juárez",
    "Ibarreta", "Comandante Fontana", "Laguna Blanca", "General Belgrano", "Estanislao del Campo",
    "Villa General Güemes", "Herradura", "Palo Santo", "General Lucio V. Mansilla", "Riacho He-Hé"
  ],
  "Jujuy": [
    "San Salvador de Jujuy", "Palpalá", "Perico", "San Pedro de Jujuy", "Libertador General San Martín",
    "La Quiaca", "Humahuaca", "Tilcara", "Abra Pampa", "El Carmen", "Monterrico", "Yuto",
    "Calilegua", "Fraile Pintado", "Caimancito", "Maimará", "Purmamarca", "Susques", "Rinconada"
  ],
  "La Pampa": [
    "Santa Rosa", "General Pico", "Toay", "Realicó", "General Acha", "Victorica", "Intendente Alvear",
    "Eduardo Castex", "Macachín", "Guatraché", "Winifreda", "Anguil", "Catriló", "Quemú Quemú",
    "Trenel", "Bernardo Larroudé", "Ingeniero Luiggi", "25 de Mayo", "La Adela", "Jacinto Aráuz"
  ],
  "La Rioja": [
    "La Rioja", "Chilecito", "Aimogasta", "Chamical", "Chepes", "Villa Unión", "Nonogasta",
    "Famatina", "Vinchina", "Villa Castelli", "Ulapes", "Olta", "Tama", "Patquía", "Anillaco",
    "Sanagasta", "Villa San José de Vinchina", "Guandacol"
  ],
  "Mendoza": [
    "Mendoza", "Godoy Cruz", "Guaymallén", "Las Heras", "Maipú", "Luján de Cuyo", "San Martín",
    "San Rafael", "Tunuyán", "Rivadavia", "Junín", "La Paz", "Santa Rosa", "Lavalle",
    "General Alvear", "Malargüe", "Tupungato", "San Carlos", "Cacheuta", "Potrerillos",
    "Uspallata", "Villa Nueva", "Palmira", "Rodeo del Medio", "Russell"
  ],
  "Misiones": [
    "Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles", "Leandro N. Alem", "San Vicente",
    "Montecarlo", "Jardín América", "Aristóbulo del Valle", "Puerto Rico", "Wanda", "Capioví",
    "San Pedro", "El Soberbio", "Bernardo de Irigoyen", "Candelaria", "Garupá", "Gobernador Roca",
    "San Ignacio", "Corpus", "Puerto Esperanza", "Colonia Victoria", "Dos de Mayo"
  ],
  "Neuquén": [
    "Neuquén", "Cutral Có", "Plaza Huincul", "Zapala", "San Martín de los Andes", "Villa La Angostura",
    "Centenario", "Plottier", "Senillosa", "Añelo", "Rincón de los Sauces", "Chos Malal",
    "Junín de los Andes", "Aluminé", "Las Lajas", "Picún Leufú", "Piedra del Águila", "Villa Pehuenia",
    "Caviahue", "El Cholar", "Andacollo", "Tricao Malal"
  ],
  "Río Negro": [
    "Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Allen", "Cinco Saltos",
    "Villa Regina", "Catriel", "Choele Choel", "Luis Beltrán", "Lamarque", "Chimpay",
    "El Bolsón", "Ingeniero Jacobacci", "Río Colorado", "Sierra Grande", "Las Grutas", "San Antonio Oeste",
    "Valcheta", "Los Menucos", "Maquinchao", "Ñorquinco", "Dina Huapi", "Villa Mascardi"
  ],
  "Salta": [
    "Salta", "San Ramón de la Nueva Orán", "Tartagal", "General Güemes", "Metán", "Rosario de la Frontera",
    "Cafayate", "Cachi", "Joaquín V. González", "Embarcación", "Pichanal", "Profesor Salvador Mazza",
    "Aguaray", "Campo Quijano", "Rosario de Lerma", "El Carril", "Chicoana", "La Caldera",
    "San Antonio de los Cobres", "Iruya", "Santa Victoria", "Vaqueros", "San Lorenzo", "Coronel Moldes"
  ],
  "San Juan": [
    "San Juan", "Rawson", "Rivadavia", "Santa Lucía", "Chimbas", "Pocito", "Caucete", "Albardón",
    "Angaco", "San Martín", "9 de Julio", "25 de Mayo", "Sarmiento", "Jáchal", "Iglesia",
    "Calingasta", "Valle Fértil", "Ullum", "Zonda", "Villa Krause", "Villa Aberastain"
  ],
  "San Luis": [
    "San Luis", "Villa Mercedes", "Merlo", "La Punta", "Justo Daract", "Naschel", "Concarán",
    "Tilisarao", "Santa Rosa del Conlara", "Quines", "San Francisco del Monte de Oro", "Buena Esperanza",
    "Unión", "Arizona", "Villa de la Quebrada", "El Trapiche", "Potrero de los Funes", "Juana Koslay"
  ],
  "Santa Cruz": [
    "Río Gallegos", "Caleta Olivia", "Pico Truncado", "Puerto Deseado", "Puerto San Julián",
    "El Calafate", "El Chaltén", "Las Heras", "Perito Moreno", "Los Antiguos", "Gobernador Gregores",
    "Puerto Santa Cruz", "Comandante Luis Piedra Buena", "Río Turbio", "28 de Noviembre", "Hipólito Yrigoyen"
  ],
  "Santa Fe": [
    "Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista", "Santo Tomé", "Villa Gobernador Gálvez",
    "San Lorenzo", "Capitán Bermúdez", "Granadero Baigorria", "Pérez", "Funes", "Roldán", "Casilda",
    "Cañada de Gómez", "Firmat", "Rufino", "Villa Constitución", "San Nicolás (límite)", "Esperanza",
    "San Justo", "Gálvez", "Sunchales", "Ceres", "Tostado", "Vera", "Avellaneda", "Malabrigo",
    "Arroyo Seco", "Puerto General San Martín", "Fray Luis Beltrán", "Coronda", "Sauce Viejo"
  ],
  "Santiago del Estero": [
    "Santiago del Estero", "La Banda", "Termas de Río Hondo", "Añatuya", "Frías", "Fernández",
    "Monte Quemado", "Quimilí", "Loreto", "Suncho Corral", "Clodomira", "Beltrán", "Villa Ojo de Agua",
    "Tintina", "Campo Gallo", "Pinto", "Bandera", "Selva", "Sumampa", "Villa Atamisqui"
  ],
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": [
    "Ushuaia", "Río Grande", "Tolhuin", "Puerto Almanza", "San Sebastián"
  ],
  "Tucumán": [
    "San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Banda del Río Salí", "Alderetes",
    "Concepción", "Aguilares", "Monteros", "Famaillá", "Lules", "Tafí del Valle", "Simoca",
    "Bella Vista", "Juan Bautista Alberdi", "La Cocha", "Graneros", "Trancas", "Burruyacú",
    "Lastenia", "El Manantial", "San Pablo", "Villa Mariano Moreno", "Ingenio San Pablo"
  ]
};

// Lista ordenada de provincias para los selects
const LISTA_PROVINCIAS = Object.keys(PROVINCIAS_LOCALIDADES).sort((a, b) => a.localeCompare(b, 'es'));

// ===== ETIQUETAS POR OFICIO =====
const ETIQUETAS_POR_OFICIO = {
  'Plomería': [
    'Destapes', 'Pérdidas de agua', 'Instalación de canillas', 'Inodoros y depósitos',
    'Termotanque', 'Cañerías', 'Cloacas', 'Urgencias 24hs'
  ],
  'Gasista': [
    'Instalación de gas', 'Matriculado', 'Termotanque', 'Calefactores',
    'Cocinas', 'Estufas', 'Habilitación / certificado', 'Reparaciones'
  ],
  'Electricista': [
    'Instalación eléctrica', 'Tableros', 'Tomas y luces', 'Electrodomésticos',
    'LED e iluminación', 'Porteros / alarmas', 'Domótica', 'Urgencias'
  ],
  'Pintor': [
    'Interior', 'Exterior / frentes', 'Revoque fino', 'Enduido',
    'Esmalte', 'Impermeabilización', 'Cielorrasos', 'Decorativa'
  ],
  'Albañil': [
    'Refacciones', 'Ampliaciones', 'Revoques', 'Colocación de pisos',
    'Azulejos', 'Muros', 'Contrapisos', 'Obras nuevas'
  ],
  'Carpintero': [
    'Muebles a medida', 'Puertas', 'Aberturas', 'Placards',
    'Deck / pergolas', 'Restauración', 'Melamina', 'Madera maciza'
  ],
  'Jardinero': [
    'Corte de césped', 'Poda', 'Limpieza de pileta', 'Diseño de jardín',
    'Riego', 'Desmalezado', 'Plantación', 'Mantenimiento'
  ],
  'Cerrajero': [
    'Apertura de puertas', 'Cambio de cerraduras', 'Copias de llaves',
    'Cerraduras de seguridad', 'Automóviles', 'Urgencias 24hs', 'Blindaje'
  ]
};

function etiquetasDeOficio(oficio) {
  return ETIQUETAS_POR_OFICIO[oficio] || [];
}

function renderEtiquetasSelector(oficioSelectId, containerId, seleccionadas) {
  const sel = document.getElementById(oficioSelectId);
  const box = document.getElementById(containerId);
  if (!box) return;
  const oficio = sel ? sel.value : '';
  const lista = etiquetasDeOficio(oficio);
  const chosen = new Set(seleccionadas || []);

  if (!oficio || lista.length === 0) {
    box.innerHTML = '<p class="tags-placeholder">Primero seleccioná un oficio</p>';
    return;
  }

  box.innerHTML = lista.map((tag, i) => {
    const id = containerId + '_tag_' + i;
    const checked = chosen.has(tag) ? 'checked' : '';
    return `<label class="tag-chip" for="${id}">
      <input type="checkbox" id="${id}" value="${tag.replace(/"/g, '&quot;')}" ${checked}>
      <span>${tag}</span>
    </label>`;
  }).join('');
}

function obtenerEtiquetasSeleccionadas(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return [];
  return Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
}

function renderEtiquetasDisplay(etiquetas) {
  const list = Array.isArray(etiquetas) ? etiquetas.filter(Boolean) : [];
  if (list.length === 0) return '';
  return `<div class="tags-display">${list.map(t => `<span class="tag-pill">${t}</span>`).join('')}</div>`;
}

window.renderEtiquetasSelector = renderEtiquetasSelector;
window.ETIQUETAS_POR_OFICIO = ETIQUETAS_POR_OFICIO;



// Datos de ejemplo de profesionales
const DEMO_PROFESIONALES = [
  {
    id: 'demo1',
    tipo: 'oficio',
    nombre: 'Carlos Méndez',
    email: 'carlos.plomero@demo.com',
    password: 'demo123',
    telefono: '11 4567-8901',
    dni: '28456789',
    oficio: 'Plomería',
    experiencia: 12,
    edad: 38,
    domicilio: 'Villa Crespo',
    localidad: 'Villa Crespo',
    provincia: 'Ciudad Autónoma de Buenos Aires',
    descripcion: 'Plomero matriculado con más de 12 años de experiencia. Especialista en reparaciones de urgencia, instalaciones de baño y cocina.',
    fotos: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo2',
    tipo: 'oficio',
    nombre: 'Martín López',
    email: 'martin.gasista@demo.com',
    password: 'demo123',
    telefono: '11 2345-6789',
    dni: '31234567',
    oficio: 'Gasista',
    experiencia: 8,
    edad: 32,
    domicilio: 'Caballito',
    localidad: 'Caballito',
    provincia: 'Ciudad Autónoma de Buenos Aires',
    descripcion: 'Gasista matriculado. Instalaciones de gas natural, termotanques y calefactores. Certificaciones al día.',
    fotos: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo3',
    tipo: 'oficio',
    nombre: 'Roberto Fernández',
    email: 'roberto.elec@demo.com',
    password: 'demo123',
    telefono: '11 3456-7890',
    dni: '25678901',
    oficio: 'Electricista',
    experiencia: 15,
    edad: 45,
    domicilio: 'Flores',
    localidad: 'Flores',
    provincia: 'Ciudad Autónoma de Buenos Aires',
    descripcion: 'Electricista con 15 años de trayectoria. Instalaciones residenciales y comerciales, tableros y automatización.',
    fotos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo4',
    tipo: 'oficio',
    nombre: 'Diego Ramírez',
    email: 'diego.pintor@demo.com',
    password: 'demo123',
    telefono: '11 5678-9012',
    dni: '29876543',
    oficio: 'Pintor',
    experiencia: 10,
    edad: 35,
    domicilio: 'Palermo',
    localidad: 'Palermo',
    provincia: 'Ciudad Autónoma de Buenos Aires',
    descripcion: 'Pintor profesional. Especializado en pintura interior, exterior y trabajos decorativos. Acabados de calidad.',
    fotos: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo5',
    tipo: 'oficio',
    nombre: 'Jorge Acosta',
    email: 'jorge.albanil@demo.com',
    password: 'demo123',
    telefono: '351 123-4567',
    dni: '22345678',
    oficio: 'Albañil',
    experiencia: 20,
    edad: 48,
    domicilio: 'Nueva Córdoba',
    localidad: 'Córdoba',
    provincia: 'Córdoba',
    descripcion: 'Albañil con dos décadas de experiencia. Reformas, ampliaciones, revoques y colocación de pisos.',
    fotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo6',
    tipo: 'oficio',
    nombre: 'Luis Gómez',
    email: 'luis.carpintero@demo.com',
    password: 'demo123',
    telefono: '341 987-6543',
    dni: '26789012',
    oficio: 'Carpintero',
    experiencia: 14,
    edad: 41,
    domicilio: 'Centro',
    localidad: 'Rosario',
    provincia: 'Santa Fe',
    descripcion: 'Carpintero artesanal. Muebles a medida, puertas, ventanas y restauraciones de madera.',
    fotos: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=300&fit=crop'
    ]
  },
  {
    id: 'demo7',
    tipo: 'oficio',
    nombre: 'Pablo Suárez',
    email: 'pablo.plomero@demo.com',
    password: 'demo123',
    telefono: '11 6789-0123',
    dni: '34567890',
    oficio: 'Plomería',
    experiencia: 6,
    edad: 29,
    domicilio: 'San Isidro',
    localidad: 'San Isidro',
    provincia: 'Buenos Aires',
    descripcion: 'Plomero joven y confiable. Trabajos residenciales, destapes y mantenimiento preventivo.',
    fotos: []
  },
  {
    id: 'demo8',
    tipo: 'oficio',
    nombre: 'Andrés Torres',
    email: 'andres.elec@demo.com',
    password: 'demo123',
    telefono: '261 555-1234',
    dni: '30123456',
    oficio: 'Electricista',
    experiencia: 9,
    edad: 34,
    domicilio: 'Godoy Cruz',
    localidad: 'Godoy Cruz',
    provincia: 'Mendoza',
    descripcion: 'Electricista matriculado. Especialista en instalaciones de LED, domótica y energías renovables.',
    fotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop'
    ]
  }
];

// Reseñas de ejemplo
const DEMO_REVIEWS = [
  {
    id: 'r1',
    profId: 'demo1',
    clienteId: 'cliente_demo',
    clienteNombre: 'María González',
    calidad: 5,
    tiempo: 5,
    precio: 4,
    comentario: 'Excelente trabajo. Carlos resolvió una pérdida de agua en minutos y dejó todo impecable. Muy recomendable.',
    fecha: '2026-07-15'
  },
  {
    id: 'r2',
    profId: 'demo1',
    clienteId: 'cliente_demo2',
    clienteNombre: 'Juan Pérez',
    calidad: 5,
    tiempo: 4,
    precio: 5,
    comentario: 'Muy profesional y puntual. Cambió el tanque de agua sin problemas. Precio justo.',
    fecha: '2026-06-22'
  },
  {
    id: 'r3',
    profId: 'demo2',
    clienteId: 'cliente_demo',
    clienteNombre: 'Ana Rodríguez',
    calidad: 5,
    tiempo: 5,
    precio: 4,
    comentario: 'Martín es un genio con el gas. Instalación perfecta del termotanque y me explicó todo.',
    fecha: '2026-08-01'
  },
  {
    id: 'r4',
    profId: 'demo3',
    clienteId: 'cliente_demo3',
    clienteNombre: 'Laura Martínez',
    calidad: 4,
    tiempo: 5,
    precio: 4,
    comentario: 'Buen trabajo en la instalación eléctrica de mi local. Llegó a tiempo y trabajó limpio.',
    fecha: '2026-05-10'
  },
  {
    id: 'r5',
    profId: 'demo4',
    clienteId: 'cliente_demo',
    clienteNombre: 'Sofía López',
    calidad: 5,
    tiempo: 4,
    precio: 5,
    comentario: 'Diego pintó mi departamento completo. Quedó hermoso, prolijo y el precio fue excelente.',
    fecha: '2026-07-28'
  }
];

// ===== INIT =====
async function init() {
  poblarSelectsProvincias();
  [
    ['filterProvincia', 'filterLocalidad'],
    ['clienteProvincia', 'clienteLocalidad'],
    ['oficioProvincia', 'oficioLocalidad']
  ].forEach(([provId, locId]) => {
    const el = document.getElementById(provId);
    if (el) {
      el.addEventListener('change', () => cargarLocalidades(provId, locId));
    }
  });
  setupRatingStars();
  setMaxFechaNacimiento();
  cargarCredencialesRecordadas();

  // Historial inicial / deep link a perfil
  const rawHash = (location.hash || '#home').replace(/^#/, '') || 'home';
  if (rawHash.startsWith('profile/')) {
    const profId = decodeURIComponent(rawHash.slice('profile/'.length));
    try {
      history.replaceState({ section: 'profile', profId }, '', '#profile/' + encodeURIComponent(profId));
    } catch (err) { /* ignore */ }
    showSection('profile', true);
    if (profId) verPerfil(profId);
  } else {
    const validInitial = document.getElementById(rawHash) ? rawHash : 'home';
    try {
      history.replaceState({ section: validInitial }, '', '#' + validInitial);
    } catch (err) { /* ignore */ }
    showSection(validInitial, true);
  }

  if (typeof firebaseReady === 'undefined' || !firebaseReady) {
    console.warn('Firebase no configurado — la app no persistirá datos en la nube.');
    showToast('Configurá Firebase (firebase-config.js) para guardar datos en la nube', 'error');
    updateNav();
    return;
  }

  // Sesión persistente de Firebase Auth
  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Si estamos en medio del registro, no pisar la sesión
        if (authBusy && currentUserCache && currentUserCache.id === firebaseUser.uid) {
          updateNav();
          return;
        }
        const profile = await loadUserProfileWithRetry(firebaseUser.uid);
        if (profile) {
          currentUserCache = { ...profile, id: firebaseUser.uid, email: firebaseUser.email };
          sessionStorage.setItem('oficiosya_uid', firebaseUser.uid);
          sincronizarPushTrasLogin(firebaseUser.uid);
        } else if (!authBusy) {
          // Perfil aún no existe (registro a medias): no forzar logout visual
          console.warn('Perfil no encontrado todavía para', firebaseUser.uid);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (!authBusy) {
        currentUserCache = null;
        sessionStorage.removeItem('oficiosya_uid');
      }
    }
    updateNav();
  });

  // Si el usuario vuelve desde el link del email (?mode=verifyEmail&oobCode=...)
  try {
    await procesarLinkVerificacionEmail();
  } catch (e) {
    console.warn(e);
  }

  // Sembrar profesionales demo solo si no hay ninguno
  try {
    await seedDemoIfEmpty();
  } catch (e) {
    console.warn('No se pudieron cargar demos:', e);
  }
}

// ===== PROVINCIAS / LOCALIDADES DINÁMICAS =====
function poblarSelectsProvincias() {
  const ids = ['filterProvincia', 'clienteProvincia', 'oficioProvincia'];
  ids.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    // Si ya hay más de 1 opción (las del HTML), no reemplazar
    if (sel.options.length > 1) return;
    const first = sel.options[0] ? sel.options[0].outerHTML : '<option value="">Seleccionar...</option>';
    sel.innerHTML = first;
    LISTA_PROVINCIAS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });
  });
}

function cargarLocalidades(provinciaSelectId, localidadSelectId, selectedLocalidad) {
  const provSel = document.getElementById(provinciaSelectId);
  const locSel = document.getElementById(localidadSelectId);
  if (!provSel || !locSel) return;

  const provincia = (provSel.value || '').trim();
  locSel.innerHTML = '';

  if (!provincia) {
    locSel.setAttribute('disabled', 'disabled');
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Primero elegí provincia';
    locSel.appendChild(opt);
    return;
  }

  // Buscar localidades (coincidencia exacta o por si hay variación de nombre)
  let localidades = PROVINCIAS_LOCALIDADES[provincia];
  if (!localidades) {
    const key = Object.keys(PROVINCIAS_LOCALIDADES).find(
      k => k.toLowerCase() === provincia.toLowerCase()
    );
    localidades = key ? PROVINCIAS_LOCALIDADES[key] : [];
  }
  if (!localidades) localidades = [];

  locSel.removeAttribute('disabled');
  locSel.disabled = false;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = localidades.length
    ? 'Seleccionar localidad...'
    : 'Sin localidades cargadas';
  locSel.appendChild(placeholder);

  localidades.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    if (selectedLocalidad && selectedLocalidad === loc) opt.selected = true;
    locSel.appendChild(opt);
  });

  // Si la localidad guardada no está en la lista, la agregamos
  if (selectedLocalidad && !localidades.includes(selectedLocalidad)) {
    const opt = document.createElement('option');
    opt.value = selectedLocalidad;
    opt.textContent = selectedLocalidad + ' (actual)';
    opt.selected = true;
    locSel.appendChild(opt);
  }
}


// ===== FOTO DE PERFIL (registro / edición) =====
let oficioFotoPerfilDataUrl = null;

function previewFotoRegistro(e) {
  const file = e.target.files && e.target.files[0];
  const preview = document.getElementById('oficioFotoPreview');
  if (!file || !preview) return;
  if (!file.type.startsWith('image/')) {
    showToast('Solo se permiten imágenes', 'error');
    e.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('La foto debe pesar menos de 2MB', 'error');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    oficioFotoPerfilDataUrl = ev.target.result;
    preview.innerHTML = `<img src="${oficioFotoPerfilDataUrl}" alt="Vista previa">`;
  };
  reader.readAsDataURL(file);
}

window.previewFotoRegistro = previewFotoRegistro;

// Exponer en window por si se llama desde HTML
window.cargarLocalidades = cargarLocalidades;

// ===== FIRESTORE HELPERS =====
function getCurrentUser() {
  return currentUserCache;
}

function setCurrentUser(user) {
  currentUserCache = user;
}

async function loadUserProfile(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function getUsers() {
  requireFirebase();
  const snap = await db.collection('users').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getProfesionales() {
  requireFirebase();
  const snap = await db.collection('users').where('tipo', '==', 'oficio').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getReviews() {
  requireFirebase();
  const snap = await db.collection('reviews').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getReviewsByProf(profId) {
  requireFirebase();
  const snap = await db.collection('reviews').where('profId', '==', profId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getNotifications(userId) {
  requireFirebase();
  // Siempre filtrar por el uid real de Auth (las reglas de Firestore lo exigen)
  const uid = (auth.currentUser && auth.currentUser.uid) || userId;
  if (!uid) {
    throw new Error('No hay sesión activa para cargar notificaciones');
  }
  if (!auth.currentUser) {
    throw new Error('Sesión de Firebase no lista. Cerrá sesión y volvé a ingresar.');
  }

  let snap;
  try {
    snap = await db.collection('notifications')
      .where('userId', '==', uid)
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();
  } catch (err) {
    console.warn('Notificaciones orderBy falló, reintento sin orden:', err && err.code, err && err.message);
    // Si el error es de permisos, no enmascarar
    if (err && err.code === 'permission-denied') throw err;
    snap = await db.collection('notifications')
      .where('userId', '==', uid)
      .limit(50)
      .get();
  }
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  return list;
}

async function saveNotification(userId, notif) {
  requireFirebase();
  await db.collection('notifications').add({
    ...notif,
    userId,
    fecha: notif.fecha || new Date().toISOString(),
    read: false
  });
}

async function markNotificationsRead(userId) {
  requireFirebase();
  try {
    const uid = (auth.currentUser && auth.currentUser.uid) || userId;
    if (!uid || !auth.currentUser) return;
    let snap;
    try {
      snap = await db.collection('notifications')
        .where('userId', '==', uid)
        .where('read', '==', false)
        .get();
    } catch (e) {
      snap = await db.collection('notifications').where('userId', '==', uid).get();
    }
    if (!snap.docs.length) return;
    // Firestore batch máx. 500
    const docs = snap.docs.filter(d => d.data().read === false || d.data().read === undefined);
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    }
  } catch (err) {
    console.warn('No se pudieron marcar notificaciones como leídas:', err);
  }
}

async function getQuotes() {
  requireFirebase();
  const snap = await db.collection('quotes').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Solo presupuestos del profesional logueado (cumple reglas de Firestore) */
async function getQuotesForProf(profId) {
  requireFirebase();
  try {
    const snap = await db.collection('quotes').where('profId', '==', profId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('No se pudieron cargar presupuestos:', err);
    return [];
  }
}

async function uploadImage(path, dataUrl) {
  requireFirebase();
  const ref = storage.ref().child(path);
  await ref.putString(dataUrl, 'data_url');
  return await ref.getDownloadURL();
}

async function seedDemoIfEmpty() {
  const snap = await db.collection('users').where('tipo', '==', 'oficio').limit(1).get();
  if (!snap.empty) return;

  const batch = db.batch();
  DEMO_PROFESIONALES.forEach(p => {
    const { password, ...rest } = p;
    const ref = db.collection('users').doc(p.id);
    batch.set(ref, { ...rest, demo: true, createdAt: new Date().toISOString() });
  });
  DEMO_REVIEWS.forEach(r => {
    const ref = db.collection('reviews').doc(r.id);
    batch.set(ref, r);
  });
  await batch.commit();
  console.log('Datos demo cargados en Firestore');
}

// ===== NAV & SECTIONS =====
function closeMobileNav() {
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.remove('open');
  closeUserMenu();
}

/**
 * Navegación SPA con historial del navegador.
 * fromHistory=true cuando viene del botón Atrás/Adelante (no vuelve a pushear).
 */
function showSection(sectionId, fromHistory) {
  if (!sectionId) sectionId = 'home';
  const el = document.getElementById(sectionId);
  if (!el) sectionId = 'home';

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');

  closeMobileNav();

  // Historial: permite botón atrás del sistema / navegador
  if (!fromHistory) {
    const current = (history.state && history.state.section) || '';
    if (current !== sectionId) {
      try {
        history.pushState({ section: sectionId }, '', '#' + sectionId);
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        history.replaceState({ section: sectionId }, '', '#' + sectionId);
      } catch (err) { /* ignore */ }
    }
  } else {
    try {
      history.replaceState({ section: sectionId }, '', '#' + sectionId);
    } catch (err) { /* ignore */ }
  }

  if (sectionId === 'search') {
    realizarBusqueda();
  }

  actualizarBarraInferior(sectionId);
  mostrarBarraInferior();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/** Navegación segura desde menú / botones (móvil y desktop) */
function irASeccion(e, sectionId) {
  if (e) {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) { /* ignore */ }
  }
  if (typeof closeMobileNav === 'function') closeMobileNav();
  if (typeof closeUserMenu === 'function') closeUserMenu();
  showSection(sectionId);
  return false;
}

window.irASeccion = irASeccion;
window.showSection = showSection;
window.toggleMenu = toggleMenu;

// Botón atrás / adelante del navegador o del sistema (PWA)
window.addEventListener('popstate', (e) => {
  if (!e.state) {
    history.pushState({ section: 'home' }, '', '#home');
    showSection('home', true);
    return;
  }
  const sectionId = e.state.section || 'home';
  if (sectionId === 'profile' && e.state.profId) {
    showSection('profile', true);
    verPerfil(e.state.profId);
    return;
  }
  showSection(sectionId, true);
});

function toggleMenu() {
  const nav = document.getElementById('navLinks');
  if (!nav) return;
  nav.classList.toggle('open');
  // Al abrir el menú hamburguesa, cerrar dropdown de usuario
  if (!nav.classList.contains('open')) closeUserMenu();
}

function irAMiPerfil(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  closeMobileNav();
  const user = getCurrentUser();
  if (!user) {
    showToast('Iniciá sesión para ver tu perfil', 'error');
    showSection('login');
    return;
  }
  if (user.tipo === 'oficio') {
    showMyProfile(false);
  } else {
    abrirEditarPerfil();
  }
}

function irANotificaciones(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  closeMobileNav();
  showNotifications();
}

function irAEditarPerfil(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  closeMobileNav();
  abrirEditarPerfil();
}

window.irAMiPerfil = irAMiPerfil;
window.irANotificaciones = irANotificaciones;
window.irAEditarPerfil = irAEditarPerfil;

function getUserIniciales(nombre) {
  if (!nombre) return '?';
  return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function updateNav() {
  const user = getCurrentUser();
  const navRegister = document.getElementById('navRegister');
  const navLogin = document.getElementById('navLogin');
  const navNotifications = document.getElementById('navNotifications');
  const navUserMenu = document.getElementById('navUserMenu');
  const navMyProfileLink = document.getElementById('navMyProfileLink');

  closeUserMenu();

  if (user) {
    if (navRegister) navRegister.style.display = 'none';
    if (navLogin) navLogin.style.display = 'none';
    const btnHeroRegister = document.getElementById('btnHeroRegister');
    if (btnHeroRegister) btnHeroRegister.style.display = 'none';
    const btnQuickRegister = document.getElementById('btnQuickRegister');
    if (btnQuickRegister) btnQuickRegister.style.display = 'none';
    if (navUserMenu) navUserMenu.style.display = 'block';
    if (navMyProfileLink) navMyProfileLink.style.display = 'block';

    const iniciales = getUserIniciales(user.nombre);
    const firstName = (user.nombre || '').split(' ')[0];
    const avatar = document.getElementById('userAvatar');
    const avatarDrop = document.getElementById('userAvatarDrop');
    const nameEl = document.getElementById('userMenuName');
    const dropName = document.getElementById('userDropName');
    const dropRole = document.getElementById('userDropRole');

    if (avatar) {
      if (user.fotoPerfil) {
        avatar.innerHTML = `<img src="${user.fotoPerfil}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatar.textContent = iniciales;
      }
    }
    if (avatarDrop) {
      if (user.fotoPerfil) {
        avatarDrop.innerHTML = `<img src="${user.fotoPerfil}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarDrop.textContent = iniciales;
      }
    }
    if (nameEl) nameEl.textContent = firstName;
    if (dropName) dropName.textContent = user.nombre;
    if (dropRole) dropRole.textContent = user.tipo === 'oficio' ? (user.oficio || 'Profesional') : 'Cliente';

    const menuMyProfile = document.getElementById('menuMyProfile');
    const menuNotifs = document.getElementById('menuNotifs');

    if (user.tipo === 'oficio') {
      if (navNotifications) navNotifications.style.display = 'block';
      if (menuMyProfile) menuMyProfile.style.display = 'flex';
      if (menuNotifs) menuNotifs.style.display = 'flex';
      updateNotifBadge();
    } else {
      if (navNotifications) navNotifications.style.display = 'none';
      if (menuMyProfile) menuMyProfile.style.display = 'none';
      if (menuNotifs) menuNotifs.style.display = 'none';
    }
  } else {
    if (navRegister) navRegister.style.display = '';
    if (navLogin) navLogin.style.display = '';
    const btnHeroRegisterOut = document.getElementById('btnHeroRegister');
    if (btnHeroRegisterOut) btnHeroRegisterOut.style.display = '';
    const btnQuickRegisterOut = document.getElementById('btnQuickRegister');
    if (btnQuickRegisterOut) btnQuickRegisterOut.style.display = '';
    if (navUserMenu) navUserMenu.style.display = 'none';
    if (navNotifications) navNotifications.style.display = 'none';
    if (navMyProfileLink) navMyProfileLink.style.display = 'none';
  }
}

function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('navUserMenu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function closeUserMenu() {
  const menu = document.getElementById('navUserMenu');
  if (menu) menu.classList.remove('open');
}

function abrirEditarPerfil() {
  closeUserMenu();
  const user = getCurrentUser();
  if (!user) {
    showSection('login');
    return;
  }

  // Profesionales: abrir perfil en modo edición
  if (user.tipo === 'oficio') {
    showMyProfile(true);
    return;
  }

  // Clientes: sección de cuenta
  document.getElementById('accNombre').value = user.nombre || '';
  document.getElementById('accEmail').value = user.email || '';
  document.getElementById('accTelefono').value = user.telefono || '';
  const av = document.getElementById('clientProfileAvatar');
  const title = document.getElementById('clientProfileTitle');
  if (av) av.textContent = getUserIniciales(user.nombre);
  if (title) title.textContent = user.nombre || 'Mi cuenta';

  const provSel = document.getElementById('accProvincia');
  if (provSel && provSel.options.length <= 1) {
    LISTA_PROVINCIAS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      provSel.appendChild(opt);
    });
  }
  if (provSel) {
    provSel.value = user.provincia || '';
    cargarLocalidades('accProvincia', 'accLocalidad', user.localidad || '');
  }

  document.getElementById('accClienteFields').style.display = 'block';
  document.getElementById('accOficioHint').style.display = 'none';
  showSection('editAccount');
}

async function guardarCuenta(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  try {
    const data = {
      nombre: document.getElementById('accNombre').value.trim(),
      telefono: document.getElementById('accTelefono').value.trim()
    };
    if (user.tipo === 'cliente') {
      data.provincia = document.getElementById('accProvincia').value;
      data.localidad = document.getElementById('accLocalidad').value;
    }
    await db.collection('users').doc(user.id).update(data);
    currentUserCache = { ...user, ...data };
    updateNav();
    showToast('Perfil actualizado correctamente');
    showSection('home');
  } catch (err) {
    console.error(err);
    showToast('Error al guardar el perfil', 'error');
  }
}

// Cerrar menú de usuario al hacer clic fuera (con delay para no anular el tap en móvil)
document.addEventListener('click', (e) => {
  const menu = document.getElementById('navUserMenu');
  if (!menu || !menu.classList.contains('open')) return;
  if (menu.contains(e.target)) return;
  setTimeout(() => closeUserMenu(), 10);
});

window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;
window.abrirEditarPerfil = abrirEditarPerfil;
window.guardarCuenta = guardarCuenta;

async function updateNotifBadge() {
  const user = getCurrentUser();
  if (!user || user.tipo !== 'oficio' || !firebaseReady) return;

  try {
    const notifs = await getNotifications(user.id);
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (unread > 0) {
      badge.style.display = 'flex';
      badge.textContent = unread > 9 ? '9+' : unread;
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.warn(e);
  }
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ===== REGISTER =====
function switchRegisterTab(tipo) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.register-form').forEach(f => f.classList.remove('active'));
  
  if (tipo === 'cliente') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
    document.getElementById('formCliente').classList.add('active');
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
    document.getElementById('formOficio').classList.add('active');
  }
}

async function registrarCliente(e) {
  e.preventDefault();
  try {
    requireFirebase();
  } catch (err) {
    return;
  }

  const email = document.getElementById('clienteEmail').value.trim().toLowerCase();
  const password = document.getElementById('clientePass').value;

  authBusy = true;
  try {
    showToast('Creando cuenta...');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    const perfil = {
      tipo: 'cliente',
      nombre: document.getElementById('clienteNombre').value.trim(),
      email: email,
      telefono: document.getElementById('clienteTelefono').value.trim(),
      localidad: document.getElementById('clienteLocalidad').value,
      provincia: document.getElementById('clienteProvincia').value,
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set(perfil);

    try {
      await enviarEmailVerificacion(cred.user);
      showToast('Te enviamos un email de verificación. Revisá bandeja de entrada y spam.');
    } catch (verErr) {
      console.error('Error al enviar verificación:', verErr);
      showToast(verErr.message || 'Cuenta creada, pero no se pudo enviar el email. Usá Reenviar correo.', 'error');
    }

    currentUserCache = { id: uid, ...perfil, email };
    sessionStorage.setItem('oficiosya_uid', uid);
    e.target.reset();
    mostrarPantallaVerificacion(email);
  } catch (err) {
    console.error(err);
    currentUserCache = null;
    if (err.code === 'auth/email-already-in-use') {
      showToast('Ya existe una cuenta con ese email', 'error');
    } else if (err.code === 'auth/weak-password') {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    } else {
      showToast(err.message || 'Error al registrarse', 'error');
    }
  } finally {
    authBusy = false;
    updateNav();
  }
}

async function registrarOficio(e) {
  e.preventDefault();
  try {
    requireFirebase();
  } catch (err) {
    return;
  }

  const email = document.getElementById('oficioEmail').value.trim().toLowerCase();
  const password = document.getElementById('oficioPass').value;
  const dni = document.getElementById('oficioDni').value.trim().replace(/\D/g, '');

  if (dni.length < 7 || dni.length > 8) {
    showToast('El DNI debe tener 7 u 8 dígitos numéricos', 'error');
    return;
  }

  const fechaNac = document.getElementById('oficioFechaNacimiento').value;
  const edadCalc = calcularEdad(fechaNac);
  if (!fechaNac || edadCalc === null) {
    showToast('Ingresá una fecha de nacimiento válida', 'error');
    return;
  }
  if (edadCalc < 18) {
    showToast('Debés ser mayor de 18 años para registrarte como profesional', 'error');
    return;
  }

  const fotoInput = document.getElementById('oficioFotoPerfil');
  if (!oficioFotoPerfilDataUrl && (!fotoInput || !fotoInput.files || !fotoInput.files[0])) {
    showToast('La foto de perfil es obligatoria para profesionales', 'error');
    return;
  }

  authBusy = true;
  try {
    // Verificar DNI único
    const dniSnap = await db.collection('users').where('dni', '==', dni).limit(1).get();
    if (!dniSnap.empty) {
      showToast('Ya existe un profesional registrado con ese DNI', 'error');
      return;
    }

    if (!oficioFotoPerfilDataUrl && fotoInput.files[0]) {
      const file = fotoInput.files[0];
      oficioFotoPerfilDataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }
    if (!oficioFotoPerfilDataUrl) {
      showToast('La foto de perfil es obligatoria para profesionales', 'error');
      return;
    }

    showToast('Creando cuenta profesional...');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    // Guardar perfil YA (así onAuthStateChanged encuentra el documento)
    const perfil = {
      tipo: 'oficio',
      nombre: document.getElementById('oficioNombre').value.trim(),
      email: email,
      telefono: document.getElementById('oficioTelefono').value.trim(),
      dni: dni,
      oficio: document.getElementById('oficioTipo').value,
      experiencia: parseInt(document.getElementById('oficioExperiencia').value) || 0,
      fechaNacimiento: document.getElementById('oficioFechaNacimiento').value,
      edad: calcularEdad(document.getElementById('oficioFechaNacimiento').value),
      domicilio: document.getElementById('oficioDomicilio').value.trim(),
      localidad: document.getElementById('oficioLocalidad').value,
      provincia: document.getElementById('oficioProvincia').value,
      descripcion: (document.getElementById('oficioDescripcion').value || '').trim(),
      etiquetas: obtenerEtiquetasSeleccionadas('oficioEtiquetasBox'),
      fotoPerfil: '',
      fotos: [],
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set(perfil);
    currentUserCache = { id: uid, ...perfil, email };
    sessionStorage.setItem('oficiosya_uid', uid);
    updateNav();

    // Subir foto y actualizar perfil
    try {
      showToast('Subiendo foto de perfil...');
      const fotoPerfilUrl = await uploadImage(`users/${uid}/perfil.jpg`, oficioFotoPerfilDataUrl);
      await db.collection('users').doc(uid).update({ fotoPerfil: fotoPerfilUrl });
      currentUserCache = { ...currentUserCache, fotoPerfil: fotoPerfilUrl };
    } catch (upErr) {
      console.error(upErr);
      showToast('Cuenta creada, pero la foto no se subió. Podés cargarla en Mi Perfil.', 'error');
    }

    oficioFotoPerfilDataUrl = null;

    try {
      await enviarEmailVerificacion(cred.user);
      showToast('Te enviamos un email de verificación. Revisá bandeja de entrada y spam.');
    } catch (verErr) {
      console.error('Error al enviar verificación:', verErr);
      showToast(verErr.message || 'Cuenta creada, pero no se pudo enviar el email. Usá Reenviar correo.', 'error');
    }

    currentUserCache = { id: uid, ...perfil, email };
    sessionStorage.setItem('oficiosya_uid', uid);
    e.target.reset();
    const prev = document.getElementById('oficioFotoPreview');
    if (prev) prev.innerHTML = '<i class="fas fa-user-circle"></i><span>Sin foto</span>';
    mostrarPantallaVerificacion(email);
  } catch (err) {
    console.error(err);
    currentUserCache = null;
    if (err.code === 'auth/email-already-in-use') {
      showToast('Ya existe una cuenta con ese email', 'error');
    } else if (err.code === 'auth/weak-password') {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    } else {
      showToast(err.message || 'Error al registrarse', 'error');
    }
  } finally {
    authBusy = false;
    updateNav();
  }
}



/** Envía el mail de verificación con reintentos y mensajes claros */
async function enviarEmailVerificacion(user) {
  if (!user) throw new Error('No hay usuario para verificar');
  try {
    // Sin URL de retorno: evita auth/unauthorized-continue-uri si el dominio
    // (GitHub Pages, etc.) aún no está en Authorized domains.
    // La app detecta la verificación por polling mientras la sesión sigue abierta.
    await user.sendEmailVerification();
    console.log('Email de verificación enviado');
    return true;
  } catch (err) {
    console.error('Error al enviar verificación:', err.code, err.message);
    const code = err.code || '';
    if (code === 'auth/too-many-requests') {
      throw new Error('Firebase bloqueó los envíos por muchos intentos. Esperá 15–30 minutos y usá “Reenviar correo”.');
    }
    if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
      throw new Error('Dominio no autorizado en Firebase. Authentication → Settings → Authorized domains.');
    }
    throw new Error(err.message || 'No se pudo enviar el email de verificación');
  }
}

// ===== VERIFICACIÓN DE EMAIL (pantalla de espera + auto login) =====
let verifyPollTimer = null;

function detenerPollVerificacion() {
  if (verifyPollTimer) {
    clearInterval(verifyPollTimer);
    verifyPollTimer = null;
  }
}

function mostrarPantallaVerificacion(email) {
  const el = document.getElementById('verifyEmailAddress');
  if (el) el.textContent = email || (auth.currentUser && auth.currentUser.email) || '—';
  showSection('verifyEmail');
  iniciarPollVerificacion();
}

function iniciarPollVerificacion() {
  detenerPollVerificacion();
  // Consulta cada 3 s si el usuario ya confirmó el mail
  verifyPollTimer = setInterval(() => {
    comprobarVerificacionEmail(true);
  }, 3000);
  // Primera chequeo inmediato
  setTimeout(() => comprobarVerificacionEmail(true), 800);
}

async function continuarTrasVerificacion() {
  detenerPollVerificacion();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    showSection('login');
    return;
  }
  try {
    const profile = await loadUserProfileWithRetry(firebaseUser.uid);
    if (!profile) {
      showToast('Perfil no encontrado. Intentá iniciar sesión.', 'error');
      showSection('login');
      return;
    }
    currentUserCache = { id: firebaseUser.uid, ...profile, email: firebaseUser.email };
    sessionStorage.setItem('oficiosya_uid', firebaseUser.uid);
    updateNav();
    showToast('¡Email verificado! Bienvenido/a.');
    if (profile.tipo === 'oficio') {
      showMyProfile(false);
    } else {
      showSection('search');
    }
  } catch (err) {
    console.error(err);
    showSection('login');
  }
}

/** silent=true cuando lo llama el polling (sin toasts de error) */
async function comprobarVerificacionEmail(silent) {
  try {
    if (!firebaseReady || !auth.currentUser) {
      if (!silent) {
        showToast('No hay sesión activa. Iniciá sesión con tu email y contraseña.', 'error');
        showSection('login');
      }
      return false;
    }
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      await continuarTrasVerificacion();
      return true;
    }
    if (!silent) {
      showToast('Aún no confirmamos la verificación. Revisá tu correo o esperá unos segundos.');
    }
    return false;
  } catch (err) {
    console.error(err);
    if (!silent) showToast('No se pudo comprobar el estado del email', 'error');
    return false;
  }
}

window.comprobarVerificacionEmail = comprobarVerificacionEmail;
window.mostrarPantallaVerificacion = mostrarPantallaVerificacion;

/** Procesa el link de verificación si el usuario vuelve a la app con oobCode */
async function procesarLinkVerificacionEmail() {
  if (!firebaseReady) return;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (mode === 'verifyEmail' && oobCode) {
    try {
      await auth.applyActionCode(oobCode);
      showToast('¡Email verificado correctamente!');
      // Limpiar query de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          await continuarTrasVerificacion();
        }
      } else {
        showSection('login');
        showToast('Email verificado. Ahora podés iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      showToast('El enlace de verificación no es válido o ya fue usado.', 'error');
      showSection('login');
    }
  }
}


// ===== LOGIN / LOGOUT =====
async function iniciarSesion(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (typeof firebaseReady === 'undefined' || !firebaseReady) {
    showToast('Firebase no está configurado. Revisá firebase-config.js', 'error');
    console.error('Login bloqueado: Firebase no listo');
    return false;
  }

  const emailEl = document.getElementById('loginEmail');
  const passEl = document.getElementById('loginPass');
  if (!emailEl || !passEl) {
    showToast('No se encontró el formulario de login', 'error');
    return false;
  }

  const email = emailEl.value.trim().toLowerCase();
  const pass = passEl.value;
  const remember = document.getElementById('loginRemember')?.checked;

  if (!email || !pass) {
    showToast('Completá email y contraseña', 'error');
    return false;
  }

  try {
    showToast('Ingresando...');
    const cred = await auth.signInWithEmailAndPassword(email, pass);

    await cred.user.reload();
    if (!cred.user.emailVerified) {
      currentUserCache = null;
      updateNav();
      mostrarPantallaVerificacion(email);
      showToast('Todavía falta verificar tu email. Revisá tu correo.');
      return false;
    }
    if (typeof detenerPollVerificacion === 'function') detenerPollVerificacion();

    const profile = await loadUserProfileWithRetry(cred.user.uid);
    if (!profile) {
      showToast('No se encontró el perfil de usuario en la base de datos', 'error');
      await auth.signOut();
      return false;
    }
    currentUserCache = { id: cred.user.uid, ...profile, email: cred.user.email };
    if (remember) {
      localStorage.setItem('oficiosya_remember', JSON.stringify({ email, pass }));
    } else {
      localStorage.removeItem('oficiosya_remember');
    }
    updateNav();
    showToast('¡Bienvenido/a, ' + ((currentUserCache.nombre || '').split(' ')[0] || '') + '!');
    if (currentUserCache.tipo === 'oficio') {
      showMyProfile(false);
    } else {
      showSection('search');
    }
  } catch (err) {
    console.error('Error login:', err);
    const code = err && err.code ? err.code : '';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
      showToast('Email o contraseña incorrectos', 'error');
    } else if (code === 'auth/too-many-requests') {
      showToast('Demasiados intentos. Esperá unos minutos.', 'error');
    } else if (code === 'auth/network-request-failed') {
      showToast('Sin conexión. Revisá tu internet.', 'error');
    } else {
      showToast((err && err.message) ? err.message : 'No se pudo iniciar sesión', 'error');
    }
  }
  return false;
}

window.iniciarSesion = iniciarSesion;

async function reenviarVerificacionEmail() {
  try {
    requireFirebase();
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        showToast('Tu email ya está verificado.');
        await continuarTrasVerificacion();
        return;
      }
      await enviarEmailVerificacion(user);
      showToast('Email de verificación reenviado. Revisá bandeja de entrada y spam.');
      return;
    }
    showToast('Para reenviar, iniciá sesión con tu email y contraseña (te llevaremos a la pantalla de espera).', 'error');
    showSection('login');
  } catch (err) {
    console.error(err);
    showToast('No se pudo reenviar el email. Intentá más tarde.', 'error');
  }
}

window.reenviarVerificacionEmail = reenviarVerificacionEmail;

function cargarCredencialesRecordadas() {
  try {
    const raw = localStorage.getItem('oficiosya_remember');
    if (!raw) return;
    const data = JSON.parse(raw);
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPass');
    const rememberEl = document.getElementById('loginRemember');
    if (emailEl && data.email) emailEl.value = data.email;
    if (passEl && data.pass) passEl.value = data.pass;
    if (rememberEl) rememberEl.checked = true;
  } catch (e) {
    console.warn(e);
  }
}

async function logout() {
  closeUserMenu();
  try {
    if (firebaseReady) await auth.signOut();
  } catch (e) {
    console.error(e);
  }
  currentUserCache = null;
  updateNav();
  showToast('Sesión cerrada correctamente');
  showSection('home');
}

// ===== SEARCH =====
function quickSearch(oficio) {
  showSection('search');
  document.getElementById('filterOficio').value = oficio;
  document.getElementById('filterProvincia').value = '';
  cargarLocalidades('filterProvincia', 'filterLocalidad');
  realizarBusqueda();
}

async function realizarBusqueda() {
  const oficio = document.getElementById('filterOficio').value;
  const localidad = document.getElementById('filterLocalidad').value;
  const provincia = document.getElementById('filterProvincia').value;
  const container = document.getElementById('resultados');
  const noRes = document.getElementById('noResultados');

  if (!firebaseReady) {
    container.innerHTML = '';
    noRes.style.display = 'block';
    noRes.innerHTML = '<p>Configurá Firebase para buscar profesionales.</p>';
    return;
  }

  container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">Buscando...</p>';
  noRes.style.display = 'none';

  try {
    let users = await getProfesionales();

    let resultados = users.filter(u => {
      if (oficio && u.oficio !== oficio) return false;
      if (provincia && u.provincia !== provincia) return false;
      if (localidad && u.localidad !== localidad && !(u.domicilio || '').toLowerCase().includes(localidad.toLowerCase())) return false;
      return true;
    });

    if (resultados.length === 0) {
      container.innerHTML = '';
      noRes.style.display = 'block';
      noRes.innerHTML = '<i class="fas fa-search"></i><p>No se encontraron profesionales con esos filtros.</p>';
      return;
    }

    noRes.style.display = 'none';
    const allReviews = await getReviews();

    container.innerHTML = resultados.map(p => {
      const avg = getAverageRatingFromList(allReviews, p.id);
      const starsHtml = renderStars(avg.promedio);
      const iniciales = (p.nombre || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <div class="prof-card">
          <div class="prof-header">
            <div class="prof-avatar">${(p.fotoPerfil || '').trim() ? `<img src="${(p.fotoPerfil || '').trim()}" alt="${p.nombre || ''}" referrerpolicy="no-referrer">` : iniciales}</div>
            <div class="prof-header-info">
              <h3>${p.nombre}</h3>
              <span class="oficio-tag">${p.oficio}</span>
            </div>
          </div>
          <div class="prof-body">
            <div class="prof-meta">
              <span><i class="fas fa-map-marker-alt"></i> ${p.localidad}, ${p.provincia}</span>
              <span><i class="fas fa-briefcase"></i> ${p.experiencia || 0} años exp.</span>
            </div>
            <div class="prof-rating">
              ${starsHtml}
              <span style="color:var(--text-light);font-size:0.9rem;">(${avg.count} reseñas)</span>
            </div>
            <p style="font-size:0.9rem;color:var(--text-light);">${p.descripcion ? p.descripcion.substring(0, 100) + (p.descripcion.length > 100 ? '...' : '') : 'Sin descripción'}</p>
            ${renderEtiquetasDisplay(p.etiquetas)}
          </div>
          <div class="prof-actions">
            <button class="btn btn-primary btn-sm" onclick="verPerfil('${p.id}')">
              <i class="fas fa-user"></i> Ver perfil
            </button>
            ${p.telefono ? `
            <a href="tel:${p.telefono}" class="btn btn-call btn-sm">
              <i class="fas fa-phone"></i>
            </a>
            <a href="${urlWhatsApp(p.telefono, 'Hola, te contacto por Oficios YA!') || '#'}" class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener">
              <i class="fab fa-whatsapp"></i>
            </a>
            ` : ''}
            <button type="button" class="btn btn-share btn-sm" onclick="compartirPerfil('${p.id}', '${(p.nombre || '').replace(/'/g, "\\'")}', '${(p.oficio || '').replace(/'/g, "\\'")}')">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '';
    noRes.style.display = 'block';
    noRes.innerHTML = '<p>Error al buscar. Revisá la configuración de Firebase.</p>';
  }
}

// ===== RATINGS =====
function getAverageRatingFromList(reviewsAll, profId) {
  const reviews = reviewsAll.filter(r => r.profId === profId);
  if (reviews.length === 0) return { promedio: 0, count: 0, calidad: 0, tiempo: 0, precio: 0 };

  const sumCalidad = reviews.reduce((a, r) => a + r.calidad, 0);
  const sumTiempo = reviews.reduce((a, r) => a + r.tiempo, 0);
  const sumPrecio = reviews.reduce((a, r) => a + r.precio, 0);
  const total = reviews.length;
  const promedio = ((sumCalidad + sumTiempo + sumPrecio) / (total * 3)).toFixed(1);

  return {
    promedio: parseFloat(promedio),
    count: total,
    calidad: (sumCalidad / total).toFixed(1),
    tiempo: (sumTiempo / total).toFixed(1),
    precio: (sumPrecio / total).toFixed(1)
  };
}

async function getAverageRating(profId) {
  const reviews = await getReviewsByProf(profId);
  return getAverageRatingFromList(reviews, profId);
}

function renderStars(rating) {
  let html = '<span class="stars">';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      html += '<i class="fas fa-star"></i>';
    } else if (i === full + 1 && half) {
      html += '<i class="fas fa-star-half-alt"></i>';
    } else {
      html += '<i class="far fa-star"></i>';
    }
  }
  html += `</span> <strong>${rating > 0 ? rating : '—'}</strong>`;
  return html;
}

// ===== PROFILE VIEW =====

// ===== CONTACTO Y COMPARTIR PERFIL =====
function normalizarTelefonoAR(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('54')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  // Argentina: código país 54
  return '54' + d;
}

function urlWhatsApp(tel, mensaje) {
  const n = normalizarTelefonoAR(tel);
  if (!n) return null;
  const text = mensaje ? ('?text=' + encodeURIComponent(mensaje)) : '';
  return 'https://wa.me/' + n + text;
}

function urlPerfilProfesional(profId) {
  const base = window.location.href.split('?')[0].split('#')[0];
  return base + '#profile/' + encodeURIComponent(profId);
}

async function compartirPerfil(profId, nombre, oficio) {
  const url = urlPerfilProfesional(profId);
  const title = (nombre || 'Profesional') + ' — Oficios YA!';
  const text = 'Mirá el perfil de ' + (nombre || 'este profesional') +
    (oficio ? ' (' + oficio + ')' : '') + ' en Oficios YA!';
  try {
    if (navigator.share) {
      await navigator.share({ title: title, text: text, url: url });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link del perfil copiado. Ya podés pegarlo en WhatsApp.');
  } catch (e2) {
    window.prompt('Copiá este link del perfil:', url);
  }
}

window.compartirPerfil = compartirPerfil;
window.urlWhatsApp = urlWhatsApp;

async function verPerfil(profId) {
  let prof;
  try {
    const doc = await db.collection('users').doc(profId).get();
    if (!doc.exists) {
      showToast('Profesional no encontrado', 'error');
      return;
    }
    prof = { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error(err);
    showToast('Error al cargar el perfil', 'error');
    return;
  }

  const reviews = (await getReviewsByProf(profId)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const avg = getAverageRatingFromList(reviews, profId);
  const iniciales = (prof.nombre || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const currentUser = getCurrentUser();
  const puedeResenar = currentUser && currentUser.tipo === 'cliente';
  
  const fotoUrl = (prof.fotoPerfil || '').trim();
  const fotoPerfilHtml = fotoUrl
    ? `<img class="prof-photo" src="${fotoUrl}" alt="${prof.nombre || 'Profesional'}" width="120" height="120" loading="eager" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\'prof-photo-placeholder\'>${iniciales}</div>');">`
    : `<div class="prof-photo-placeholder">${iniciales}</div>`;

  let fotosHtml = '';
  if (prof.fotos && prof.fotos.length > 0) {
    fotosHtml = prof.fotos.map(f => `
      <div class="prof-gallery-item">
        <img src="${f}" alt="Trabajo de ${prof.nombre}" loading="lazy">
      </div>
    `).join('');
  } else {
    fotosHtml = `<div class="prof-gallery-empty"><i class="fas fa-images" style="font-size:2rem;opacity:0.4;display:block;margin-bottom:0.5rem;"></i>Aún no hay fotos de trabajos publicados.</div>`;
  }

  let reviewsHtml = '';
  if (reviews.length > 0) {
    reviewsHtml = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-author">${r.clienteNombre}</span>
          <span style="font-size:0.85rem;color:var(--text-light);">${formatDate(r.fecha)}</span>
        </div>
        <div class="review-ratings">
          <span>Calidad: <span class="stars">${'★'.repeat(r.calidad)}${'☆'.repeat(5 - r.calidad)}</span></span>
          <span>Tiempo: <span class="stars">${'★'.repeat(r.tiempo)}${'☆'.repeat(5 - r.tiempo)}</span></span>
          <span>Precio: <span class="stars">${'★'.repeat(r.precio)}${'☆'.repeat(5 - r.precio)}</span></span>
        </div>
        <p class="review-text">${r.comentario}</p>
      </div>
    `).join('');
  } else {
    reviewsHtml = '<p style="color:var(--text-light);">Todavía no hay reseñas. ¡Sé el primero en comentar!</p>';
  }

  const bar = (val) => Math.min(100, (parseFloat(val) || 0) * 20);

  const content = `
    <div class="prof-profile">
      <div class="prof-hero">
        <div class="prof-hero-top">
          ${fotoPerfilHtml}
          <div class="prof-hero-info">
            <h1>${prof.nombre}</h1>
            <div class="prof-badge-row">
              <span class="prof-chip accent"><i class="fas fa-briefcase"></i> ${prof.oficio || 'Profesional'}</span>
              <span class="prof-chip"><i class="fas fa-star"></i> ${avg.promedio > 0 ? avg.promedio + ' / 5' : 'Sin valoraciones'}</span>
            </div>
            ${(prof.etiquetas && prof.etiquetas.length) ? `<div class="prof-hero-tags">${renderEtiquetasDisplay(prof.etiquetas)}</div>` : ''}
            <div class="prof-hero-meta">
              <span><i class="fas fa-map-marker-alt"></i> ${prof.localidad || ''}, ${prof.provincia || ''}</span>
              <span><i class="fas fa-clock"></i> ${prof.experiencia || 0} años de experiencia</span>
              <span><i class="fas fa-phone"></i> ${prof.telefono || '—'}</span>
            </div>
          </div>
        </div>
        <div class="prof-score-bar">
          <div class="prof-score-item"><span class="val">${avg.promedio || '—'}</span><span class="lbl">Promedio</span></div>
          <div class="prof-score-item"><span class="val">${avg.count}</span><span class="lbl">Reseñas</span></div>
          <div class="prof-score-item"><span class="val">${prof.experiencia || 0}</span><span class="lbl">Años exp.</span></div>
          <div class="prof-score-item"><span class="val">${(prof.fotos || []).length}</span><span class="lbl">Trabajos</span></div>
        </div>
      </div>

      <div class="prof-grid">
        <div class="prof-card-block">
          <h3><i class="fas fa-id-card"></i> Información de contacto</h3>
          <div class="prof-info-list">
            <div class="prof-info-row"><span class="k"><i class="fas fa-map"></i> Zona</span><span class="v">${prof.domicilio || '—'}</span></div>
            <div class="prof-info-row"><span class="k"><i class="fas fa-city"></i> Localidad</span><span class="v">${prof.localidad || '—'}</span></div>
            <div class="prof-info-row"><span class="k"><i class="fas fa-flag"></i> Provincia</span><span class="v">${prof.provincia || '—'}</span></div>
            <div class="prof-info-row"><span class="k"><i class="fas fa-phone"></i> Teléfono</span><span class="v">${prof.telefono || '—'}</span></div>
            <div class="prof-info-row"><span class="k"><i class="fas fa-birthday-cake"></i> Edad</span><span class="v">${(() => { const e = edadDesdePerfil(prof); return e !== null ? e + ' años' : '—'; })()}</span></div>
          </div>
          ${prof.descripcion ? `<div style="margin-top:1.2rem;"><h3><i class="fas fa-quote-left"></i> Sobre el profesional</h3><p class="prof-about">${prof.descripcion}</p></div>` : ''}
        </div>
        <div class="prof-card-block">
          <h3><i class="fas fa-chart-bar"></i> Valoraciones</h3>
          <div class="avg-rating" style="margin-bottom:1rem;">${renderStars(avg.promedio)} <span style="color:var(--text-light);font-size:0.9rem;">(${avg.count})</span></div>
          ${avg.count > 0 ? `
            <div class="prof-rating-bars">
              <div class="prof-rating-bar-row"><span>Calidad</span><div class="prof-rating-bar-track"><div class="prof-rating-bar-fill" style="width:${bar(avg.calidad)}%"></div></div><strong>${avg.calidad}</strong></div>
              <div class="prof-rating-bar-row"><span>Tiempo</span><div class="prof-rating-bar-track"><div class="prof-rating-bar-fill" style="width:${bar(avg.tiempo)}%"></div></div><strong>${avg.tiempo}</strong></div>
              <div class="prof-rating-bar-row"><span>Precio</span><div class="prof-rating-bar-track"><div class="prof-rating-bar-fill" style="width:${bar(avg.precio)}%"></div></div><strong>${avg.precio}</strong></div>
            </div>
          ` : '<p style="color:var(--text-light);">Sin valoraciones todavía.</p>'}
        </div>
      </div>

      <div class="prof-card-block" style="margin-bottom:1.25rem;">
        <h3><i class="fas fa-camera"></i> Galería de trabajos</h3>
        <div class="prof-gallery">${fotosHtml}</div>
      </div>

      <div class="prof-card-block">
        <h3><i class="fas fa-comments"></i> Opiniones de clientes</h3>
        ${puedeResenar ? `
          <button class="btn btn-primary" style="margin-bottom:1.2rem;" onclick="abrirModalResena('${prof.id}')">
            <i class="fas fa-pen"></i> Dejar reseña
          </button>
        ` : currentUser ? '' : `
          <p style="margin-bottom:1rem;color:var(--text-light);">
            <a href="#" onclick="showSection('login')" style="color:var(--primary);font-weight:600;">Iniciá sesión</a> como cliente para dejar una reseña.
          </p>
        `}
        ${reviewsHtml}
      </div>

      <div class="prof-actions-bar prof-contact-actions">
        ${prof.telefono ? `
          <a class="btn btn-call" href="tel:${String(prof.telefono).replace(/"/g, '')}">
            <i class="fas fa-phone"></i> Llamar
          </a>
          <a class="btn btn-whatsapp" href="${urlWhatsApp(prof.telefono, 'Hola ' + (prof.nombre || '') + ', te contacto por Oficios YA! Vi tu perfil de ' + (prof.oficio || 'profesional') + ' y quería consultar por un trabajo.') || '#'}" target="_blank" rel="noopener" ${urlWhatsApp(prof.telefono) ? '' : 'onclick="showToast(\'No hay un teléfono válido para WhatsApp\', \'error\'); return false;"'}>
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
        ` : `
          <span class="btn btn-secondary" style="opacity:0.7;cursor:default;"><i class="fas fa-phone-slash"></i> Sin teléfono</span>
        `}
        <button type="button" class="btn btn-share" onclick="compartirPerfil('${prof.id}', '${(prof.nombre || '').replace(/'/g, "\\'")}', '${(prof.oficio || '').replace(/'/g, "\\'")}')">
          <i class="fas fa-share-alt"></i> Compartir
        </button>
        ${puedeResenar ? `
          <button class="btn btn-primary" onclick="abrirModalPresupuesto('${prof.id}', '${(prof.nombre || '').replace(/'/g, "\\'")}')">
            <i class="fas fa-file-invoice-dollar"></i> Solicitar presupuesto
          </button>
        ` : !currentUser ? `
          <button class="btn btn-secondary" onclick="showSection('login')">
            <i class="fas fa-sign-in-alt"></i> Ingresá para pedir presupuesto
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="showSection('search')">
          <i class="fas fa-arrow-left"></i> Volver
        </button>
      </div>
    </div>
  `;

  document.getElementById('profileContent').innerHTML = content;
  // Deep link compartible: #profile/ID
  try {
    history.pushState({ section: 'profile', profId: profId }, '', '#profile/' + encodeURIComponent(profId));
  } catch (e) { /* ignore */ }
  showSection('profile', true);
}

// ===== MY PROFILE (profesional logueado) =====
async function showMyProfile(editMode) {
  const user = getCurrentUser();
  if (!user || user.tipo !== 'oficio') {
    showSection('home');
    return;
  }
  const isEdit = editMode === true;

  let prof;
  try {
    const doc = await db.collection('users').doc(user.id).get();
    if (!doc.exists) {
      showToast('No se pudo cargar tu perfil', 'error');
      return;
    }
    prof = { id: doc.id, ...doc.data() };
    currentUserCache = { ...prof, email: user.email };
  } catch (err) {
    console.error(err);
    showToast('Error al cargar el perfil', 'error');
    return;
  }

  const reviews = (await getReviewsByProf(prof.id)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const avg = getAverageRatingFromList(reviews, prof.id);
  const iniciales = (prof.nombre || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const myFotoUrl = (prof.fotoPerfil || '').trim();
  const fotoPerfilHtml = myFotoUrl
    ? `<div class="my-photo-edit"><img class="prof-photo" src="${myFotoUrl}" alt="${prof.nombre || ''}" width="120" height="120" referrerpolicy="no-referrer" onerror="this.style.display='none';"><label class="change-photo-btn" title="Cambiar foto"><i class="fas fa-camera"></i><input type="file" accept="image/*" onchange="cambiarFotoPerfil(event)"></label></div>`
    : `<div class="my-photo-edit"><div class="prof-photo-placeholder">${iniciales}</div><label class="change-photo-btn" title="Subir foto"><i class="fas fa-camera"></i><input type="file" accept="image/*" onchange="cambiarFotoPerfil(event)"></label></div>`;

  let fotosHtml = '';
  if (prof.fotos && prof.fotos.length > 0) {
    fotosHtml = prof.fotos.map((f, i) => `
      <div class="prof-gallery-item">
        <img src="${f}" alt="Trabajo">
        <button onclick="eliminarFoto(${i})" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.65);color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  fotosHtml += `
    <label class="photo-upload" style="aspect-ratio:1;border-radius:12px;">
      <i class="fas fa-plus"></i>
      <span style="font-size:0.8rem;">Agregar trabajo</span>
      <input type="file" accept="image/*" onchange="subirFoto(event)">
    </label>
  `;

  let reviewsHtml = '';
  if (reviews.length > 0) {
    reviewsHtml = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="review-author">${r.clienteNombre}</span>
          <span style="font-size:0.85rem;color:var(--text-light);">${formatDate(r.fecha)}</span>
        </div>
        <div class="review-ratings">
          <span>Calidad: <span class="stars">${'★'.repeat(r.calidad)}${'☆'.repeat(5 - r.calidad)}</span></span>
          <span>Tiempo: <span class="stars">${'★'.repeat(r.tiempo)}${'☆'.repeat(5 - r.tiempo)}</span></span>
          <span>Precio: <span class="stars">${'★'.repeat(r.precio)}${'☆'.repeat(5 - r.precio)}</span></span>
        </div>
        <p class="review-text">${r.comentario}</p>
      </div>
    `).join('');
  } else {
    reviewsHtml = '<p style="color:var(--text-light);">Todavía no recibiste reseñas.</p>';
  }

  const content = `
    <div class="prof-profile">
      <div class="prof-hero">
        <div class="prof-hero-top">
          ${fotoPerfilHtml}
          <div class="prof-hero-info">
            <h1>${prof.nombre}</h1>
            <div class="prof-badge-row">
              <span class="prof-chip accent"><i class="fas fa-briefcase"></i> ${prof.oficio || ''}</span>
              <span class="prof-chip"><i class="fas fa-star"></i> ${avg.promedio > 0 ? avg.promedio + ' ★' : 'Sin valoraciones'}</span>
            </div>
            <div class="prof-hero-meta">
              <span><i class="fas fa-map-marker-alt"></i> ${prof.localidad}, ${prof.provincia}</span>
              <span><i class="fas fa-clock"></i> ${prof.experiencia} años exp.</span>
            </div>
          </div>
        </div>
        <div class="prof-score-bar">
          <div class="prof-score-item"><span class="val">${avg.promedio || '—'}</span><span class="lbl">Promedio</span></div>
          <div class="prof-score-item"><span class="val">${avg.count}</span><span class="lbl">Reseñas</span></div>
          <div class="prof-score-item"><span class="val">${(prof.fotos || []).length}</span><span class="lbl">Trabajos</span></div>
        </div>
      </div>
    
    ${isEdit ? `
    <div class="prof-card-block" style="margin-bottom:1.25rem;" id="editProfileBlock">
      <h3><i class="fas fa-edit"></i> Editar información</h3>
      <form onsubmit="actualizarPerfil(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="editNombre" value="${prof.nombre || ''}" required>
          </div>
          <div class="form-group">
            <label>DNI</label>
            <input type="text" id="editDni" value="${prof.dni || ''}" required pattern="[0-9]{7,8}" maxlength="8" title="DNI sin puntos (7 u 8 dígitos)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="editTelefono" value="${prof.telefono || ''}" required>
          </div>
          <div class="form-group">
            <label>Fecha de nacimiento</label>
            <input type="date" id="editFechaNacimiento" value="${prof.fechaNacimiento || ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Oficio</label>
            <select id="editOficio" required onchange="renderEtiquetasSelector('editOficio','editEtiquetasBox', obtenerEtiquetasSeleccionadas('editEtiquetasBox'))">
              ${['Plomería','Gasista','Electricista','Pintor','Albañil','Carpintero','Jardinero','Cerrajero'].map(o => 
                `<option value="${o}" ${o === prof.oficio ? 'selected' : ''}>${o}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Especialidades / etiquetas</label>
            <div id="editEtiquetasBox" class="tags-select-box"></div>
          </div>
          <div class="form-group">
            <label>Años de experiencia</label>
            <input type="number" id="editExperiencia" value="${prof.experiencia || 0}" min="0" max="50" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Domicilio / Zona</label>
            <input type="text" id="editDomicilio" value="${prof.domicilio || ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Provincia</label>
            <select id="editProvincia" required onchange="cargarLocalidades('editProvincia','editLocalidad')">
              <option value="">Seleccionar provincia...</option>
              ${LISTA_PROVINCIAS.map(p => 
                `<option value="${p}" ${p === prof.provincia ? 'selected' : ''}>${p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Localidad</label>
            <select id="editLocalidad" required>
              <option value="">Seleccionar localidad...</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="editDescripcion" rows="3">${prof.descripcion || ''}</textarea>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
          <button type="button" class="btn btn-secondary" onclick="showMyProfile(false)">Cancelar</button>
        </div>
      </form>
    </div>
    ` : `
    <div class="prof-card-block" style="margin-bottom:1.25rem;">
      <h3><i class="fas fa-id-card"></i> Mi información</h3>
      <div class="prof-info-list">
        <div class="prof-info-row"><span class="k">Teléfono</span><span class="v">${prof.telefono || '—'}</span></div>
        <div class="prof-info-row"><span class="k">DNI</span><span class="v">${prof.dni || '—'}</span></div>
        <div class="prof-info-row"><span class="k">Zona</span><span class="v">${prof.domicilio || '—'}</span></div>
        <div class="prof-info-row"><span class="k">Localidad</span><span class="v">${prof.localidad || '—'}</span></div>
        <div class="prof-info-row"><span class="k">Provincia</span><span class="v">${prof.provincia || '—'}</span></div>
        <div class="prof-info-row"><span class="k">Edad</span><span class="v">${(() => { const e = edadDesdePerfil(prof); return e !== null ? e + ' años' : '—'; })()}</span></div>
      </div>
      ${(prof.etiquetas && prof.etiquetas.length) ? `<div style="margin-top:1rem;"><strong style="font-size:0.9rem;">Especialidades</strong>${renderEtiquetasDisplay(prof.etiquetas)}</div>` : ''}
      ${prof.descripcion ? `<p class="prof-about" style="margin-top:1rem;">${prof.descripcion}</p>` : ''}
      <button type="button" class="btn btn-primary" style="margin-top:1.2rem;" onclick="showMyProfile(true)">
        <i class="fas fa-user-edit"></i> Editar perfil
      </button>
    </div>
    `}
    
    <div class="prof-card-block" style="margin-bottom:1.25rem;">
      <h3><i class="fas fa-camera"></i> Galería de trabajos</h3>
      <div class="prof-gallery">${fotosHtml}</div>
    </div>

    <div class="prof-card-block">
      <h3><i class="fas fa-comments"></i> Reseñas recibidas (${reviews.length})</h3>
      ${reviewsHtml}
    </div>
    </div>
  `;

  document.getElementById('myProfileContent').innerHTML = content;
  if (isEdit) {
    setMaxFechaNacimiento();
    cargarLocalidades('editProvincia', 'editLocalidad', prof.localidad);
    renderEtiquetasSelector('editOficio', 'editEtiquetasBox', prof.etiquetas || []);
    const block = document.getElementById('editProfileBlock');
    if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showSection('myProfile');
}

async function actualizarPerfil(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const dni = document.getElementById('editDni').value.trim().replace(/\D/g, '');
  if (dni.length < 7 || dni.length > 8) {
    showToast('El DNI debe tener 7 u 8 dígitos numéricos', 'error');
    return;
  }

  const fechaNacEdit = document.getElementById('editFechaNacimiento').value;
  const edadCalcEdit = calcularEdad(fechaNacEdit);
  if (!fechaNacEdit || edadCalcEdit === null) {
    showToast('Ingresá una fecha de nacimiento válida', 'error');
    return;
  }
  if (edadCalcEdit < 18) {
    showToast('Debés ser mayor de 18 años', 'error');
    return;
  }

  try {
    const dniSnap = await db.collection('users').where('dni', '==', dni).get();
    if (dniSnap.docs.some(d => d.id !== user.id)) {
      showToast('Ya existe otro profesional con ese DNI', 'error');
      return;
    }

    const data = {
      nombre: document.getElementById('editNombre').value.trim(),
      dni: dni,
      telefono: document.getElementById('editTelefono').value.trim(),
      oficio: document.getElementById('editOficio').value,
      etiquetas: obtenerEtiquetasSeleccionadas('editEtiquetasBox'),
      experiencia: parseInt(document.getElementById('editExperiencia').value),
      fechaNacimiento: document.getElementById('editFechaNacimiento').value,
      edad: calcularEdad(document.getElementById('editFechaNacimiento').value),
      domicilio: document.getElementById('editDomicilio').value.trim(),
      localidad: document.getElementById('editLocalidad').value,
      provincia: document.getElementById('editProvincia').value,
      descripcion: document.getElementById('editDescripcion').value.trim()
    };

    await db.collection('users').doc(user.id).update(data);
    currentUserCache = { ...user, ...data };
    showToast('Perfil actualizado correctamente');
    showMyProfile();
  } catch (err) {
    console.error(err);
    showToast('Error al guardar el perfil', 'error');
  }
}


async function cambiarFotoPerfil(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const user = getCurrentUser();
  if (!user) return;
  if (!file.type.startsWith('image/')) {
    showToast('Solo se permiten imágenes', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Máximo 2MB', 'error');
    return;
  }
  try {
    showToast('Actualizando foto de perfil...');
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const url = await uploadImage(`users/${user.id}/perfil_${Date.now()}.jpg`, dataUrl);
    await db.collection('users').doc(user.id).update({ fotoPerfil: url });
    currentUserCache = { ...user, fotoPerfil: url };
    showToast('Foto de perfil actualizada');
    showMyProfile();
  } catch (err) {
    console.error(err);
    showToast('Error al actualizar la foto', 'error');
  }
}
window.cambiarFotoPerfil = cambiarFotoPerfil;

async function subirFoto(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Solo se permiten imágenes', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('La imagen es muy grande (máx 2MB)', 'error');
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  try {
    const doc = await db.collection('users').doc(user.id).get();
    const fotos = (doc.data().fotos || []).slice();
    if (fotos.length >= 8) {
      showToast('Máximo 8 fotos por perfil', 'error');
      return;
    }

    showToast('Subiendo foto...');
    const reader = new FileReader();
    reader.onload = async function (ev) {
      try {
        const url = await uploadImage(`users/${user.id}/fotos/${Date.now()}.jpg`, ev.target.result);
        fotos.push(url);
        await db.collection('users').doc(user.id).update({ fotos });
        currentUserCache = { ...user, fotos };
        showToast('Foto agregada correctamente');
        showMyProfile();
      } catch (err) {
        console.error(err);
        showToast('Error al subir la foto (revisá Storage en Firebase)', 'error');
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error(err);
    showToast('Error al subir la foto', 'error');
  }
}

async function eliminarFoto(index) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const doc = await db.collection('users').doc(user.id).get();
    const fotos = (doc.data().fotos || []).slice();
    fotos.splice(index, 1);
    await db.collection('users').doc(user.id).update({ fotos });
    currentUserCache = { ...user, fotos };
    showToast('Foto eliminada');
    showMyProfile();
  } catch (err) {
    console.error(err);
    showToast('Error al eliminar la foto', 'error');
  }
}

// ===== REVIEWS =====
let currentRatings = { calidad: 0, tiempo: 0, precio: 0 };

function setupRatingStars() {
  ['ratingCalidad', 'ratingTiempo', 'ratingPrecio'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    
    container.querySelectorAll('i').forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        const key = id.replace('rating', '').toLowerCase();
        currentRatings[key] = value;
        
        container.querySelectorAll('i').forEach(s => {
          const v = parseInt(s.dataset.value);
          s.className = v <= value ? 'fas fa-star active' : 'far fa-star';
        });
      });
      
      star.addEventListener('mouseenter', () => {
        const value = parseInt(star.dataset.value);
        container.querySelectorAll('i').forEach(s => {
          const v = parseInt(s.dataset.value);
          s.className = v <= value ? 'fas fa-star' : 'far fa-star';
        });
      });
    });
    
    container.addEventListener('mouseleave', () => {
      const key = id.replace('rating', '').toLowerCase();
      const current = currentRatings[key];
      container.querySelectorAll('i').forEach(s => {
        const v = parseInt(s.dataset.value);
        s.className = v <= current ? 'fas fa-star active' : 'far fa-star';
      });
    });
  });
}

function abrirModalResena(profId) {
  const user = getCurrentUser();
  if (!user || user.tipo !== 'cliente') {
    showToast('Debés iniciar sesión como cliente para dejar reseñas', 'error');
    return;
  }
  
  document.getElementById('reviewProfId').value = profId;
  currentRatings = { calidad: 0, tiempo: 0, precio: 0 };
  
  // Reset stars
  ['ratingCalidad', 'ratingTiempo', 'ratingPrecio'].forEach(id => {
    document.getElementById(id).querySelectorAll('i').forEach(s => {
      s.className = 'far fa-star';
    });
  });
  document.getElementById('reviewComentario').value = '';
  
  document.getElementById('reviewModal').classList.add('active');
}

function cerrarModal() {
  document.getElementById('reviewModal').classList.remove('active');
}

async function enviarResena(e) {
  e.preventDefault();

  const user = getCurrentUser();
  if (!user || user.tipo !== 'cliente') return;

  if (currentRatings.calidad === 0 || currentRatings.tiempo === 0 || currentRatings.precio === 0) {
    showToast('Por favor calificá las tres categorías', 'error');
    return;
  }

  const profId = document.getElementById('reviewProfId').value;
  const comentario = document.getElementById('reviewComentario').value.trim();

  try {
    const existentes = await getReviewsByProf(profId);
    if (existentes.find(r => r.clienteId === user.id)) {
      showToast('Ya dejaste una reseña para este profesional', 'error');
      return;
    }

    const nueva = {
      profId: profId,
      clienteId: user.id,
      clienteNombre: user.nombre,
      calidad: currentRatings.calidad,
      tiempo: currentRatings.tiempo,
      precio: currentRatings.precio,
      comentario: comentario,
      fecha: new Date().toISOString().split('T')[0]
    };

    await db.collection('reviews').add(nueva);
    // La notificación la crea la Cloud Function onReviewCreated

    cerrarModal();
    showToast('¡Reseña enviada con éxito!');
    verPerfil(profId);
  } catch (err) {
    console.error(err);
    showToast('Error al enviar la reseña', 'error');
  }
}

// ===== NOTIFICATIONS =====

function escaparHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function abrirLightbox(url) {
  let lb = document.getElementById('imageLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'imageLightbox';
    lb.className = 'image-lightbox';
    lb.innerHTML = '<button type="button" class="lightbox-close" aria-label="Cerrar">&times;</button><img src="" alt="Foto ampliada">';
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) cerrarLightbox();
    });
  }
  const img = lb.querySelector('img');
  img.src = url;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
  const lb = document.getElementById('imageLightbox');
  if (lb) lb.classList.remove('active');
  document.body.style.overflow = '';
}

window.abrirLightbox = abrirLightbox;
window.cerrarLightbox = cerrarLightbox;

async function getQuoteById(quoteId) {
  requireFirebase();
  try {
    const doc = await db.collection('quotes').doc(quoteId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.warn(err);
    return null;
  }
}

function mensajeWhatsAppPresupuesto(q) {
  const nombre = q.clienteNombre || 'cliente';
  const desc = (q.descripcion || '').trim();
  const corto = desc.length > 120 ? desc.substring(0, 120) + '…' : desc;
  let msg = 'Hola ' + nombre + ', te contacto por el presupuesto que solicitaste en la app Oficios YA!.';
  if (corto) msg += ' Respecto a: "' + corto + '".';
  msg += ' ¿Cuándo podríamos coordinar?';
  return msg;
}

function renderNotifPresupuestoDetalle(q) {
  if (!q) {
    return '<p class="notif-detail-missing">No se pudo cargar el detalle del presupuesto.</p>';
  }
  const fotos = Array.isArray(q.fotos) ? q.fotos : [];
  const fotosHtml = fotos.length
    ? `<div class="notif-fotos">${fotos.map((f, i) =>
        `<button type="button" class="notif-foto-btn" onclick="abrirLightbox('${String(f).replace(/'/g, "\\'")}')" title="Ampliar foto">
          <img src="${f}" alt="Foto del trabajo ${i + 1}" loading="lazy">
        </button>`
      ).join('')}</div>`
    : '<p class="notif-no-fotos">Sin fotos adjuntas</p>';

  const wa = urlWhatsApp(q.telefono, mensajeWhatsAppPresupuesto(q));
  const tel = q.telefono || '';

  return `
    <div class="notif-quote-detail">
      <div class="notif-quote-grid">
        <div><span class="nq-label">Cliente</span><span class="nq-val">${escaparHtml(q.clienteNombre || '—')}</span></div>
        <div><span class="nq-label">Teléfono</span><span class="nq-val">${escaparHtml(tel || '—')}</span></div>
        <div><span class="nq-label">Urgencia</span><span class="nq-val nq-urgencia">${escaparHtml(q.urgencia || 'Normal')}</span></div>
        <div><span class="nq-label">Fecha</span><span class="nq-val">${escaparHtml(formatDateTime(q.fecha || q.createdAt))}</span></div>
      </div>
      <div class="notif-quote-desc">
        <span class="nq-label">Descripción del trabajo</span>
        <p>${escaparHtml(q.descripcion || 'Sin descripción')}</p>
      </div>
      <div class="notif-quote-photos-wrap">
        <span class="nq-label">Fotos del problema</span>
        ${fotosHtml}
      </div>
      <div class="notif-quote-actions">
        ${wa ? `<a class="btn btn-whatsapp" href="${wa}" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp"></i> Responder por WhatsApp
        </a>` : ''}
        ${tel ? `<a class="btn btn-call" href="tel:${String(tel).replace(/"/g, '')}">
          <i class="fas fa-phone"></i> Llamar
        </a>` : ''}
      </div>
    </div>
  `;
}


async function showNotifications() {
  const user = getCurrentUser();
  if (!user) {
    showToast('Iniciá sesión para ver notificaciones', 'error');
    showSection('login');
    return;
  }
  if (user.tipo !== 'oficio') {
    showToast('Las notificaciones están disponibles para profesionales', 'error');
    return;
  }

  const container = document.getElementById('notificationsList');
  if (!container) {
    showToast('No se encontró la sección de notificaciones', 'error');
    return;
  }
  container.innerHTML = '<p style="text-align:center;color:var(--text-light);">Cargando...</p>';
  showSection('notifications');

  try {
    const notifs = await getNotifications(user.id);
    await markNotificationsRead(user.id);
    updateNotifBadge();

    if (notifs.length === 0) {
      container.innerHTML = `
        <div class="empty-notifs">
          <i class="fas fa-bell-slash"></i>
          <p>No tenés notificaciones todavía.</p>
          <p style="font-size:0.9rem;">Te avisaremos cuando dejen una reseña o te pidan un presupuesto.</p>
        </div>
      `;
      return;
    }

    // Presupuestos del profesional + detalle por id si hace falta
    const quotes = await getQuotesForProf(user.id);
    const quotesById = {};
    quotes.forEach(q => { quotesById[q.id] = q; });

    // Completar quotes faltantes referenciados en notifs
    for (const n of notifs) {
      if (n.tipo === 'presupuesto' && n.quoteId && !quotesById[n.quoteId]) {
        const q = await getQuoteById(n.quoteId);
        if (q) quotesById[q.id] = q;
      }
    }

    container.innerHTML = notifs.map(n => {
      const icon = n.tipo === 'presupuesto' ? 'fa-file-invoice-dollar' : 'fa-star';
      let body = '';
      if (n.tipo === 'presupuesto' && n.quoteId) {
        body = renderNotifPresupuestoDetalle(quotesById[n.quoteId]);
      } else if (n.tipo === 'resena') {
        body = `
          <div class="notif-review-detail">
            ${n.detalle ? `<p class="notif-review-text">${escaparHtml(n.detalle)}</p>` : ''}
          </div>
        `;
      }
      return `
        <article class="notif-item notif-card ${n.read ? '' : 'unread'} ${n.tipo === 'presupuesto' ? 'notif-presupuesto' : 'notif-resena'}">
          <div class="notif-card-header">
            <div class="notif-icon">
              <i class="fas ${icon}"></i>
            </div>
            <div class="notif-card-title">
              <p class="notif-msg"><strong>${escaparHtml(n.mensaje)}</strong></p>
              <span class="notif-time">${formatDateTime(n.fecha)}</span>
            </div>
          </div>
          ${body}
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error('Error notificaciones:', err);
    const msg = (err && err.message) ? err.message : 'Error desconocido';
    container.innerHTML = `<p style="text-align:center;color:var(--text-light);">Error al cargar notificaciones.</p>
      <p style="text-align:center;font-size:0.8rem;color:#c1121f;max-width:420px;margin:0.5rem auto;">${msg}</p>`;
    showToast('No se pudieron cargar las notificaciones', 'error');
  }
}

// ===== UTILS =====
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Calcula edad a partir de YYYY-MM-DD */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const str = String(fechaNacimiento);
  const nac = new Date(str.length <= 10 ? str + 'T12:00:00' : str);
  if (isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : null;
}

function formatFechaNacimiento(fecha) {
  if (!fecha) return '—';
  const str = String(fecha);
  const d = new Date(str.length <= 10 ? str + 'T12:00:00' : str);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function edadDesdePerfil(prof) {
  if (!prof) return null;
  if (prof.fechaNacimiento) {
    const e = calcularEdad(prof.fechaNacimiento);
    if (e !== null) return e;
  }
  return typeof prof.edad === 'number' ? prof.edad : null;
}

window.calcularEdad = calcularEdad;

function setMaxFechaNacimiento() {
  const hoy = new Date();
  const max = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  const iso = max.toISOString().slice(0, 10);
  ['oficioFechaNacimiento', 'editFechaNacimiento'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('max', iso);
  });
}



// ===== PRESUPUESTOS =====
let quoteFotosData = [];

function abrirModalPresupuesto(profId, profNombre) {
  const user = getCurrentUser();
  if (!user || user.tipo !== 'cliente') {
    showToast('Debés iniciar sesión como cliente para solicitar presupuestos', 'error');
    showSection('login');
    return;
  }

  document.getElementById('quoteProfId').value = profId;
  document.getElementById('quoteProfName').textContent = 'Profesional: ' + profNombre;
  document.getElementById('quoteDescripcion').value = '';
  document.getElementById('quoteTelefono').value = user.telefono || '';
  document.getElementById('quoteUrgencia').value = 'Normal';
  quoteFotosData = [];
  document.getElementById('quotePhotosPreview').innerHTML = '';
  const input = document.getElementById('quoteFotosInput');
  if (input) input.value = '';

  document.getElementById('quoteModal').classList.add('active');
}

function cerrarModalPresupuesto() {
  document.getElementById('quoteModal').classList.remove('active');
}

function previewQuoteFotos(e) {
  const files = Array.from(e.target.files || []);
  const remaining = 4 - quoteFotosData.length;
  if (remaining <= 0) {
    showToast('Máximo 4 fotos', 'error');
    return;
  }

  const toRead = files.slice(0, remaining);
  toRead.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Alguna imagen supera 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      quoteFotosData.push(ev.target.result);
      renderQuotePreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderQuotePreview() {
  const container = document.getElementById('quotePhotosPreview');
  container.innerHTML = quoteFotosData.map((src, i) => `
    <div style="position:relative;">
      <img src="${src}" alt="Foto ${i + 1}">
      <button type="button" onclick="quitarQuoteFoto(${i})" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border:none;border-radius:50%;background:#c1121f;color:white;cursor:pointer;font-size:0.7rem;">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

function quitarQuoteFoto(index) {
  quoteFotosData.splice(index, 1);
  renderQuotePreview();
}

async function enviarPresupuesto(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user || user.tipo !== 'cliente') return;

  const profId = document.getElementById('quoteProfId').value;
  const descripcion = document.getElementById('quoteDescripcion').value.trim();
  const telefono = document.getElementById('quoteTelefono').value.trim();
  const urgencia = document.getElementById('quoteUrgencia').value;

  if (!descripcion) {
    showToast('Completá la descripción del trabajo', 'error');
    return;
  }

  try {
    showToast('Enviando solicitud...');
    const fotoUrls = [];
    for (let i = 0; i < quoteFotosData.length; i++) {
      try {
        const url = await uploadImage(`quotes/${user.id}/${Date.now()}_${i}.jpg`, quoteFotosData[i]);
        fotoUrls.push(url);
      } catch (err) {
        console.warn('Foto de presupuesto no subida:', err);
      }
    }

    const quote = {
      profId,
      clienteId: user.id,
      clienteNombre: user.nombre,
      clienteEmail: user.email,
      telefono,
      descripcion,
      urgencia,
      fotos: fotoUrls,
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    };

    await db.collection('quotes').add(quote);
    // La notificación la crea la Cloud Function onQuoteCreated

    cerrarModalPresupuesto();
    showToast('¡Solicitud de presupuesto enviada! El profesional te contactará.');
  } catch (err) {
    console.error(err);
    showToast('Error al enviar el presupuesto', 'error');
  }
}

// ===== SOPORTE TÉCNICO (CHAT) =====
function toggleSupportChat() {
  const chat = document.getElementById('supportChat');
  if (!chat) return;
  chat.classList.toggle('open');
  if (chat.classList.contains('open')) {
    const input = document.getElementById('supportInput');
    if (input) setTimeout(() => input.focus(), 100);
  }
}

function appendSupportMsg(text, type) {
  const box = document.getElementById('supportMessages');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'support-msg ' + type;
  div.innerHTML = `<p>${text}</p>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function respuestaSoporte(mensaje) {
  const m = mensaje.toLowerCase();
  if (m.includes('sesión') || m.includes('login') || m.includes('ingresar') || m.includes('contraseña')) {
    return 'Para iniciar sesión usá el menú <strong>Iniciar Sesión</strong> con el email y contraseña con los que te registraste. Si olvidaste la clave, por ahora tenés que registrarte de nuevo (demo sin recuperación de contraseña).';
  }
  if (m.includes('presupuesto') || m.includes('cotiz')) {
    return 'Para pedir un presupuesto: 1) Iniciá sesión como <strong>cliente</strong>. 2) Buscá un profesional. 3) Entrá a su perfil y tocá <strong>Solicitar presupuesto</strong>. Podés adjuntar fotos y describir el problema.';
  }
  if (m.includes('profesional') || m.includes('oficio') || m.includes('registrar')) {
    return 'En <strong>Registrarse → Soy Persona de Oficio</strong> completá tus datos, DNI, oficio, zona y experiencia. Después podés subir fotos de trabajos en Mi Perfil.';
  }
  if (m.includes('reseña') || m.includes('valor')) {
    return 'Las reseñas las dejan los clientes desde el perfil del profesional (calidad, tiempo y precio). El profesional recibe una notificación.';
  }
  if (m.includes('hola') || m.includes('buenas') || m.includes('buen día')) {
    return '¡Hola! Contame en qué te ayudo: registro, presupuestos, reseñas o inicio de sesión.';
  }
  return 'Gracias por tu mensaje. Podés consultar sobre: registro, inicio de sesión, cómo pedir presupuesto o dejar reseñas. Si el problema continúa, escribí con más detalle y te orientamos.';
}

function supportQuickReply(text) {
  appendSupportMsg(text, 'user');
  setTimeout(() => {
    appendSupportMsg(respuestaSoporte(text), 'bot');
  }, 450);
}

function enviarMensajeSoporte(e) {
  e.preventDefault();
  const input = document.getElementById('supportInput');
  const text = (input.value || '').trim();
  if (!text) return;
  appendSupportMsg(text, 'user');
  input.value = '';
  setTimeout(() => {
    appendSupportMsg(respuestaSoporte(text), 'bot');
  }, 500);
}

window.toggleSupportChat = toggleSupportChat;
window.supportQuickReply = supportQuickReply;
window.enviarMensajeSoporte = enviarMensajeSoporte;
window.abrirModalPresupuesto = abrirModalPresupuesto;
window.cerrarModalPresupuesto = cerrarModalPresupuesto;
window.previewQuoteFotos = previewQuoteFotos;
window.quitarQuoteFoto = quitarQuoteFoto;
window.enviarPresupuesto = enviarPresupuesto;

// ===== START =====

// ===== PWA: INSTALAR APP =====
let deferredInstallPrompt = null;

function mostrarBotonesInstalar(show) {
  const nav = document.getElementById('navInstall');
  const hero = document.getElementById('btnInstallHero');
  const displayNav = show ? 'block' : 'none';
  const displayHero = show ? 'inline-flex' : 'none';
  if (nav) nav.style.display = displayNav;
  if (hero) hero.style.display = displayHero;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  mostrarBotonesInstalar(true);
  console.log('PWA: prompt de instalación disponible');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  mostrarBotonesInstalar(false);
  showToast('¡App instalada correctamente!');
});

async function instalarApp() {
  // Ya instalada / modo standalone
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    showToast('La app ya está instalada');
    mostrarBotonesInstalar(false);
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log('PWA install:', outcome);
    if (outcome === 'accepted') {
      showToast('Instalando Oficios YA!...');
    }
    deferredInstallPrompt = null;
    mostrarBotonesInstalar(false);
    return;
  }

  // iOS / navegadores sin beforeinstallprompt
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    showToast('En iPhone: Compartir → “Agregar a pantalla de inicio”');
    return;
  }
  showToast('Usá el menú del navegador: “Instalar aplicación” o “Agregar a la pantalla de inicio”');
}

window.instalarApp = instalarApp;



// ===== BARRA INFERIOR MÓVIL =====
function isMobileNav() {
  return window.matchMedia('(max-width: 768px)').matches;
}

/** Muestra la cápsula en móvil. Si se ocultó, vuelve al tocar. */
function mostrarBarraInferior() {
  const bar = document.getElementById('bottomNav');
  if (!bar) return;
  if (!isMobileNav()) {
    bar.classList.remove('visible');
    return;
  }
  bar.classList.add('visible');
}

function actualizarBarraInferior(sectionId) {
  const bar = document.getElementById('bottomNav');
  if (!bar) return;
  let active = 'home';
  if (sectionId === 'search') active = 'search';
  else if (['profile', 'myProfile', 'editAccount', 'notifications', 'login', 'register', 'verifyEmail'].includes(sectionId)) active = 'profile';
  else if (sectionId === 'home' || !sectionId) active = 'home';
  else active = '';
  bar.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === active);
  });
  mostrarBarraInferior();
}

function navBottom(destino) {
  mostrarBarraInferior();
  if (destino === 'home') {
    showSection('home');
    return;
  }
  if (destino === 'search') {
    showSection('search');
    return;
  }
  if (destino === 'profile') {
    const user = getCurrentUser();
    if (!user) {
      showSection('login');
      return;
    }
    if (user.tipo === 'oficio') {
      showMyProfile(false);
    } else {
      abrirEditarPerfil();
    }
  }
}

window.navBottom = navBottom;
window.mostrarBarraInferior = mostrarBarraInferior;

function setupBottomNavInteraction() {
  mostrarBarraInferior();

  // Al tocar o scrollear, la barra vuelve a aparecer si se había ocultado
  const show = () => {
    if (isMobileNav()) mostrarBarraInferior();
  };
  document.addEventListener('touchstart', show, { passive: true });
  document.addEventListener('touchend', show, { passive: true });
  document.addEventListener('click', show);
  window.addEventListener('scroll', show, { passive: true });
  window.addEventListener('resize', mostrarBarraInferior);
  window.addEventListener('orientationchange', () => setTimeout(mostrarBarraInferior, 100));

  setTimeout(mostrarBarraInferior, 300);
  setTimeout(mostrarBarraInferior, 1000);
}



// ===== NOTIFICACIONES PUSH (FCM) =====
async function activarNotificacionesPush() {
  try {
    if (!firebaseReady) {
      showToast('Firebase no está configurado', 'error');
      return false;
    }
    if (!('Notification' in window)) {
      showToast('Este navegador no soporta notificaciones', 'error');
      return false;
    }
    if (!messaging) {
      showToast('Las notificaciones push no están disponibles aquí', 'error');
      return false;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      showToast('Permiso de notificaciones denegado', 'error');
      return false;
    }

    if (!firebaseVapidKey || firebaseVapidKey === 'TU_VAPID_KEY') {
      showToast('Falta configurar la clave VAPID en firebase-config.js', 'error');
      console.error('Definí firebaseVapidKey (Cloud Messaging → Web Push certificates)');
      return false;
    }

    const reg = await navigator.serviceWorker.ready;
    const token = await messaging.getToken({
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: reg
    });

    if (!token) {
      showToast('No se pudo obtener el token de notificaciones', 'error');
      return false;
    }

    const user = getCurrentUser();
    if (user && user.id) {
      await guardarTokenFCM(user.id, token);
    } else {
      // Guardar temporal hasta login
      try { localStorage.setItem('oficiosya_fcm_pending', token); } catch (e) {}
    }

    showToast('Notificaciones push activadas');
    return true;
  } catch (err) {
    console.error('activarNotificacionesPush', err);
    showToast('No se pudieron activar las notificaciones push', 'error');
    return false;
  }
}

async function guardarTokenFCM(uid, token) {
  if (!uid || !token || !firebaseReady) return;
  try {
    const ref = db.collection('users').doc(uid);
    const doc = await ref.get();
    const data = doc.exists ? doc.data() : {};
    const tokens = Array.isArray(data.fcmTokens) ? data.fcmTokens.slice() : [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      // máximo 10 tokens por usuario
      while (tokens.length > 10) tokens.shift();
    }
    await ref.set({
      fcmTokens: tokens,
      fcmTokenUpdatedAt: new Date().toISOString()
    }, { merge: true });
    if (currentUserCache && currentUserCache.id === uid) {
      currentUserCache.fcmTokens = tokens;
    }
  } catch (err) {
    console.error('guardarTokenFCM', err);
  }
}

async function sincronizarPushTrasLogin(uid) {
  try {
    let pending = null;
    try { pending = localStorage.getItem('oficiosya_fcm_pending'); } catch (e) {}
    if (pending) {
      await guardarTokenFCM(uid, pending);
      try { localStorage.removeItem('oficiosya_fcm_pending'); } catch (e) {}
    }
    // Si ya había permiso, renovar token
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && messaging) {
      if (firebaseVapidKey && firebaseVapidKey !== 'TU_VAPID_KEY') {
        const reg = await navigator.serviceWorker.ready;
        const token = await messaging.getToken({
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration: reg
        });
        if (token) await guardarTokenFCM(uid, token);
      }
    }
  } catch (err) {
    console.warn('sincronizarPushTrasLogin', err);
  }
}

window.activarNotificacionesPush = activarNotificacionesPush;


document.addEventListener('DOMContentLoaded', init);
