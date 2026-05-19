import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Settings2, Users, Luggage } from 'lucide-react';
import { formatMoney } from '../../lib/currency.js';
import { useConfig } from '../../hooks/useConfig.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { cn } from '../../lib/cn.js';

export default function VehicleCard({ vehicle, startDate, endDate, listView = false }) {
  const { data: config } = useConfig();
  const currency = config?.currency_code || 'NGN';
  const photo = vehicle.photo_urls?.[0];
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate }).toString();

  const content = (
    <>
      <div className={cn('overflow-hidden bg-gray-100', listView ? 'h-full w-44 shrink-0' : 'aspect-[16/10]')}>
        {photo ? (
          <img
            src={photo}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {vehicle.category && (
          <Badge variant="gold" className="mb-2 w-fit capitalize">
            {vehicle.category}
          </Badge>
        )}
        <h3 className="text-lg font-semibold text-primary-500">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-gray-500">{vehicle.year}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1 capitalize">
            <Fuel className="h-3.5 w-3.5" /> {vehicle.fuel_type}
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Settings2 className="h-3.5 w-3.5" /> {vehicle.transmission}
          </span>
          {vehicle.seats && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {vehicle.seats}
            </span>
          )}
          {vehicle.luggage_capacity && (
            <span className="flex items-center gap-1">
              <Luggage className="h-3.5 w-3.5" /> {vehicle.luggage_capacity} bags
            </span>
          )}
        </div>
        <p className="mt-3 text-xl font-bold text-primary-500">
          {formatMoney(vehicle.daily_rate, currency)}
          <span className="text-sm font-normal text-gray-500">/day</span>
        </p>
        <Button asChild className="mt-4" fullWidth>
          <Link to={`/vehicles/${vehicle.id}?${qs}`}>Select Vehicle</Link>
        </Button>
      </div>
    </>
  );

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={cn(
        'group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg',
        listView && 'flex'
      )}
    >
      {content}
    </motion.article>
  );
}
