import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Coffee, Croissant, IceCream, Wine, Trash2, X } from 'lucide-react';
import { productsAPI, Product, Order, OrderItem } from '../services/api';

type ProductWithQuantity = Product & {
  quantity: number;
};

type OrderWithItems = Order & {
  items: OrderItem[];
};

type ProductGroup = {
  id: string;
  name: string;
  icon: any;
  color: string;
};

const PRODUCT_GROUPS: ProductGroup[] = [
  { id: 'Kawa', name: 'Kawa', icon: Coffee, color: 'bg-amber-100' },
  { id: 'Wypieki', name: 'Wypieki', icon: Croissant, color: 'bg-orange-100' },
  { id: 'Desery', name: 'Desery', icon: IceCream, color: 'bg-pink-100' },
  { id: 'Napoje', name: 'Napoje', icon: Wine, color: 'bg-blue-100' },
];

type NewOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: ProductWithQuantity[], total: number) => void;
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  cart: ProductWithQuantity[];
  setCart: React.Dispatch<React.SetStateAction<ProductWithQuantity[]>>;
  editingOrder?: OrderWithItems | null;
};

export default function NewOrderModal({
  isOpen,
  onClose,
  onSubmit,
  selectedGroup,
  setSelectedGroup,
  cart,
  setCart,
  editingOrder,
}: NewOrderModalProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadProducts = async () => {
        try {
          setIsLoading(true);
          const productsData = await productsAPI.getAll();
          setAllProducts(productsData.filter(p => p.is_visible));
        } catch (error) {
          console.error('Failed to load products:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = () => {
    onSubmit(cart, getTotalPrice());
  };

  const getProductsByGroup = (groupName: string) => {
    return allProducts.filter((p) => p.group === groupName);
  };

  const products = selectedGroup ? getProductsByGroup(selectedGroup) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl" style={{ width: '1000px', height: '720px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2>{editingOrder ? `Edycja zamówienia #${editingOrder.id}` : 'Nowe zamówienie'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex" style={{ height: 'calc(720px - 64px)' }}>
          {/* Product area */}
          <div className="flex-1 p-6 overflow-auto bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-lg">Ładowanie produktów...</div>
              </div>
            ) : !selectedGroup ? (
              <>
                <h2 className="mb-6">Wybierz kategorię</h2>
                <div className="grid grid-cols-4 gap-3">
                  {PRODUCT_GROUPS.map((group) => {
                    const Icon = group.icon;
                    return (
                      <Card
                        key={group.id}
                        className={`${group.color} p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-amber-500`}
                        onClick={() => setSelectedGroup(group.id)}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2" />
                        <h3 className="text-center">{group.name}</h3>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2>
                    {PRODUCT_GROUPS.find((g) => g.id === selectedGroup)?.name}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGroup(null)}
                  >
                    Powrót do kategorii
                  </Button>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Brak produktów w tej kategorii
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-amber-500"
                        onClick={() => addToCart(product)}
                      >
                        <h3 className="mb-2">{product.name}</h3>
                        <p className="text-amber-700">{parseFloat(product.price.toString()).toFixed(2)} zł</p>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cart */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2>Koszyk</h2>
            </div>
            
            <ScrollArea className="flex-1 p-4 min-h-0">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Koszyk jest pusty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div>{item.name}</div>
                          <div className="text-gray-600">{parseFloat(item.price.toString()).toFixed(2)} zł</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <div>
                          {(item.price * item.quantity).toFixed(2)} zł
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex justify-between">
                <span>Suma:</span>
                <span>{getTotalPrice().toFixed(2)} zł</span>
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={handleSubmit}
                disabled={cart.length === 0}
              >
                Złóż zamówienie
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
