import { lazy, Suspense } from 'react'
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

import Payment from './pages/Payment'
import NotFound from './pages/NotFound'
import Wishlist from './pages/Wishlist'
import Compare from './pages/Compare'
import InstallationRequest from './pages/InstallationRequest'

// لوحة التحكم بتتحمّل بس لما الأدمن يفتحها (الموقع أخف وأسرع للعملاء)
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./admin/AdminProducts'))
const AddProduct = lazy(() => import('./admin/AddProduct'))
const EditProduct = lazy(() => import('./admin/EditProduct'))
const AdminCategories = lazy(() => import('./admin/AdminCategories'))
const AdminSiteSettings = lazy(() => import('./admin/AdminSiteSettings'))
const AdminPages = lazy(() => import('./admin/AdminPages'))
const EditSitePage = lazy(() => import('./admin/EditSitePage'))
const AdminOrders = lazy(() => import('./admin/AdminOrders'))
const AdminReviews = lazy(() => import('./admin/AdminReviews'))
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'))
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'))
const AdminReports = lazy(() => import('./admin/AdminReports'))
const AdminShippingSettings = lazy(() => import('./admin/AdminShippingSettings'))
const AdminContactMessages = lazy(() => import('./admin/AdminContactMessages'))
const AdminSiteFeatures = lazy(() => import('./admin/AdminSiteFeatures'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminSubscribers = lazy(() => import('./admin/AdminSubscribers'))
const AdminBulkProducts = lazy(() => import('./admin/AdminBulkProducts'))

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100" dir="rtl">
      <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-slate-900 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<AdminFallback />}>
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
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/installation-request" element={<InstallationRequest />} />
        <Route path="*" element={<NotFound />} />
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
        <Route path="products/bulk" element={<AdminBulkProducts />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="categories" element={<AdminCategories />} />

        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="shipping-settings" element={<AdminShippingSettings />} />

        <Route path="site-settings" element={<AdminSiteSettings />} />
        <Route path="site-features" element={<AdminSiteFeatures />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="subscribers" element={<AdminSubscribers />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="pages/:slug" element={<EditSitePage />} />
      </Route>

    </Routes>
    </Suspense>
  )
}