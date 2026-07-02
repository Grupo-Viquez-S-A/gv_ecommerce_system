import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CatalogHeader from '../components/catalog/CatalogHeader';
import CatalogFilters, {
  EMPTY_CATALOG_FILTERS,
} from '../components/catalog/CatalogFilters';
import CatalogGrid from '../components/catalog/CatalogGrid';
import EmptyState from '../components/catalog/EmptyState';
import Pagination from '../components/catalog/Pagination';

/*
  ============================
  DATOS TEMPORALES DEL CATÁLOGO
  ============================

  Por ahora estos productos son únicamente para que la vista quede
  completamente funcional y visualmente armada.

  Más adelante se reemplazarán por los datos reales obtenidos desde:
  src/services/catalogService.js
*/

const CATALOG_PRODUCTS = [
  {
    product_id: 'textil-001',
    sku: 'TEL-001',
    product_name: 'Tela antifluido premium',
    description:
      'Tela resistente y cómoda, ideal para uniformes médicos, empresariales y de trabajo.',
    price: 6500,
    image_url:
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'telas',
      category_name: 'Telas',
    },

    product_type: {
      type_id: 'antifluidos',
      product_type: 'Antifluidos',
    },

    compositions: [
      {
        id: 'composition-001-1',
        material_name: 'Poliéster',
        percentage: 92,
      },
      {
        id: 'composition-001-2',
        material_name: 'Spandex',
        percentage: 8,
      },
    ],

    colors: [
      {
        id: 'color-001-1',
        color: 'Azul marino',
        hex_color: '#183D77',
      },
      {
        id: 'color-001-2',
        color: 'Negro',
        hex_color: '#111111',
      },
      {
        id: 'color-001-3',
        color: 'Blanco',
        hex_color: '#FFFFFF',
      },
    ],
  },

  {
    product_id: 'textil-002',
    sku: 'TEL-002',
    product_name: 'Tela algodón jersey',
    description:
      'Tela suave, fresca y flexible para prendas casuales, camisetas y ropa deportiva ligera.',
    price: 4800,
    image_url:
      'https://images.unsplash.com/photo-1603252110971-7d2e47f0a05d?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'telas',
      category_name: 'Telas',
    },

    product_type: {
      type_id: 'punto',
      product_type: 'Punto',
    },

    compositions: [
      {
        id: 'composition-002-1',
        material_name: 'Algodón',
        percentage: 95,
      },
      {
        id: 'composition-002-2',
        material_name: 'Spandex',
        percentage: 5,
      },
    ],

    colors: [
      {
        id: 'color-002-1',
        color: 'Blanco',
        hex_color: '#FFFFFF',
      },
      {
        id: 'color-002-2',
        color: 'Gris',
        hex_color: '#7B8490',
      },
      {
        id: 'color-002-3',
        color: 'Negro',
        hex_color: '#111111',
      },
    ],
  },

  {
    product_id: 'textil-003',
    sku: 'TEL-003',
    product_name: 'Tela sarga industrial',
    description:
      'Material de alta resistencia para uniformes industriales, pantalones, gabachas y ropa de trabajo.',
    price: 7200,
    image_url:
      'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'uniformes',
      category_name: 'Uniformes',
    },

    product_type: {
      type_id: 'sarga',
      product_type: 'Sarga',
    },

    compositions: [
      {
        id: 'composition-003-1',
        material_name: 'Poliéster',
        percentage: 65,
      },
      {
        id: 'composition-003-2',
        material_name: 'Algodón',
        percentage: 35,
      },
    ],

    colors: [
      {
        id: 'color-003-1',
        color: 'Azul marino',
        hex_color: '#183D77',
      },
      {
        id: 'color-003-2',
        color: 'Beige',
        hex_color: '#D7C29B',
      },
      {
        id: 'color-003-3',
        color: 'Verde militar',
        hex_color: '#4B5D3A',
      },
    ],
  },

  {
    product_id: 'textil-004',
    sku: 'DEP-001',
    product_name: 'Tela deportiva dry fit',
    description:
      'Tela ligera con secado rápido, ideal para camisetas, uniformes deportivos y actividades físicas.',
    price: 5900,
    image_url:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'deportivo',
      category_name: 'Deportivo',
    },

    product_type: {
      type_id: 'dry-fit',
      product_type: 'Dry fit',
    },

    compositions: [
      {
        id: 'composition-004-1',
        material_name: 'Poliéster',
        percentage: 100,
      },
    ],

    colors: [
      {
        id: 'color-004-1',
        color: 'Rojo',
        hex_color: '#A52A36',
      },
      {
        id: 'color-004-2',
        color: 'Azul rey',
        hex_color: '#1E4E9D',
      },
      {
        id: 'color-004-3',
        color: 'Negro',
        hex_color: '#111111',
      },
    ],
  },

  {
    product_id: 'textil-005',
    sku: 'HOT-001',
    product_name: 'Tela para ropa de cama',
    description:
      'Tela cómoda y durable para sábanas, fundas, cobertores y otros artículos de hotelería.',
    price: 8400,
    image_url:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'hoteleria',
      category_name: 'Hotelería',
    },

    product_type: {
      type_id: 'plano',
      product_type: 'Plano',
    },

    compositions: [
      {
        id: 'composition-005-1',
        material_name: 'Algodón',
        percentage: 70,
      },
      {
        id: 'composition-005-2',
        material_name: 'Poliéster',
        percentage: 30,
      },
    ],

    colors: [
      {
        id: 'color-005-1',
        color: 'Blanco',
        hex_color: '#FFFFFF',
      },
      {
        id: 'color-005-2',
        color: 'Beige',
        hex_color: '#D7C29B',
      },
      {
        id: 'color-005-3',
        color: 'Gris claro',
        hex_color: '#B8BDC7',
      },
    ],
  },

  {
    product_id: 'textil-006',
    sku: 'UNI-001',
    product_name: 'Tela gabardina ejecutiva',
    description:
      'Tela elegante y resistente para pantalones, chalecos, uniformes corporativos y prendas formales.',
    price: 7800,
    image_url:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'uniformes',
      category_name: 'Uniformes',
    },

    product_type: {
      type_id: 'gabardina',
      product_type: 'Gabardina',
    },

    compositions: [
      {
        id: 'composition-006-1',
        material_name: 'Poliéster',
        percentage: 80,
      },
      {
        id: 'composition-006-2',
        material_name: 'Rayón',
        percentage: 20,
      },
    ],

    colors: [
      {
        id: 'color-006-1',
        color: 'Negro',
        hex_color: '#111111',
      },
      {
        id: 'color-006-2',
        color: 'Gris oscuro',
        hex_color: '#3C4654',
      },
      {
        id: 'color-006-3',
        color: 'Azul marino',
        hex_color: '#183D77',
      },
    ],
  },

  {
    product_id: 'textil-007',
    sku: 'MAS-001',
    product_name: 'Tela acolchada para mascotas',
    description:
      'Tela suave y resistente para camas, accesorios y productos textiles destinados a mascotas.',
    price: 6900,
    image_url:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'mascotas',
      category_name: 'Mascotas',
    },

    product_type: {
      type_id: 'acolchada',
      product_type: 'Acolchada',
    },

    compositions: [
      {
        id: 'composition-007-1',
        material_name: 'Poliéster',
        percentage: 100,
      },
    ],

    colors: [
      {
        id: 'color-007-1',
        color: 'Gris',
        hex_color: '#7B8490',
      },
      {
        id: 'color-007-2',
        color: 'Café',
        hex_color: '#70523A',
      },
      {
        id: 'color-007-3',
        color: 'Azul',
        hex_color: '#2E5D9F',
      },
    ],
  },

  {
    product_id: 'textil-008',
    sku: 'TEL-004',
    product_name: 'Tela microfibra estampable',
    description:
      'Material versátil para sublimación, artículos promocionales, prendas y proyectos personalizados.',
    price: 6100,
    image_url:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',

    category: {
      category_id: 'telas',
      category_name: 'Telas',
    },

    product_type: {
      type_id: 'microfibra',
      product_type: 'Microfibra',
    },

    compositions: [
      {
        id: 'composition-008-1',
        material_name: 'Poliéster',
        percentage: 100,
      },
    ],

    colors: [
      {
        id: 'color-008-1',
        color: 'Blanco',
        hex_color: '#FFFFFF',
      },
      {
        id: 'color-008-2',
        color: 'Celeste',
        hex_color: '#5BB7D8',
      },
      {
        id: 'color-008-3',
        color: 'Rosado',
        hex_color: '#E5A0B8',
      },
    ],
  },
];

