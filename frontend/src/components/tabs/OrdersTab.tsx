import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Plus, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';
import NewOrderModal from '../NewOrderModal';

type Product = {
  id: string;
  name: string;
  price: number;
  group: string;
};

type CartItem = Product & {
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: number;
  timestamp: string;
  items: CartItem[];
  total: number;
  status: 'open' | 'completed';
};

type OrdersTabProps = {
  user: User;
};

export default function OrdersTab({ user }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orderCounter, setOrderCounter] = useState(1);

  // New order dialog state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleCreateNewOrder = () => {
    setCart([]);
    setSelectedGroup(null);
    setIsNewOrderOpen(true);
  };

  const handleCloseNewOrder = () => {
    setIsNewOrderOpen(false);
    setCart([]);
    setSelectedGroup(null);
  };

  const handleSubmitOrder = (items: CartItem[], total: number) => {
    if (items.length === 0) {
      toast.error('Koszyk jest pusty');
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: orderCounter,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      items: [...items],
      total: total,
      status: 'open',
    };

    setOrders((prev) => [...prev, newOrder]);
    setOrderCounter((prev) => prev + 1);
    toast.success(`Zamówienie #${orderCounter} utworzone!`);
    
    setCart([]);
    setSelectedGroup(null);
    setIsNewOrderOpen(false);
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    toast.success('Zamówienie zrealizowane');
  };

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
                    <div className="text-amber-900">Zamówienie #{order.orderNumber}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{order.timestamp}</span>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="flex-1">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-amber-800">
                        {(item.price * item.quantity).toFixed(2)} zł
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-dashed border-amber-300 mb-4">
                  <div className="flex justify-between">
                    <span>SUMA:</span>
                    <span>{order.total.toFixed(2)} zł</span>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  onClick={() => handleCompleteOrder(order.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Zrealizuj
                </Button>
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
