# Pagination Implementation (20 items per page)

## Overview
Implemented a reusable pagination component and integrated it into admin pages for better UX when managing large lists.

## Changes Made

### 1. New Component: `client/components/Pagination.tsx`
- **Purpose**: Reusable pagination component for all list pages
- **Features**:
  - Shows current page and total pages
  - Previous/Next navigation buttons
  - Page number buttons with smart ellipsis (shows max 5 page numbers)
  - Disabled state for first/last page buttons
  - Responsive design

### 2. Updated: `client/pages/AdminManageAds.tsx`
- **Import**: Added `Pagination` component import
- **State**: Added `currentPage` and `itemsPerPage = 20`
- **Logic**:
  - Filters ads based on search and status
  - Calculates `startIndex`, `endIndex`, and `paginatedAnuncios`
  - Shows 20 ads per page
  - Resets to page 1 when filters/search changes
- **UI Updates**:
  - Pagination info shows: "X-Y de Z anúncio(s) (Total: T)"
  - Pagination controls below the ad list

### 3. Updated: `client/pages/AdminManageUsers.tsx`
- **Import**: Added `Pagination` component import
- **State**: Added `currentPage` and `itemsPerPage = 20`
- **Logic**:
  - Filters users based on search
  - Calculates `startIndex`, `endIndex`, and `paginatedUsuarios`
  - Shows 20 users per page
  - Resets to page 1 when search changes
- **UI Updates**:
  - Pagination info shows: "X-Y de Z usuário(s)"
  - Pagination controls below the user table
  - Search input now resets pagination when used

## Usage for Future Pages

To add pagination to other list/cadastro pages:

```tsx
// 1. Import the component
import Pagination from "@/components/Pagination";

// 2. Add state
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 20;

// 3. After calculating filtered items
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedItems = filteredItems.slice(startIndex, endIndex);

// 4. Update your list to use paginated items
{paginatedItems.map(item => (
  // render item
))}

// 5. Add pagination component
<Pagination
  currentPage={currentPage}
  totalItems={filteredItems.length}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
/>
```

## Pages That Could Benefit from Pagination

The following cadastro pages currently don't have pagination:
- `CadastroEquipeDeVenda.tsx`
- `CadastroGruposProductos.tsx`
- `CadastroLojas.tsx`
- `CadastroProdutos.tsx`
- `CadastroTabelasPreco.tsx`
- `CadastroVariantes.tsx`
- `CadastroVariantesLista.tsx`

## Configuration

- **Default items per page**: 20 (can be changed by modifying `itemsPerPage` variable)
- **Max pages shown**: 5 (can be changed in `client/components/Pagination.tsx`)

## Notes

- Pagination automatically resets to page 1 when search/filter changes
- The Pagination component handles all edge cases (first/last page, ellipsis, etc.)
- Responsive design works on mobile and desktop
- All styling uses existing Walmart color scheme
