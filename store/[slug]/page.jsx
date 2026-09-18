//ye is ki frontend/store/[slug]/page.jsx file ha //
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API.replace(/\/api\/?$/, '');

export default function StorePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`${API}/showrooms/store/${slug}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setStore(json.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchStore();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 mb-6">Ye showroom exist nahi karta.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all"
          >
            Home Par Jao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 to-gray-900 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-6"
          >
            <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl shadow-xl">
              🏪
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">{store.name}</h1>
              <p className="text-blue-300 mt-1">📍 {store.city}</p>
              {store.description && (
                <p className="text-gray-300 mt-2 max-w-xl">{store.description}</p>
              )}
            </div>
          </motion.div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-xl hover:bg-green-500 transition-all text-sm font-semibold"
              >
                💬 WhatsApp
              </a>
            )}
            {store.email && (
              <a
                href={`mailto:${store.email}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all text-sm font-semibold"
              >
                📧 {store.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Cars Listing */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          Available Cars ({store.cars?.length || 0})
        </h2>

        {!store.cars || store.cars.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 text-center border border-gray-800">
            <p className="text-gray-400 text-lg">Abhi koi car listed nahi hai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.cars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/cars/${car.id}`)}
                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10"
              >
                {/* Car Image */}
                <div className="h-48 bg-gray-800 overflow-hidden">
                  {car.carImages?.[0]?.url ? (
                    <img
                      src={`${BASE_URL}${car.carImages[0].url.startsWith('/') ? '' : '/'}${car.carImages[0].url}`}
                      alt={car.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🚗
                    </div>
                  )}
                </div>
                {/* Car Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg truncate">{car.title}</h3>
                  <p className="text-blue-400 font-semibold mt-1">
                    Rs. {Number(car.price).toLocaleString()}
                  </p>
                  <div className="flex gap-3 mt-2 text-gray-400 text-sm">
                    <span>📅 {car.year}</span>
                    <span>📍 {car.city}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}