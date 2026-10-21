<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user')->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('entite', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q2) use ($search) {
                        $q2->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('table_name')) {
            $query->where('entite', $request->table_name);
        }

        if ($request->filled('entite')) {
            $query->where('entite', $request->entite);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate($request->input('per_page', 15));

        $logs->getCollection()->transform(function (AuditLog $log) {
            $log->table_name = $log->entite;
            $log->record_id = $log->entite_id;
            $log->user_name = $log->user ? $log->user->full_name : null;

            return $log;
        });

        return response()->json(['success' => true, 'data' => $logs]);
    }

    public function show(int $id): JsonResponse
    {
        $log = AuditLog::with('user', 'division')->find($id);

        if (!$log) {
            return response()->json(['success' => false, 'message' => 'Log introuvable'], 404);
        }

        $log->table_name = $log->entite;
        $log->record_id = $log->entite_id;

        return response()->json(['success' => true, 'data' => $log]);
    }

    public function stats(): JsonResponse
    {
        $byAction = AuditLog::select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->pluck('count', 'action');

        $byTable = AuditLog::select('entite as table_name', DB::raw('count(*) as count'))
            ->groupBy('entite')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'table_name');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => AuditLog::count(),
                'today' => AuditLog::whereDate('created_at', today())->count(),
                'this_week' => AuditLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'by_action' => $byAction,
                'by_table' => $byTable,
                'recent_activity' => AuditLog::with('user')->orderByDesc('created_at')->limit(5)->get(),
            ],
        ]);
    }

    public function tables(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => AuditLog::distinct()->orderBy('entite')->pluck('entite'),
        ]);
    }
}
