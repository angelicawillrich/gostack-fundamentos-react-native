import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const result = await AsyncStorage.getItem('products');
      const productsInCart: Product[] = JSON.parse(result || '[]');
      setProducts(productsInCart);
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsInCart = products.map(productInCart => {
        if (productInCart.id === id) {
          productInCart.quantity += 1;
        }
        return productInCart;
      });

      setProducts(productsInCart);
      await AsyncStorage.setItem('products', JSON.stringify(productsInCart));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsInCart = products
        .filter(
          productInCart =>
            productInCart.quantity > 1 || productInCart.id !== id,
        )
        .map(productInCart => {
          if (productInCart.id === id) {
            productInCart.quantity -= 1;
          }
          return productInCart;
        });

      setProducts(productsInCart);
      await AsyncStorage.setItem('products', JSON.stringify(productsInCart));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        productInCart => productInCart.id === product.id,
      );

      if (productExists) {
        increment(product.id);
      } else {
        product.quantity = 1;

        const populatedProducts = [...products];
        populatedProducts.push(product);
        setProducts(populatedProducts);
        await AsyncStorage.setItem(
          'products',
          JSON.stringify(populatedProducts),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
