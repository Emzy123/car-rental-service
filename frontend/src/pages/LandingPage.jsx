import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Clock, MapPin, Star, ArrowRight } from 'lucide-react';
import { SearchWidget } from '../components/vehicles/SearchWidget.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useSearchStore } from '../stores/searchStore.js';

const categories = [
  { id: 'luxury', label: 'Luxury', img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&auto=format&fit=crop' },
  { id: 'suv', label: 'SUV', img: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop' },
  { id: 'sports', label: 'Sports', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop' },
  { id: 'electric', label: 'Electric', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&auto=format&fit=crop' },
  { id: 'economy', label: 'Economy', img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop' },
  { id: 'van', label: 'Van', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop' },
];

const stats = [
  { value: '500+', label: 'Locations worldwide' },
  { value: '50K+', label: 'Happy customers' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '24/7', label: 'Customer support' },
];

const features = [
  { icon: Shield, title: 'Fully insured', desc: 'All vehicles come with comprehensive insurance coverage.' },
  { icon: Clock, title: 'Flexible pickup', desc: 'Pick up and return at any of our 500+ locations.' },
  { icon: MapPin, title: 'Airport service', desc: 'Direct airport pickup and drop-off at major terminals.' },
  { icon: Star, title: 'Premium fleet', desc: 'Meticulously maintained luxury and economy vehicles.' },
];

const testimonials = [
  { name: 'Amara O.', role: 'Business traveller', text: 'The easiest rental experience I have ever had. The vehicle was immaculate.', rating: 5 },
  { name: 'Kwame A.', role: 'Frequent renter', text: 'Premium service at every step. Will never use another rental company.', rating: 5 },
  { name: 'Fatima B.', role: 'Family vacation', text: 'The SUV was perfect for our family trip. Spotless and fully loaded.', rating: 5 },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  const store = useSearchStore();
  const navigate = useNavigate();

  function goCategory(id) {
    store.setSearch({ category: id });
    navigate('/vehicles');
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-primary-900/95" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 md:pt-24">
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm uppercase tracking-widest text-secondary-400"
          >
            Premium car rental
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
          >
            Luxury Travel.{' '}
            <span className="text-secondary-400">Unlocked.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-gray-200"
          >
            Experience premium vehicles with white-glove service at 500+ locations worldwide.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 max-w-5xl"
          >
            <SearchWidget />
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-primary-900/80 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap justify-around gap-6 px-4 py-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-secondary-400">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Browse by category ── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold text-primary-500">
              Browse by category
            </motion.h2>
            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goCategory(c.id)}
                  className="group relative h-36 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500"
                >
                  <img
                    src={c.img}
                    alt={c.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent" />
                  <span className="absolute bottom-3 left-0 right-0 text-center text-sm font-semibold text-white">
                    {c.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Why DriveRent ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp} className="text-center">
              <h2 className="font-display text-3xl font-bold text-primary-500">Why DriveRent?</h2>
              <p className="mt-3 text-gray-500">Everything you need for a seamless rental experience.</p>
            </motion.div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <f.icon className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="mt-4 font-semibold text-primary-500">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-primary-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2 variants={fadeUp} className="text-center font-display text-3xl font-bold text-primary-500">
              What our customers say
            </motion.h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {testimonials.map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeUp}
                  className="rounded-xl bg-white p-6 shadow-sm"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary-500 text-secondary-500" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4">
                    <p className="font-semibold text-primary-500">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-500 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl px-4 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white">Ready to hit the road?</h2>
          <p className="mt-3 text-primary-200">Browse our fleet and book your perfect vehicle today.</p>
          <Button variant="secondary" size="xl" asChild className="mt-8">
            <Link to="/vehicles" className="inline-flex items-center gap-2">
              Explore fleet <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-gray-400">
          <span>PCI Compliant</span>
          <span className="h-4 w-px bg-gray-200" />
          <span>GDPR Ready</span>
          <span className="h-4 w-px bg-gray-200" />
          <span>ISO 27001</span>
          <span className="h-4 w-px bg-gray-200" />
          <span>Paystack Secure Payments</span>
        </div>
      </section>
    </div>
  );
}
