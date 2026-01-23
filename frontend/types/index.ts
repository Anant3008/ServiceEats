export interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface ProfileData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  addresses: Address[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "pending" | "completed" | "cancelled";
  createdAt: string;
}

export interface Delivery {
  _id: string;
  orderId: string;
  driverName: string;
  status: "assigned" | "picked_up" | "on_the_way" | "delivered";
  location: { latitude: number; longitude: number };
}