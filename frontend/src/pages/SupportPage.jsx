import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MessageCircle, ChevronDown, Clock, MapPin } from 'lucide-react';

const CONTACTS = [
  { icon: Mail, label: 'Email us', value: 'support@driverent.com', sub: 'Response within 2 hours', href: 'mailto:support@driverent.com' },
  { icon: Phone, label: 'Call us', value: '+234 800 RENT CAR', sub: 'Mon–Sat, 7am–9pm WAT', href: 'tel:+2348007368227' },
  { icon: MessageCircle, label: 'Live chat', value: 'Start a chat', sub: 'Available 24/7', href: '#chat' },
];

const FAQS = [
  { q: 'How do I cancel a booking?', a: 'Go to My Reservations, find your booking and click "Cancel". Full refund applies if cancelled 48+ hours before pickup; 50% refund within 24–48 hours; no refund within 24 hours.' },
  { q: 'What documents do I need at pickup?', a: 'You need a valid driver\'s licence, a credit or debit card in the driver\'s name, and a passport or national ID. International drivers must also bring their international driving permit.' },
  { q: 'What is the minimum age to rent?', a: 'Drivers must be at least 21 years old with a valid licence held for at least 1 year. Drivers aged 21–24 may incur a young driver surcharge depending on vehicle category.' },
  { q: 'Can I add an additional driver?', a: 'Yes — you can add an additional driver during checkout under Extras (₦10/day) or at the counter. They must present their own valid licence at pickup.' },
  { q: 'Is insurance included?', a: 'Basic third-party insurance is included with every rental. You can upgrade to Standard or Elite cover during checkout for additional protection including collision and theft damage waiver.' },
  { q: 'What happens if I return the vehicle late?', a: 'A grace period of 30 minutes applies. Beyond that, an extra day\'s rental charge is applied. Please call us in advance if you anticipate a late return.' },
  { q: 'Can I pick up at the airport?', a: 'Yes. We have desks at major airports. Select your airport terminal as the pickup location during booking and provide your flight number for flight-tracking.' },
  { q: 'What fuel policy applies?', a: 'Vehicles are provided with a full tank and must be returned full. Alternatively, opt for Prepaid Fuel at checkout and return the vehicle at any fuel level.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-primary-500 hover:text-secondary-600"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-gray-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-sm font-medium uppercase tracking-widest text-secondary-500">Help centre</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary-500">How can we help?</h1>
        <p className="mt-3 text-gray-500">
          Our team is available 24/7 to make sure your rental experience is seamless.
        </p>
      </motion.div>

      {/* Contact cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-10 grid gap-4 sm:grid-cols-3"
      >
        {CONTACTS.map(({ icon: Icon, label, value, sub, href }) => (
          <a
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-secondary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-500 transition group-hover:bg-secondary-50 group-hover:text-secondary-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">{label}</p>
              <p className="font-semibold text-primary-500 group-hover:text-secondary-600">{value}</p>
              <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
            </div>
          </a>
        ))}
      </motion.div>

      {/* Hours & locations info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-6 flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
          <Clock className="h-4 w-4 text-secondary-500" /> 24/7 emergency roadside support
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
          <MapPin className="h-4 w-4 text-secondary-500" /> 500+ pickup locations Nigeria-wide
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-12"
      >
        <h2 className="font-display text-2xl font-bold text-primary-500">Frequently asked questions</h2>
        <div className="mt-5 rounded-xl border border-gray-200 bg-white px-5 shadow-sm">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </motion.div>

      {/* Still need help */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-10 rounded-2xl bg-primary-500 px-8 py-8 text-center text-white"
      >
        <h3 className="font-display text-xl font-bold">Still need help?</h3>
        <p className="mt-2 text-sm text-white/70">Send us an email and we&apos;ll get back to you within 2 hours.</p>
        <a
          href="mailto:support@driverent.com"
          className="mt-4 inline-block rounded-lg bg-secondary-500 px-6 py-2.5 text-sm font-semibold text-primary-900 transition hover:bg-secondary-400"
        >
          Email support
        </a>
      </motion.div>
    </div>
  );
}
