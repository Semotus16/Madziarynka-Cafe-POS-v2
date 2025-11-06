import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { ordersAPI, productsAPI, Product, Order, OrderItem } from '../../services/api';
import NewOrderModal from '../NewOrderModal';

type ProductWithQuantity = Product & {
  quantity: number;
};

type OrderWithItems = Order & {
  items: OrderItem[];
};

type OrdersTabProps = {
  user: User;
};

export default function OrdersTab({ user }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // New order dialog state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [cart, setCart] = useState<ProductWithQuantity[]>([]);

  // Load orders function
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const openOrders = await ordersAPI.getAll('open');
      // Load order items for each order
      const ordersWithItems = await Promise.all(
        openOrders.map(async (order) => {
          try {
            const fullOrder = await ordersAPI.getById(order.id);
            return {
              ...order,
              items: fullOrder.items || []
            };
          } catch {
            return { ...order, items: [] };
          }
        })
      );
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Błąd podczas ładowania zamówień');
    } finally {
      setIsLoading(false);
    }
  };

  // Load orders and products on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadOrders();
      try {
        const productsData = await productsAPI.getAll();
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadData();
  }, []);

  const handleCreateNewOrder = () => {
    setCart([]);
    setSelectedGroup(null);
    setIsNewOrderOpen(true);
  };

  const handleEditOrder = (order: OrderWithItems) => {
    setEditingOrder(order);
    const cartItems = order.items.map(item => ({
      ...products.find(p => p.id === item.product_id)!,
      quantity: item.quantity
    }));
    setCart(cartItems);
    setIsNewOrderOpen(true);
  };

  const handleCloseNewOrder = () => {
    setIsNewOrderOpen(false);
    setCart([]);
    setSelectedGroup(null);
    setEditingOrder(null);
  };

  const handleSubmitOrder = async (items: ProductWithQuantity[], total: number) => {
    try {
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, items, total, user);
        toast.success(`Zamówienie #${editingOrder.id} zostało zaktualizowane!`);
      } else {
        const orderData = {
          userId: user.id,
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total: total
        };
        const createdOrder = await ordersAPI.create(orderData);
        toast.success(`Zamówienie #${createdOrder.id} zostało złożone!`);
      }
      handleCloseNewOrder();
      loadOrders();
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania zamówienia.');
      console.error('Failed to submit order:', error);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await ordersAPI.complete(orderId);
      
      // Remove completed order from list
      setOrders(orders.filter(order => order.id !== orderId));
      toast.success('Zamówienie zrealizowane! Składniki zostały odejęte z magazynu.');
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast.error('Błąd podczas realizacji zamówienia');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800">Otwarte</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Zrealizowane</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Anulowane</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie zamówień...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Zamówienia otwarte</h2>
        <Button
          onClick={handleCreateNewOrder}
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-5 h-5" />
          Nowe zamówienie
        </Button>
      </div>

      {/* Open Orders Dashboard */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="mb-4">Brak otwartych zamówień</p>
            <p className="text-sm">Kliknij "Nowe zamówienie" aby rozpocząć</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-amber-200 shadow-md hover:shadow-xl transition-shadow relative"
                style={{
                  transform: `rotate(${Math.random() * 2 - 1}deg)`,
                }}
              >
                {/* Paper clip effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-gray-400 rounded-full opacity-40" />
                
                {/* Order header */}
                <div className="mb-4 pb-3 border-b-2 border-dashed border-amber-300">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-amber-900">Zamówienie #{order.id}</div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(order.created_at)}</span>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-2 mb-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center text-sm">
                        <span className="font-semibold">{item.quantity}x</span>
                        <span className="truncate text-left">{item.product_name || item.product_id}</span>
                        <span className="text-right">{(item.price_per_item * item.quantity).toFixed(2)} zł</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Brak pozycji</div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-dashed border-amber-300 mb-4">
                  <div className="flex justify-between">
                    <span>SUMA:</span>
                    <span>{parseFloat(order.total_price.toString()).toFixed(2)} zł</span>
                  </div>
                </div>

                {/* Actions */}
                {order.status === 'open' ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Zrealizuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEditOrder(order)}
                    >
                      Edytuj
                    </Button>
                  </div>
                ) : (
                  <div className="w-full text-center text-sm text-gray-500">
                    {order.status === 'completed' ? 'Zrealizowane' : 'Anulowane'}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={handleCloseNewOrder}
        onSubmit={handleSubmitOrder}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        cart={cart}
        setCart={setCart}
      />
    </div>
  );
}
