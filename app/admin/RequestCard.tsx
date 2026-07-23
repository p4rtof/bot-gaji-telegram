import { updateRequestStatus } from './actions';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function RequestCard({ request, readOnly = false }: { request: any; readOnly?: boolean }) {
  const approve = updateRequestStatus.bind(null, request.id, 'approved');
  const reject = updateRequestStatus.bind(null, request.id, 'rejected');

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-900">{request.users?.name ?? 'Tidak diketahui'}</span>
        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLE[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="text-sm text-zinc-600">
        {request.type === 'kasbon' ? 'Kasbon' : 'Reimburse'} · Rp{Number(request.amount).toLocaleString('id-ID')}
      </div>
      <div className="text-sm text-zinc-500">{request.reason}</div>

      {!readOnly && (
        <div className="flex gap-2 mt-2">
          <form action={approve}>
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors">
              Setujui
            </button>
          </form>
          <form action={reject}>
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">
              Tolak
            </button>
          </form>
        </div>
      )}
    </div>
  );
}