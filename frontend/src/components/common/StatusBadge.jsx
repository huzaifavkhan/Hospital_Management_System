const STATUS_MAP = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-green-50 text-green-700 ring-green-200' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-600 ring-red-200' },
  RESCHEDULED: { label: 'Rescheduled', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ACTIVE:      { label: 'Active',      cls: 'bg-green-50 text-green-700 ring-green-200' },
  INACTIVE:    { label: 'Inactive',    cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
  ADMIN:       { label: 'Admin',       cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
  RECEPTIONIST:{ label: 'Receptionist',cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  STAFF:       { label: 'Staff',       cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
  Male:        { label: 'Male',        cls: 'bg-blue-50 text-blue-600 ring-blue-200' },
  Female:      { label: 'Female',      cls: 'bg-pink-50 text-pink-600 ring-pink-200' },
  Other:       { label: 'Other',       cls: 'bg-gray-100 text-gray-600 ring-gray-200' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-600 ring-gray-200' };
  return (
    <span className={`badge ring-1 ${config.cls}`}>
      {config.label}
    </span>
  );
}
