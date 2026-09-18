// frontend/app/(main)/layout.jsx
import Navbar from '@/components/layout/Navbar';
import FloatingPostButton from '@/components/layout/FloatingPostButton';
import Footer from '@/components/layout/Footer'; // ✅ NEW — proper footer

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      {/* Navbar with Database Auth Connection */}
      <Navbar />
      
      {/* Main Website Pages */}
      <main className="grow max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* PakWheels Style Floating Post Ad Button */}
      <FloatingPostButton />

      {/* ✅ Proper Footer component — links, social, contact */}
      <Footer />
    </div>
  );
}