// Mock data for client module - La Santa Cruz

export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  category: string
  subcategory: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  colors: { id: string; name: string; hex: string }[]
  sizes: { id: string; name: string; available: boolean }[]
  stock: 'disponible' | 'pocas-unidades' | 'agotado'
  stockCount: number
  image: string
  promotion?: {
    name: string
    discount: number
    endDate: string
  }
  isFavorite?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  productCount: number
  slug: string
}

export interface Promotion {
  id: string
  title: string
  description: string
  discount: number
  code?: string
  endDate: string
  category?: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedSize: string
  selectedColor: string
}

export interface Order {
  id: string
  date: string
  status: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado'
  total: number
  items: number
}

export const categories: Category[] = [
  { id: '1', name: 'Hombre', icon: 'user', productCount: 234, slug: 'hombre' },
  { id: '2', name: 'Mujer', icon: 'user', productCount: 312, slug: 'mujer' },
  { id: '3', name: 'Calzado', icon: 'footprints', productCount: 156, slug: 'calzado' },
  { id: '4', name: 'Accesorios', icon: 'watch', productCount: 89, slug: 'accesorios' },
  { id: '5', name: 'Deportivo', icon: 'dumbbell', productCount: 178, slug: 'deportivo' },
  { id: '6', name: 'Formal', icon: 'briefcase', productCount: 95, slug: 'formal' },
]

export const promotions: Promotion[] = [
  {
    id: '1',
    title: '20% en Temporada',
    description: 'Descuento en toda la colección primavera-verano',
    discount: 20,
    code: 'PRIMAVERA20',
    endDate: '2024-04-30',
    category: 'Mujer'
  },
  {
    id: '2',
    title: '2x1 en Accesorios',
    description: 'Lleva 2 y paga 1 en accesorios seleccionados',
    discount: 50,
    endDate: '2024-03-31',
    category: 'Accesorios'
  },
  {
    id: '3',
    title: '15% Primera Compra',
    description: 'Descuento exclusivo para nuevos clientes',
    discount: 15,
    code: 'BIENVENIDO15',
    endDate: '2024-12-31'
  },
  {
    id: '4',
    title: 'Envío Gratis',
    description: 'En compras mayores a $1,500 MXN',
    discount: 0,
    endDate: '2024-12-31'
  }
]