const PAGE_SIZE = 8;

export default function Catalog() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(EMPTY_CATALOG_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  /*
    Genera las categorías directamente desde los productos disponibles.
    Luego, cuando conectemos Supabase, estos datos vendrán desde la tabla
    categories mediante catalogService.js.
  */
  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    CATALOG_PRODUCTS.forEach((product) => {
      const category = product.category;

      if (category?.category_id && !uniqueCategories.has(category.category_id)) {
        uniqueCategories.set(category.category_id, category);
      }
    });

    return Array.from(uniqueCategories.values());
  }, []);

  /*
    Los tipos se reducen según la categoría seleccionada.
    Esto evita que un usuario vea tipos que no pertenecen a esa categoría.
  */
  const productTypes = useMemo(() => {
    const uniqueTypes = new Map();

    CATALOG_PRODUCTS.filter((product) => {
      if (!filters.categoryId) {
        return true;
      }

      return product.category?.category_id === filters.categoryId;
    }).forEach((product) => {
      const productType = product.product_type;

      if (productType?.type_id && !uniqueTypes.has(productType.type_id)) {
        uniqueTypes.set(productType.type_id, productType);
      }
    });

    return Array.from(uniqueTypes.values());
  }, [filters.categoryId]);

  const materials = useMemo(() => {
    const uniqueMaterials = new Map();

    CATALOG_PRODUCTS.forEach((product) => {
      product.compositions?.forEach((composition) => {
        const materialName = composition.material_name;

        if (!materialName) {
          return;
        }

        const materialId = materialName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-');

        if (!uniqueMaterials.has(materialId)) {
          uniqueMaterials.set(materialId, {
            material_id: materialId,
            material_name: materialName,
          });
        }
      });
    });

    return Array.from(uniqueMaterials.values());
  }, []);

  const colors = useMemo(() => {
    const uniqueColors = new Map();

    CATALOG_PRODUCTS.forEach((product) => {
      product.colors?.forEach((color) => {
        const colorName = color.color;

        if (!colorName) {
          return;
        }

        const colorValue = colorName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-');

        if (!uniqueColors.has(colorValue)) {
          uniqueColors.set(colorValue, {
            value: colorValue,
            label: colorName,
          });
        }
      });
    });

    return Array.from(uniqueColors.values());
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return CATALOG_PRODUCTS.filter((product) => {
      const productCategoryId = product.category?.category_id || '';
      const productTypeId = product.product_type?.type_id || '';

      const productMaterials = (product.compositions || [])
        .map((composition) => composition.material_name || '')
        .join(' ')
        .toLowerCase();

      const productColors = (product.colors || [])
        .map((color) => color.color || '')
        .join(' ')
        .toLowerCase();

      const searchableContent = [
        product.product_name,
        product.sku,
        product.description,
        product.category?.category_name,
        product.product_type?.product_type,
        productMaterials,
        productColors,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableContent.includes(normalizedSearch);

      const matchesCategory =
        !filters.categoryId || productCategoryId === filters.categoryId;

      const matchesProductType =
        !filters.typeId || productTypeId === filters.typeId;

      const matchesMaterial =
        !filters.materialId ||
        (product.compositions || []).some((composition) => {
          const materialValue = (composition.material_name || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');

          return materialValue === filters.materialId;
        });

      const matchesColor =
        !filters.color ||
        (product.colors || []).some((color) => {
          const colorValue = (color.color || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');

          return colorValue === filters.color;
        });

      return (
        matchesSearch &&
        matchesCategory &&
        matchesProductType &&
        matchesMaterial &&
        matchesColor
      );
    });
  }, [filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredProducts.slice(startIndex, endIndex);
  }, [currentPage, filteredProducts]);

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.categoryId ||
      filters.typeId ||
      filters.materialId ||
      filters.color
  );

  const handleFiltersChange = (nextFilters) => {
    /*
      Si se cambia la categoría y el tipo seleccionado ya no corresponde
      a dicha categoría, se elimina automáticamente el tipo.
    */
    const categoryChanged = nextFilters.categoryId !== filters.categoryId;

    let normalizedFilters = {
      ...nextFilters,
    };

    if (categoryChanged) {
      const selectedTypeStillExists = CATALOG_PRODUCTS.some(
        (product) =>
          product.category?.category_id === nextFilters.categoryId &&
          product.product_type?.type_id === nextFilters.typeId
      );

      if (!selectedTypeStillExists) {
        normalizedFilters.typeId = '';
      }
    }

    setFilters(normalizedFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_CATALOG_FILTERS);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleViewDetail = (product) => {
    const productIdentifier = product?.product_id || product?.sku;

    if (!productIdentifier) {
      return;
    }

    navigate(`/catalogo/${productIdentifier}`);
  };

  return (
    <div className="min-h-full w-full bg-[#0B1220] px-5 py-6 text-white sm:px-6 lg:px-8 lg:py-7">
      <CatalogHeader totalProducts={filteredProducts.length} />

      <CatalogFilters
        filters={filters}
        categories={categories}
        productTypes={productTypes}
        materials={materials}
        colors={colors}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {currentProducts.length > 0 ? (
        <>
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Mostrando{' '}
              <span className="font-bold text-white">
                {currentProducts.length}
              </span>{' '}
              de{' '}
              <span className="font-bold text-white">
                {filteredProducts.length}
              </span>{' '}
              productos
            </p>

            {hasActiveFilters && (
              <p className="text-xs font-medium text-[#86A4CE]">
                Resultados filtrados
              </p>
            )}
          </div>

          <CatalogGrid
            products={currentProducts}
            onViewDetail={handleViewDetail}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      )}
    </div>
  );
}