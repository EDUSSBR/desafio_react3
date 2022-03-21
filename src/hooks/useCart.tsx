import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      const itemIndex = newCart.findIndex(item => item.id === productId)
      
      const product = await api.get(`stock/${productId}`).then((response) => response.data)
      const productInStock = product.amount
      if (productInStock < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (itemIndex === -1 && productInStock > 0) {
        const product = await api.get(`products/${productId}`).then((response) => response.data)
        newCart.push({...product, amount:1})
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return ;
      }
      let currentItem = newCart[itemIndex]
      if (itemIndex > -1 && productInStock > (currentItem.amount)) {
        currentItem.amount++
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return ;
      } 
      toast.error('Quantidade solicitada fora de estoque');
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const itemIndex = newCart.findIndex(item=> item.id === productId)
      if (itemIndex> 0 ){
        newCart[itemIndex].amount--
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return
      }
      toast.error('Erro na remoção do produto')
      return
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart]
      const itemIndex = newCart.findIndex((item)=>item.id===productId)
      const itemAmountInStock = await api.get(`stock/${productId}`).then((response)=> response.data.amount)
      if (amount<1){
        return
      }
      if (amount > itemAmountInStock){
        toast.error("Quantidade solicitada fora de estoque")
        return
      }
      newCart[itemIndex].amount= amount
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error("Erro na alteração de quantidade do produto")
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