export const products: Product[] = [
  {
    id: '1',
    sku: 'LSC-CAM-001',
    name: 'Camisa Bordada Oaxaqueña',
    brand: 'La Santa Cruz',
    category: 'Mujer',
    subcategory: 'Blusas',
    description: 'Camisa artesanal con bordado tradicional de Oaxaca. Tela de algodón 100% natural.',
    price: 1250,
    originalPrice: 1500,
    discount: 17,
    colors: [
      { id: 'c1', name: 'Blanco', hex: '#FFFFFF' },
      { id: 'c2', name: 'Crema', hex: '#F5F5DC' },
      { id: 'c3', name: 'Rosa Pastel', hex: '#FFB6C1' }
    ],
    sizes: [
      { id: 's1', name: 'XS', available: true },
      { id: 's2', name: 'S', available: true },
      { id: 's3', name: 'M', available: true },
      { id: 's4', name: 'L', available: false },
      { id: 's5', name: 'XL', available: true }
    ],
    stock: 'disponible',
    stockCount: 45,
    image: '/placeholder.svg',
    promotion: {
      name: '20% Temporada',
      discount: 20,
      endDate: '2024-04-30'
    }
  },
  {
    id: '2',
    sku: 'LSC-VES-002',
    name: 'Vestido Huipil Chiapaneco',
    brand: 'La Santa Cruz',
    category: 'Mujer',
    subcategory: 'Vestidos',
    description: 'Vestido tradicional con bordado de flores característico de Chiapas.',
    price: 2800,
    colors: [
      { id: 'c1', name: 'Negro', hex: '#000000' },
      { id: 'c2', name: 'Azul Marino', hex: '#000080' }
    ],
    sizes: [
      { id: 's1', name: 'S', available: true },
      { id: 's2', name: 'M', available: true },
      { id: 's3', name: 'L', available: true }
    ],
    stock: 'pocas-unidades',
    stockCount: 8,
    image: '/placeholder.svg'
  },
  {
    id: '3',
    sku: 'LSC-GUA-003',
    name: 'Guayabera Yucateca Premium',
    brand: 'La Santa Cruz',
    category: 'Hombre',
    subcategory: 'Camisas',
    description: 'Guayabera clásica con alforzas y bordado sutil. Ideal para eventos formales.',
    price: 1650,
    originalPrice: 1850,
    discount: 11,
    colors: [
      { id: 'c1', name: 'Blanco', hex: '#FFFFFF' },
      { id: 'c2', name: 'Beige', hex: '#F5F5DC' },
      { id: 'c3', name: 'Celeste', hex: '#87CEEB' }
    ],
    sizes: [
      { id: 's1', name: 'S', available: false },
      { id: 's2', name: 'M', available: true },
      { id: 's3', name: 'L', available: true },
      { id: 's4', name: 'XL', available: true },
      { id: 's5', name: 'XXL', available: true }
    ],
    stock: 'disponible',
    stockCount: 62,
    image: '/placeholder.svg',
    promotion: {
      name: 'Oferta Especial',
      discount: 11,
      endDate: '2024-03-15'
    }
  },
  {
    id: '4',
    sku: 'LSC-REB-004',
    name: 'Rebozo de Seda Mexicana',
    brand: 'La Santa Cruz',
    category: 'Accesorios',
    subcategory: 'Rebozos',
    description: 'Rebozo artesanal tejido en telar de cintura con seda natural.',
    price: 3500,
    colors: [
      { id: 'c1', name: 'Terracota', hex: '#E2725B' },
      { id: 'c2', name: 'Índigo', hex: '#4B0082' },
      { id: 'c3', name: 'Verde Jade', hex: '#00A86B' }
    ],
    sizes: [
      { id: 's1', name: 'Único', available: true }
    ],
    stock: 'pocas-unidades',
    stockCount: 5,
    image: '/placeholder.svg'
  },
  {
    id: '5',
    sku: 'LSC-HUA-005',
    name: 'Huaraches Artesanales',
    brand: 'La Santa Cruz',
    category: 'Calzado',
    subcategory: 'Sandalias',
    description: 'Huaraches tejidos a mano con piel de res curtida naturalmente.',
    price: 890,
    originalPrice: 990,
    discount: 10,
    colors: [
      { id: 'c1', name: 'Café', hex: '#8B4513' },
      { id: 'c2', name: 'Negro', hex: '#000000' },
      { id: 'c3', name: 'Natural', hex: '#D2B48C' }
    ],
    sizes: [
      { id: 's1', name: '24', available: true },
      { id: 's2', name: '25', available: true },
      { id: 's3', name: '26', available: false },
      { id: 's4', name: '27', available: true },
      { id: 's5', name: '28', available: true }
    ],
    stock: 'disponible',
    stockCount: 34,
    image: '/placeholder.svg'
  },
  {
    id: '6',
    sku: 'LSC-PAN-006',
    name: 'Pantalón Manta Oaxaqueño',
    brand: 'La Santa Cruz',
    category: 'Hombre',
    subcategory: 'Pantalones',
    description: 'Pantalón de manta con bordado en cintura. Fresco y cómodo.',
    price: 750,
    colors: [
      { id: 'c1', name: 'Blanco', hex: '#FFFFFF' },
      { id: 'c2', name: 'Crudo', hex: '#FFFDD0' }
    ],
    sizes: [
      { id: 's1', name: '28', available: true },
      { id: 's2', name: '30', available: true },
      { id: 's3', name: '32', available: true },
      { id: 's4', name: '34', available: false },
      { id: 's5', name: '36', available: true }
    ],
    stock: 'disponible',
    stockCount: 28,
    image: '/placeholder.svg'
  },
  {
    id: '7',
    sku: 'LSC-BOL-007',
    name: 'Bolso Tejido Wayuu',
    brand: 'Artesanos MX',
    category: 'Accesorios',
    subcategory: 'Bolsos',
    description: 'Bolso artesanal tejido por comunidades Wayuu. Diseño único.',
    price: 1200,
    colors: [
      { id: 'c1', name: 'Multicolor', hex: '#FF6B6B' },
      { id: 'c2', name: 'Azul/Verde', hex: '#4ECDC4' }
    ],
    sizes: [
      { id: 's1', name: 'Mediano', available: true },
      { id: 's2', name: 'Grande', available: true }
    ],
    stock: 'agotado',
    stockCount: 0,
    image: '/placeholder.svg'
  },
  {
    id: '8',
    sku: 'LSC-FAL-008',
    name: 'Falda Bordada Tehuana',
    brand: 'La Santa Cruz',
    category: 'Mujer',
    subcategory: 'Faldas',
    description: 'Falda larga con bordado floral estilo Tehuana del Istmo de Tehuantepec.',
    price: 2200,
    colors: [
      { id: 'c1', name: 'Negro/Flores', hex: '#000000' },
      { id: 'c2', name: 'Rojo/Flores', hex: '#DC143C' }
    ],
    sizes: [
      { id: 's1', name: 'S', available: true },
      { id: 's2', name: 'M', available: true },
      { id: 's3', name: 'L', available: true }
    ],
    stock: 'disponible',
    stockCount: 19,
    image: '/placeholder.svg'
  }
]

export const recentOrders: Order[] = [
  { id: 'ORD-2024-001', date: '2024-03-10', status: 'entregado', total: 3450, items: 3 },
  { id: 'ORD-2024-002', date: '2024-03-08', status: 'enviado', total: 1650, items: 1 },
  { id: 'ORD-2024-003', date: '2024-03-05', status: 'procesando', total: 5200, items: 4 },
  { id: 'ORD-2024-004', date: '2024-02-28', status: 'entregado', total: 890, items: 1 },
]

export const subcategories: Record<string, string[]> = {
  'Hombre': ['Camisas', 'Pantalones', 'Guayaberas', 'Chalecos'],
  'Mujer': ['Blusas', 'Vestidos', 'Faldas', 'Huipiles'],
  'Calzado': ['Huaraches', 'Sandalias', 'Botas', 'Mocasines'],
  'Accesorios': ['Rebozos', 'Bolsos', 'Sombreros', 'Joyería'],
  'Deportivo': ['Playeras', 'Shorts', 'Leggings', 'Sudaderas'],
  'Formal': ['Trajes', 'Vestidos Gala', 'Camisas Vestir', 'Corbatas']
}

export const brands = ['La Santa Cruz', 'Artesanos MX', 'Oaxaca Textil', 'Chiapas Arte', 'Yucatán Premium']

export const colorOptions = [
  { id: 'c1', name: 'Blanco', hex: '#FFFFFF' },
  { id: 'c2', name: 'Negro', hex: '#000000' },
  { id: 'c3', name: 'Crema', hex: '#F5F5DC' },
  { id: 'c4', name: 'Azul', hex: '#000080' },
  { id: 'c5', name: 'Rojo', hex: '#DC143C' },
  { id: 'c6', name: 'Verde', hex: '#00A86B' },
  { id: 'c7', name: 'Café', hex: '#8B4513' },
  { id: 'c8', name: 'Rosa', hex: '#FFB6C1' },
]

export const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '24', '25', '26', '27', '28', '30', '32', '34', '36']
