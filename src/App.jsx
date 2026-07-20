import { Routes, Route, Navigate } from 'react-router-dom'

import WebsiteLayout from './components/WebsiteLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import MyOrders from './pages/MyOrders'
import Contact from './pages/Contact'
import Reviews from './pages/Reviews'
import About from './pages/About'
import OurWork from './pages/OurWork'
import DynamicPage from './pages/DynamicPage'

import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AddProduct from './admin/AddProduct'
import EditProduct from './admin/EditProduct'
import AdminCategories from './admin/AdminCategories'
import AdminSiteSettings from './admin/AdminSiteSettings'
import AdminPages from './admin/AdminPages'
import EditSitePage from './admin/EditSitePage'
import AdminOrders from './admin/AdminOrders'
import AdminReviews from './admin/AdminReviews'
import AdminCoupons from './admin/AdminCoupons'
import AdminCustomers from './admin/AdminCustomers'
import AdminReports from './admin/AdminReports'
import AdminShippingSettings from './admin/AdminShippingSettings'
import AdminContactMessages from './admin/AdminContactMessages'
import Payment from './pages/Payment'

export default function App() {
  return (
    <Routes>
      <Route element={<WebsiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/track-order" element={<Navigate to="/my-orders" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reviews" element={<Reviews />} />

        <Route path="/about" element={<About />} />
        <Route path="/our-work" element={<OurWork />} />
        <Route
          path="/privacy-policy"
          element={<DynamicPage slug="privacy-policy" />}
        />
        <Route
          path="/return-policy"
          element={<DynamicPage slug="return-policy" />}
        />
        <Route
          path="/shipping-policy"
          element={<DynamicPage slug="shipping-policy" />}
        />
        <Route path="/terms" element={<DynamicPage slug="terms" />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="contact-messages" element={<AdminContactMessages />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="categories" element={<AdminCategories />} />

        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="shipping-settings" element={<AdminShippingSettings />} />

        <Route path="site-settings" element={<AdminSiteSettings />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="pages/:slug" element={<EditSitePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}